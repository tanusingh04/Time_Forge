import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/user.controller.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = Router();

router.use(authenticateJWT);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);

export default router;
