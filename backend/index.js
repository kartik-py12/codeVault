import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import client from "prom-client";

import connectDB from "./db/connect.js";
import { connectRabbitMQ } from "./utils/rabbitmq.js";

import authRoutes from "./routes/auth.route.js";    
import syncRoutes from "./routes/sync.route.js"; 
import { connectRedis } from "./utils/redis.js";

const app = express();
const PORT = process.env.PORT || 3000;

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10] // Latency buckets
});
register.registerMetric(httpRequestDurationMicroseconds);

app.use((req, res, next) => {
    const end = httpRequestDurationMicroseconds.startTimer();
    res.on('finish', () => {
        end({ method: req.method, route: req.route ? req.route.path : req.path, status_code: res.statusCode });
    });
    next();
});

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, error: "Too many requests from this IP, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: ["https://leetcode.com", "http://localhost:5173"],
    methods: ["POST", "OPTIONS", "GET"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.use("/api/auth", authRoutes);
app.use("/api/sync", syncRoutes); 


app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await connectDB();
    await connectRabbitMQ();
    await connectRedis();
});