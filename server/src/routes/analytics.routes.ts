import { Router } from "express";
import { getAnalytics } from "../controllers/analytics.controller.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = Router();

router.use(authenticateJWT);

router.get("/", getAnalytics);

export default router;
