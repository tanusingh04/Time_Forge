import { Response } from "express";
import { prisma } from "../config/db.js";
import { generateAIResponseStream, type ChatMessage } from "../services/ai.service.js";
import { sendError } from "../utils/response.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";

export const chatStream = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, "Unauthorized", 401);

    const { message, history } = req.body as { message: string; history: ChatMessage[] };

    if (!message) {
      return sendError(res, "Message is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        syllabusFiles: { include: { modules: true } },
        tasks: { where: { completed: false } },
        exams: true,
        collegeTimetable: true,
      },
    });

    if (!user) {
      return sendError(res, "User not found", 404);
    }

    const aiContext = {
      syllabus: {
        subjects: user.syllabusFiles.map((s) => ({
          name: s.subject || "",
          modules: s.modules.map((m) => ({
            name: m.name,
            estimatedHours: m.estimatedHours || undefined,
          })),
        })),
      },
      tasks: {
        tasks: user.tasks.map((t) => ({
          title: t.title,
          subject: t.subject,
          duration: t.duration,
          priority: t.priority,
        })),
      },
      exams: user.exams.map((e) => ({
        title: e.title,
        subject: e.subject,
        date: e.date,
        time: e.time || undefined,
      })),
      collegeSlots: user.collegeTimetable.map((s) => ({
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
        subject: s.subject,
        roomOrCode: s.roomOrCode || undefined,
      })),
      profile: {
        name: user.name,
        course: user.course || undefined,
        semester: user.semester || undefined,
        institution: user.institution || undefined,
        studyHoursPerDay: user.studyHoursPerDay,
        goals: JSON.parse(user.goals || "[]"),
      },
    };

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = generateAIResponseStream(message, history || [], aiContext);

    for await (const chunk of stream) {
      res.write(chunk);
    }

    res.end();
  } catch (error: any) {
    logger.error("AI Chat Stream controller error: " + error);
    if (!res.headersSent) {
      return sendError(res, "AI streaming failed", 500);
    }
    res.end();
  }
};
