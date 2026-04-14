# CodeVault - DSA Submission Tracker

> A full-stack platform to synchronize, track, and analyze coding practice across platforms with AI-powered mentoring and progress visualization.

## Features

- **Secure Auth** — GitHub OAuth 2.0 with encrypted token storage
- **Real-Time Sync** — Chrome extension for automatic submission capture
- **Problem Metadata** — Automatic enrichment of problem details (difficulty, topics, content)
- **Performance Metrics** — Built-in observability with Prometheus for monitoring
- **AI-Powered Analysis** — Get personalized insights using Gemini 3 Flash for each solution
- **Progress Dashboard** — Visualize your DSA journey with interactive heatmaps and problem tracking
- **Smart Organization** — Filter by difficulty, topics, platform, and sync status




## Tech Stack

| Layer       | Technology | Purpose |
|-------------|-----------|---------|
| **Backend** | Node.js (ESM) + Express 5.x | Server framework & routing |
| **Frontend** | React 19 + Vite + Tailwind CSS | Modern UI framework |
| **Extension** | Chrome Extension APIs | LeetCode submission interception |
| **Database** | MongoDB 9.x + Mongoose ODM | Primary data persistence |
| **Cache** | Redis 5.x | Token blacklist & session management |
| **Async** | RabbitMQ (AMQP) | Distributed job queue with DLX |
| **Auth** | JWT + GitHub OAuth 2.0 | Secure authentication & authorization |
| **AI** | Google Genai SDK (Gemini 3 Flash) | Code analysis & mentoring |
| **Monitoring** | Prometheus + prom-client | Metrics & observability |
| **Security** | Helmet, CORS, Rate Limiting | HTTP security headers & protection |

## Architecture Overview

CodeVault follows a **microservices-inspired backend architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│           (Dashboard, Problem Detail, Landing Pages)         │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST
┌──────────────────────▼──────────────────────────────────────┐
│                    Load Balancer & CORS                     │
│         (Rate Limiting, Helmet, Request Logging)            │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
   ┌────▼─────┐              ┌──────▼──────────┐
   │  Auth    │              │  Sync & Data    │
   │ Routes   │              │  Routes         │
   └────┬─────┘              └──────┬──────────┘
        │                           │
   ┌────▼─────────────────────────▼─────┐
   │      MongoDB (User + Submissions)   │
   │     Redis Cache & Token Blacklist   │
   └─────────────────────────────────────┘
        │
   ┌────┴──────────────────────┐
   │     RabbitMQ Work Queues   │
   │  (Async Job Distribution)  │
   └────┬──────────────────────┘
        │
   ┌────┴──────────────────────────────────────────┐
   │                                                │
   │  ┌─────────────────┐    ┌─────────────────┐  │
   │  │  Gemini AI      │    │  GitHub API     │  │
   │  │  Worker         │    │  Worker         │  │
   │  └─────────────────┘    └─────────────────┘  │
   │  (Code Analysis)        (Repo Sync)          │
   │                                                │
   └────────────────────────────────────────────────┘

   ┌──────────────────────────────┐
   │  Prometheus Metrics Exporter │
   │  (HTTP request latency)      │
   └──────────────────────────────┘
```


## Backend Architecture - Key Components

### 1. **Authentication Layer** (`/middleware/auth.middleware.js`)

**Design Decision:** JWT-based stateless authentication with Redis-backed token revocation

```javascript
// Flow:
User GitHub OAuth → Exchange code for access token 
  → Create/Update user in MongoDB 
  → Issue JWT cookie (codevault_jwt) 
  → Store encrypted GitHub token for later API calls
```

**Key Features:**
- CSRF protection via state parameter validation
- Scoped GitHub OAuth (read:user, user:email, repo)
- Encrypted GitHub tokens stored per user
- Token revocation via Redis blacklist on logout
- Dual token support (cookie + Bearer header)

### 2. **Submission Management** (`/controllers/sync.controller.js`)

**Design Pattern:** Repository Pattern + Lazy Loading + Horizontal Scaling

**Problem Statement:**
- Users submit code across platforms (LeetCode, GFG, Codeforces)
- Problem metadata (difficulty, tags, content) often incomplete in initial sync
- Backend must enrich data on-demand without blocking user requests

**Solution Implemented:**

```
Sync Request (Extension)
  ↓
Create submission with available metadata
  ↓
Enqueue metadata fetch job (RabbitMQ)
  ↓
Return immediately to frontend (Fast sync)
  ↓
Worker fetches from LeetCode GraphQL in background
  ↓
Update submission with rich metadata
  ↓
Trigger AI notes generation (secondary job)
```

**Key Implementation Details:**

- **Problem Slug Resolution:** Extract from URL or generate via title normalization
- **LeetCode GraphQL Integration:** Query difficulty, content, and topic tags
- **Automatic Retry Logic:** 4-tier exponential backoff (5s → 30s → 2m → 10m)
- **Aggregation Pipelines:** MongoDB `$group` stage to fetch latest-per-problem across all submissions

### 3. **Async Job Processing** (`/utils/rabbitmq.js` + Workers)

**Architecture: Dead-Letter Exchange (DLX) Pattern**

```
Primary Queue (GITHUB_SYNC / GEMINI_NOTES)
  ↓
Worker processes job
  ↓
├─ Success → Acknowledge & remove
└─ Failure → Send to Retry Queue N (with TTL)
              ↓
              Retry Worker picks up after TTL expires
              ↓
              └─ Max retries exceeded → Dead Letter Queue
                 (Manual investigation required)
```

**Why This Approach?**
- **Fault Tolerance:** Network failures and API rate limits don't crash the system
- **Observability:** Dead-letter queue acts as automatic alerting for chronic failures
- **Decoupling:** Workers can scale independently; submission creation isn't blocked
- **Backpressure:** RabbitMQ channels honor prefetch counts (prevent worker overload)

**Retry Strategy:**
```javascript
RETRY_DELAYS_MS = [5000, 30000, 120000, 600000]
// 1st retry after 5 seconds
// 2nd retry after 30 seconds  
// 3rd retry after 2 minutes
// 4th retry after 10 minutes
// → Dead Letter Queue if still failing
```

### 4. **AI Integration** (`/workers/geminiWorker.js`)

**Purpose:** Transform raw code + problem into interview-ready notes

**Workflow:**
```
User submits problem solution
  ↓
Backend creates submission (fast path)
  ↓
Enqueues GEMINI_NOTES job
  ↓
AI Worker picks up job:
  - Loads problem description + user's code
  - Prompts Gemini 3 Flash with role context ("Senior mentor")
  - Extracts structured JSON:
    • intuition: Your approach explained
    • timeComplexity: O(n), O(log n), etc.
    • spaceComplexity: O(1), O(n), etc.
    • followUps: Interview follow-up questions with hints
    • howToAnswer: Communication guide for interviewer
  ↓
Updates submission.aiNotes document
```

**Why Gemini 3 Flash?**
- Fast inference (suitable for async job processing)
- Cost-effective per-token pricing
- Reliable JSON output mode
- Multi-language code understanding

### 5. **Data Persistence** (`/models/`)

**User Model:**
```javascript
{
  githubId: String (indexed, unique),
  email: String,
  username: String,
  avatarUrl: String,
  encryptedGithubToken: String (for repo sync operations),
  createdAt: Date,
  updatedAt: Date
}
```

**Submission Model:**
```javascript
{
  userId: ObjectId (indexed for user queries),
  problemTitle: String (indexed for search),
  code: String,
  language: String,
  platform: "LeetCode" | "GFG" | etc.,
  difficulty: String (enum: Easy, Medium, Hard),
  problemContent: String (HTML from LeetCode),
  topicTags: [String] (indexed for filtering),
  externalUrl: String (back-link to original problem),
  status: "TODO" | "PENDING" | "COMPLETED" | "FAILED",
  syncType: "GITHUB_SYNC" | "TODO",
  aiNotes: {
    intuition: String,
    timeComplexity: String,
    spaceComplexity: String,
    followUps: [{question, hint}],
    howToAnswer: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexing Strategy:**
- Composite index: `(userId, createdAt)` for user feed sorting
- Separate index on `topicTags` for filtering
- Text index on `problemTitle` for search functionality

### 6. **Observability & Monitoring** (`/metrics`)

**Prometheus Integration:**
- `http_request_duration_seconds` histogram with latency buckets: [0.1s, 0.3s, 0.5s, 0.7s, 1s, 3s, 5s, 7s, 10s]
- Tagged by: method, route, status_code
- Exposed at `/metrics` endpoint (Prometheus scrape target)

**Why This Matters:**
- Identify slow endpoints for optimization
- Alert on high error rates (5xx responses)
- Volume analysis (GET vs POST distribution)
- SLA tracking for critical paths

## API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/github/login` | Initiate OAuth flow | ✗ |
| GET | `/github/callback` | GitHub OAuth callback handler | ✗ |
| POST | `/logout` | Revoke JWT token | ✓ |
| GET | `/user` | Fetch authenticated user profile | ✓ |

### Sync & Data Routes (`/api/sync`)

| Method | Endpoint | Request Body | Response | Auth |
|--------|----------|--------------|----------|------|
| POST | `/submit` | `{stats, userCode, problemDetails, syncType}` | `{submissionId, status}` | ✓ |
| GET | `/problems` | Query params: `{skip, limit, search, filters}` | `[{submissions}]` | ✓ |
| GET | `/problem/:title` | - | `{problemData, submissions[]}` | ✓ |

## Security & Resilience Patterns

### 1. **Rate Limiting**
```javascript
windowMs: 15 minutes
max: 100 requests per IP
→ Returns 429 on excess (automatically retried by client)
```

### 2. **CORS & CSRF**
- Explicit origin whitelist: `leetcode.com`, `localhost:5173`
- CSRF state parameter on OAuth (prevents cross-site attacks)
- SameSite cookies + Secure flag in production

### 3. **Token Encryption**
- GitHub OAuth tokens encrypted before storage (via symmetric encryption)
- Decrypted in-memory only when needed for GitHub API calls
- Never logged or exposed in error messages

### 4. **Input Validation & Sanitization**
- JSON payload size limit: 10 MB (prevents memory bloat)
- Problem titles normalized via slug generation (prevents injection)
- Code blocks stored as-is (execution never happens server-side)

## Deployment & Scaling Considerations

### Horizontal Scaling
```
Load Balancer
  ↓
┌─────────────┬─────────────┬─────────────┐
│ API Pod 1   │ API Pod 2   │ API Pod 3   │
└──────┬──────┴──────┬──────┴──────┬──────┘
       │ (all read from)
       ├─ MongoDB Replica Set
       ├─ Redis Sentinel (high availability)
       └─ RabbitMQ Cluster

Separate worker pods (auto-scale based on queue depth)
  ├─ Gemini Workers (CPU-bound, process on demand)
  └─ GitHub Sync Workers (I/O-bound, run in parallel)
```

### Environment Variables
```
MONGODB_URI          → Connection string (prod: Atlas, dev: local)
REDIS_URL            → Redis instance (prod: managed, dev: local)
RABBITMQ_URI         → RabbitMQ broker
JWT_SECRET           → Signing key (rotated periodically)
GITHUB_CLIENT_ID     → OAuth application ID
GITHUB_CLIENT_SECRET → OAuth application secret
ENCRYPTION_KEY       → AES-256 key for token storage
```


## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 9.x
- Redis 5.x
- RabbitMQ 3.x
- GitHub OAuth application credentials

### Installation

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ../extension && npm install

# Configure environment variables
cp backend/.env.example backend/.env
# Edit variables: MONGODB_URI, REDIS_URL, RABBITMQ_URI, etc.
```

### Running Locally

**Backend:**
```bash
cd backend
npm start  # Runs on port 3000 with hot-reload via Nodemon
```

**Frontend:**
```bash
cd frontend
npm run dev  # Runs on port 5173 with Vite
```

**Extension (Chrome):**
```bash
cd extension
npm run build
# Load dist/ folder in Chrome Extensions > Load Unpacked
```

**Workers:**
```bash
# In separate terminals:
node backend/workers/geminiWorker.js
node backend/workers/githubWorker.js
```

### Docker Compose Quick Start
```bash
docker-compose up  # Spins up MongoDB, Redis, RabbitMQ
npm start          # Start backend in another terminal
```

## Project Structure

```
codeVault/
├── backend/                    # Node.js + Express API
│   ├── controllers/            # Business logic
│   ├── models/                 # MongoDB schemas
│   ├── routes/                 # API endpoints
│   ├── middleware/             # Auth, logging
│   ├── utils/                  # RabbitMQ, Redis, encryption
│   ├── workers/                # Async job processors
│   └── db/                     # Database connection
│
├── frontend/                   # React 19 + Vite
│   ├── src/
│   │   ├── pages/              # Landing, Dashboard, Problem
│   │   ├── components/         # Reusable UI components
│   │   ├── api/                # API client integration
│   │   └── data/               # Constants
│   └── vite.config.js
│
└── extension/                  # Chrome Extension
    ├── src/
    │   ├── background/         # Service worker
    │   ├── content/            # Page injection script
    │   └── popup/              # Extension popup UI
    └── manifest.json
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

## License

MIT License - See LICENSE file for details

## Support

For issues, feature requests, or questions, please open an issue on GitHub or reach out to the development team.

---

**Track your DSA journey. Organize your progress. Master algorithms.**
