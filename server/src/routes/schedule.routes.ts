import { Router } from "express";
import {
  getCollegeSlots,
  addCollegeSlot,
  removeCollegeSlot,
  getSavedTimetables,
  saveTimetable,
  deleteSavedTimetable,
  getHistory,
  generateTimetable,
} from "../controllers/schedule.controller.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = Router();

router.use(authenticateJWT);

router.post("/generate", generateTimetable);
router.get("/history", getHistory);

router.get("/college", getCollegeSlots);
router.post("/college", addCollegeSlot);
router.delete("/college/:id", removeCollegeSlot);

router.get("/saved", getSavedTimetables);
router.post("/saved", saveTimetable);
router.delete("/saved/:id", deleteSavedTimetable);

export default router;
