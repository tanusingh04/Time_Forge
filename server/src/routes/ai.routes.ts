import { Router } from "express";
import { chatStream } from "../controllers/ai.controller.js";
import { authenticateJWT } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/chat", authenticateJWT, aiLimiter, chatStream);

export default router;
