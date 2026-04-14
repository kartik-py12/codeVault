import express from "express";
import { githubCallback, githubLogin, getCurrentUser, logout } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
const router = express.Router();

router.get("/github",githubLogin);

router.get("/github/callback",githubCallback);

router.get("/me", requireAuth, getCurrentUser);

router.post("/logout",logout);

export default router;
