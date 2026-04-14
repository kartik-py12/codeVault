import express from "express";
import { githubCallback, githubLogin, logout } from "../controllers/auth.controller.js";
const router = express.Router();

router.get("/github",githubLogin);

router.get("/github/callback",githubCallback);

router.post("/logout",logout);

export default router;
