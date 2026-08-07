import { Response } from "express";
import { prisma } from "../config/db.js";
import { updateProfileSchema } from "../validation/user.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, "Unauthorized", 401);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        institution: true,
        course: true,
        semester: true,
        studyHoursPerDay: true,
        wakeUpTime: true,
        sleepTime: true,
        goals: true,
      },
    });

    if (!user) return sendError(res, "User not found", 404);

    return sendSuccess(res, { ...user, goals: JSON.parse(user.goals || "[]") });
  } catch (error: any) {
    return sendError(res, error.message || "Failed to load profile", 500);
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, "Unauthorized", 401);

    const body = updateProfileSchema.parse(req.body);

    const dataToUpdate: any = { ...body };
    if (body.goals) {
      dataToUpdate.goals = JSON.stringify(body.goals);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        name: true,
        institution: true,
        course: true,
        semester: true,
        studyHoursPerDay: true,
        wakeUpTime: true,
        sleepTime: true,
        goals: true,
      },
    });

    return sendSuccess(res, { ...updatedUser, goals: JSON.parse(updatedUser.goals || "[]") });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return sendError(res, "Validation failed", 400, error.errors);
    }
    return sendError(res, error.message || "Failed to update profile", 500);
  }
};
