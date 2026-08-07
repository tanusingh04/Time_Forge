import { Router } from "express";
import { getExams, addExam, removeExam } from "../controllers/exam.controller.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = Router();

router.use(authenticateJWT);

router.get("/", getExams);
router.post("/", addExam);
router.delete("/:id", removeExam);

export default router;
