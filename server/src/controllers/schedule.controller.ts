import { Response } from "express";
import { prisma } from "../config/db.js";
import { createCollegeSlotSchema, saveTimetableSchema } from "../validation/schedule.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import crypto from "crypto";

// Helper interfaces
interface TimetableEntry {
  id: string;
  time: string;
  endTime: string;
  task: string;
  subject: string;
  type: "study" | "break" | "meal" | "exercise" | "personal";
}

// ─── College Slots ────────────────────────────────────────────────────────────

export const getCollegeSlots = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, "Unauthorized", 401);

    const slots = await prisma.collegeSlot.findMany({
      where: { userId: req.user.id },
    });

    return sendSuccess(res, slots);
  } catch (error: any) {
    return sendError(res, error.message || "Failed to load college slots", 500);
  }
};

export const addCollegeSlot = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, "Unauthorized", 401);

    const body = createCollegeSlotSchema.parse(req.body);

    const slot = await prisma.collegeSlot.create({
      data: {
        ...body,
        userId: req.user.id,
      },
    });

    return sendSuccess(res, slot, 201);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return sendError(res, "Validation failed", 400, error.errors);
    }
    return sendError(res, error.message || "Failed to add college slot", 500);
  }
};

export const removeCollegeSlot = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, "Unauthorized", 401);

    const { id } = req.params;

    const existingSlot = await prisma.collegeSlot.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existingSlot) {
      return sendError(res, "College slot not found or unauthorized", 404);
    }

    await prisma.collegeSlot.delete({
      where: { id },
    });

    return sendSuccess(res, { id });
  } catch (error: any) {
    return sendError(res, error.message || "Failed to remove college slot", 500);
  }
};

// ─── Saved Timetables ─────────────────────────────────────────────────────────

export const getSavedTimetables = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, "Unauthorized", 401);

    const saved = await prisma.savedTimetable.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    const parsed = saved.map((s) => ({ ...s, entries: JSON.parse(s.entries) }));
    return sendSuccess(res, parsed);
  } catch (error: any) {
    return sendError(res, error.message || "Failed to load saved timetables", 500);
  }
};

export const saveTimetable = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, "Unauthorized", 401);

    const body = saveTimetableSchema.parse(req.body);
    const name = body.name || `Timetable ${new Date().toLocaleDateString()}`;

    const saved = await prisma.savedTimetable.create({
      data: {
        name,
        entries: JSON.stringify(body.entries),
        userId: req.user.id,
      },
    });

    return sendSuccess(res, saved, 201);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return sendError(res, "Validation failed", 400, error.errors);
    }
    return sendError(res, error.message || "Failed to save timetable", 500);
  }
};

export const deleteSavedTimetable = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, "Unauthorized", 401);

    const { id } = req.params;

    const existing = await prisma.savedTimetable.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      return sendError(res, "Saved timetable not found or unauthorized", 404);
    }

    await prisma.savedTimetable.delete({
      where: { id },
    });

    return sendSuccess(res, { id });
  } catch (error: any) {
    return sendError(res, error.message || "Failed to delete saved timetable", 500);
  }
};

// ─── History Records ──────────────────────────────────────────────────────────

export const getHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, "Unauthorized", 401);

    const history = await prisma.dayRecord.findMany({
      where: { userId: req.user.id },
      orderBy: { date: "asc" },
    });

    const parsed = history.map((h) => ({ ...h, timetable: JSON.parse(h.timetable) }));
    return sendSuccess(res, parsed);
  } catch (error: any) {
    return sendError(res, error.message || "Failed to load history", 500);
  }
};

// ─── Timetable Generator ──────────────────────────────────────────────────────

export const generateTimetable = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, "Unauthorized", 401);

    // Fetch all user context needed for generation
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        collegeTimetable: true,
        syllabusFiles: { include: { modules: true } },
        tasks: true,
      },
    });

    if (!user) return sendError(res, "User not found", 404);

    const parseTime = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const formatTime = (mins: number) => {
      const h = Math.floor(mins / 60) % 24;
      const m = mins % 60;
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    };

    const wakeUp = parseTime(user.wakeUpTime || "06:00");
    const sleep = parseTime(user.sleepTime || "22:00");
    const entries: TimetableEntry[] = [];
    let currentTime = wakeUp;

    // Use a random variation index for scheduler flexibility
    const variationIndex = Math.floor(Math.random() * 4);

    // 1. Morning Routine
    const morningDuration = 25;
    entries.push({
      id: crypto.randomUUID(),
      time: formatTime(currentTime),
      endTime: formatTime(currentTime + morningDuration),
      task: "Morning Routine",
      subject: "Personal",
      type: "personal",
    });
    currentTime += morningDuration;

    // 2. Exercise
    const exerciseDuration = 25;
    entries.push({
      id: crypto.randomUUID(),
      time: formatTime(currentTime),
      endTime: formatTime(currentTime + exerciseDuration),
      task: "Exercise / Yoga",
      subject: "Health",
      type: "exercise",
    });
    currentTime += exerciseDuration;

    // 3. Breakfast
    const breakfastDuration = 20;
    entries.push({
      id: crypto.randomUUID(),
      time: formatTime(currentTime),
      endTime: formatTime(currentTime + breakfastDuration),
      task: "Breakfast",
      subject: "Meal",
      type: "meal",
    });
    currentTime += breakfastDuration;

    const todayDay = new Date().getDay();
    const collegeSlotsToday = user.collegeTimetable
      .filter((s) => s.day === todayDay)
      .map((s) => ({
        start: parseTime(s.startTime),
        end: parseTime(s.endTime),
        subject: s.subject,
        room: s.roomOrCode,
      }))
      .sort((a, b) => a.start - b.start);

    const isInCollegeSlot = (min: number) =>
      collegeSlotsToday.some((c) => min >= c.start && min < c.end);
    const getNextCollegeStart = (afterMin: number) =>
      collegeSlotsToday.find((c) => c.start > afterMin)?.start ?? 9999;
    const getCollegeSlotAt = (min: number) =>
      collegeSlotsToday.find((c) => min >= c.start && min < c.end);

    interface TopicEntry {
      subject: string;
      module: string;
      duration: number;
      priority: number;
    }

    const topicEntries: TopicEntry[] = [];
    const pendingTasks = user.tasks.filter((t) => !t.completed);

    const subjectsWithSyllabus = new Set<string>();
    user.syllabusFiles.forEach((s) => {
      if (s.subject) subjectsWithSyllabus.add(s.subject.toLowerCase());
    });

    user.syllabusFiles.forEach((syllabus) => {
      if (!syllabus.subject) return;

      const subjectKey = syllabus.subject.toLowerCase();
      const subjectTasks = pendingTasks.filter(
        (t) => t.subject.toLowerCase() === subjectKey
      );

      if (syllabus.modules && syllabus.modules.length > 0) {
        syllabus.modules.forEach((module) => {
          if (subjectTasks.length > 0) {
            subjectTasks.forEach((task) => {
              const moduleDuration = module.estimatedHours
                ? Math.min(module.estimatedHours * 60, task.duration)
                : task.duration;

              topicEntries.push({
                subject: syllabus.subject!,
                module: module.name,
                duration: moduleDuration,
                priority: task.priority === "high" ? 0 : task.priority === "medium" ? 1 : 2,
              });
            });
          } else {
            const moduleDuration = Math.min((module.estimatedHours || 1) * 60, 120);
            topicEntries.push({
              subject: syllabus.subject!,
              module: module.name,
              duration: moduleDuration,
              priority: 1,
            });
          }
        });
      } else if (subjectTasks.length > 0) {
        subjectTasks.forEach((task) => {
          topicEntries.push({
            subject: syllabus.subject!,
            module: task.title,
            duration: task.duration,
            priority: task.priority === "high" ? 0 : task.priority === "medium" ? 1 : 2,
          });
        });
      }
    });

    pendingTasks.forEach((task) => {
      const subjectKey = task.subject.toLowerCase();
      if (!subjectsWithSyllabus.has(subjectKey)) {
        topicEntries.push({
          subject: task.subject,
          module: task.title,
          duration: task.duration,
          priority: task.priority === "high" ? 0 : task.priority === "medium" ? 1 : 2,
        });
      }
    });

    if (topicEntries.length > 0) {
      const subjectGroups = new Map<string, TopicEntry[]>();
      topicEntries.forEach((entry) => {
        if (!subjectGroups.has(entry.subject)) {
          subjectGroups.set(entry.subject, []);
        }
        subjectGroups.get(entry.subject)!.push(entry);
      });

      const sortedTopics: TopicEntry[] = [];
      const subjects = Array.from(subjectGroups.keys());

      if (variationIndex === 0) {
        const priorityGroups = [[], [], []] as TopicEntry[][];
        topicEntries.forEach((t) => priorityGroups[t.priority].push(t));
        priorityGroups.forEach((group) => {
          const subjMap = new Map<string, TopicEntry[]>();
          group.forEach((t) => {
            if (!subjMap.has(t.subject)) subjMap.set(t.subject, []);
            subjMap.get(t.subject)!.push(t);
          });
          subjMap.forEach((topics) => sortedTopics.push(...topics));
        });
      } else if (variationIndex === 1) {
        subjects.forEach((subject) => {
          sortedTopics.push(...subjectGroups.get(subject)!);
        });
      } else if (variationIndex === 2) {
        const maxLength = Math.max(...Array.from(subjectGroups.values()).map((g) => g.length));
        for (let i = 0; i < maxLength; i++) {
          subjects.forEach((subject) => {
            const topics = subjectGroups.get(subject)!;
            if (topics[i]) sortedTopics.push(topics[i]);
          });
        }
      } else {
        sortedTopics.push(...topicEntries.sort((a, b) => a.duration - b.duration));
      }

      let studyBlocks = 0;
      const optimalStudyBlock = 50;
      const shortBreak = 10;
      const longBreak = 20;
      const lunchBreak = 45;

      for (const topic of sortedTopics) {
        let remainingDuration = topic.duration;

        while (remainingDuration > 0 && currentTime < sleep - 90) {
          while (isInCollegeSlot(currentTime)) {
            const slot = getCollegeSlotAt(currentTime);
            if (slot) {
              entries.push({
                id: crypto.randomUUID(),
                time: formatTime(slot.start),
                endTime: formatTime(slot.end),
                task: `College: ${slot.subject}${slot.room ? ` (${slot.room})` : ""}`,
                subject: slot.subject,
                type: "personal",
              });
              currentTime = slot.end;
            }
          }
          if (currentTime >= sleep - 90) break;

          const nextCollege = getNextCollegeStart(currentTime);
          const blockDuration = Math.min(
            remainingDuration,
            optimalStudyBlock,
            nextCollege - currentTime,
            sleep - 90 - currentTime
          );
          if (blockDuration <= 0) {
            const slot = getCollegeSlotAt(currentTime);
            if (slot) currentTime = slot.end;
            else break;
            continue;
          }

          entries.push({
            id: crypto.randomUUID(),
            time: formatTime(currentTime),
            endTime: formatTime(currentTime + blockDuration),
            task: `${topic.subject}: ${topic.module}`,
            subject: topic.subject,
            type: "study",
          });
          currentTime += blockDuration;
          remainingDuration -= blockDuration;
          studyBlocks++;

          if (remainingDuration > 0 || studyBlocks % 3 === 0) {
            if (studyBlocks >= 6 && currentTime + lunchBreak <= sleep - 60) {
              entries.push({
                id: crypto.randomUUID(),
                time: formatTime(currentTime),
                endTime: formatTime(currentTime + lunchBreak),
                task: "Lunch Break",
                subject: "Meal",
                type: "meal",
              });
              currentTime += lunchBreak;
              studyBlocks = 0;
            } else if (studyBlocks % 3 === 0) {
              entries.push({
                id: crypto.randomUUID(),
                time: formatTime(currentTime),
                endTime: formatTime(currentTime + longBreak),
                task: "Long Break",
                subject: "Rest",
                type: "break",
              });
              currentTime += longBreak;
            } else if (remainingDuration > 0) {
              entries.push({
                id: crypto.randomUUID(),
                time: formatTime(currentTime),
                endTime: formatTime(currentTime + shortBreak),
                task: "Short Break",
                subject: "Rest",
                type: "break",
              });
              currentTime += shortBreak;
            }
          }
        }
      }
    }

    const remainingTime = sleep - 90 - currentTime;
    if (remainingTime > 60 && topicEntries.length === 0) {
      const studyBlocks = Math.floor(remainingTime / (50 + 10));
      for (let i = 0; i < studyBlocks && currentTime + 50 < sleep - 90; i++) {
        entries.push({
          id: crypto.randomUUID(),
          time: formatTime(currentTime),
          endTime: formatTime(currentTime + 50),
          task: `Study Block ${i + 1}`,
          subject: "General",
          type: "study",
        });
        currentTime += 50;

        if (i < studyBlocks - 1) {
          entries.push({
            id: crypto.randomUUID(),
            time: formatTime(currentTime),
            endTime: formatTime(currentTime + 10),
            task: "Break",
            subject: "Rest",
            type: "break",
          });
          currentTime += 10;
        }
      }
    }

    const dinnerTime = 60;
    const windDownTime = 30;

    entries.push({
      id: crypto.randomUUID(),
      time: formatTime(sleep - dinnerTime - windDownTime),
      endTime: formatTime(sleep - windDownTime),
      task: "Dinner",
      subject: "Meal",
      type: "meal",
    });
    entries.push({
      id: crypto.randomUUID(),
      time: formatTime(sleep - windDownTime),
      endTime: formatTime(sleep),
      task: "Wind Down & Reflect",
      subject: "Personal",
      type: "personal",
    });

    entries.sort((a, b) => parseTime(a.time) - parseTime(b.time));

    // Save/Update today's day record history
    const todayISO = new Date().toISOString().split("T")[0];
    const completedCount = user.tasks.filter((t) => t.completed).length;
    const rate = user.tasks.length > 0 ? Math.round((completedCount / user.tasks.length) * 100) : 0;

    const dayRecord = await prisma.dayRecord.upsert({
      where: {
        userId_date: {
          userId: req.user.id,
          date: todayISO,
        },
      },
      update: {
        timetable: JSON.stringify(entries),
        completionRate: rate,
      },
      create: {
        userId: req.user.id,
        date: todayISO,
        timetable: JSON.stringify(entries),
        completionRate: rate,
      },
    });

    return sendSuccess(res, {
      timetable: entries,
      dayRecord,
    });
  } catch (error: any) {
    return sendError(res, error.message || "Failed to generate timetable", 500);
  }
};
