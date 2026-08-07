import { Response } from "express";
import { prisma } from "../config/db.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

export const getAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, "Unauthorized", 401);

    const userId = req.user.id;

    const totalTasks = await prisma.task.count({ where: { userId } });
    const completedTasks = await prisma.task.count({ where: { userId, completed: true } });
    const pendingTasks = totalTasks - completedTasks;

    const history = await prisma.dayRecord.findMany({
      where: { userId },
      orderBy: { date: "asc" },
    });

    let streak = 0;
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const dates = new Set(history.map(h => h.date));

    let checkDate = new Date();
    if (!dates.has(todayStr)) {
      checkDate = yesterday;
    }

    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (dates.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const avgCompletionRate = history.length > 0
      ? Math.round(history.reduce((sum, h) => sum + h.completionRate, 0) / history.length)
      : 0;

    return sendSuccess(res, {
      totalTasks,
      completedTasks,
      pendingTasks,
      streak,
      avgCompletionRate,
      history,
    });
  } catch (error: any) {
    return sendError(res, error.message || "Failed to load analytics", 500);
  }
};
