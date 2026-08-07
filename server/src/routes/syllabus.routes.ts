import { Router } from "express";
import {
  getSyllabusFiles,
  uploadSyllabusFile,
  downloadSyllabusFile,
  deleteSyllabusFile,
  addModule,
  removeModule,
} from "../controllers/syllabus.controller.js";
import { authenticateJWT } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.get("/:id/download", downloadSyllabusFile);

router.use(authenticateJWT);

router.get("/", getSyllabusFiles);
router.post("/", upload.single("file"), uploadSyllabusFile);
router.delete("/:id", deleteSyllabusFile);

router.post("/:id/modules", addModule);
router.delete("/:id/modules/:moduleId", removeModule);

export default router;
