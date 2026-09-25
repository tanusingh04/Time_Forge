import { Response } from "express";
import { prisma } from "../config/db.js";
import { createExamSchema } from "../validation/exam.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

export const getExams = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, "Unauthorized", 401);

    const exams = await prisma.exam.findMany({
      where: { userId: req.user.id },
      orderBy: { date: "asc" },
    });

    return sendSuccess(res, exams);
  } catch (error: any) {
    return sendError(res, error.message || "Failed to load exams", 500);
  }
};

export const addExam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, "Unauthorized", 401);

    const body = createExamSchema.parse(req.body);

    const exam = await prisma.exam.create({
      data: {
        ...body,
        userId: req.user.id,
      },
    });

    return sendSuccess(res, exam, 201);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return sendError(res, "Validation failed", 400, error.errors);
    }
    return sendError(res, error.message || "Failed to add exam", 500);
  }
};

export const removeExam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, "Unauthorized", 401);

    const { id } = req.params;

    const existingExam = await prisma.exam.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existingExam) {
      return sendError(res, "Exam not found or unauthorized", 404);
    }

    await prisma.exam.delete({
      where: { id },
    });

    return sendSuccess(res, { id });
  } catch (error: any) {
    return sendError(res, error.message || "Failed to remove exam", 500);
  }
};
