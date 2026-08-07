import { Router } from "express";
import { getTasks, createTask, updateTask, deleteTask } from "../controllers/task.controller.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = Router();

router.use(authenticateJWT);

router.get("/", getTasks);
router.post("/", createTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;
