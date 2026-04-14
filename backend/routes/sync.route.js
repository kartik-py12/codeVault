import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { syncLeetCodeSubmission } from "../controllers/sync.controller.js";

const router = express.Router();

// The path here is just "/", because in index.js we will mount this router at "/api/sync"
router.post("/", requireAuth, syncLeetCodeSubmission);

export default router;