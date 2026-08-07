import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import taskRoutes from "./task.routes.js";
import scheduleRoutes from "./schedule.routes.js";
import examRoutes from "./exam.routes.js";
import syllabusRoutes from "./syllabus.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import aiRoutes from "./ai.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/tasks", taskRoutes);
router.use("/schedule", scheduleRoutes);
router.use("/exams", examRoutes);
router.use("/syllabus", syllabusRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/ai", aiRoutes);

export default router;
