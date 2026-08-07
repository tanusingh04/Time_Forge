import { Response } from "express";
import { prisma } from "../config/db.js";
import { createTaskSchema, updateTaskSchema } from "../validation/task.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { notificationService } from "../services/notification.service.js";

export const getTasks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, "Unauthorized", 401);

    const { q, completed, priority, sortBy, order } = req.query;

    const where: any = {
      userId: req.user.id,
    };

    if (q) {
      where.OR = [
        { title: { contains: String(q), mode: "insensitive" } },
        { subject: { contains: String(q), mode: "insensitive" } },
      ];
    }

    if (completed !== undefined) {
      where.completed = completed === "true";
    }

    if (priority) {
      where.priority = String(priority);
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[String(sortBy)] = order === "desc" ? "desc" : "asc";
    } else {
      orderBy.createdAt = "desc";
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy,
    });

    return sendSuccess(res, tasks);
  } catch (error: any) {
    return sendError(res, error.message || "Failed to load tasks", 500);
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, "Unauthorized", 401);

    const body = createTaskSchema.parse(req.body);

    const task = await prisma.task.create({
      data: {
        ...body,
        userId: req.user.id,
      },
    });

    if (task.scheduledTime) {
      const scheduleTime = new Date(task.scheduledTime);
      if (scheduleTime > new Date()) {
        notificationService.scheduleTaskNotification(task.id, task.title, scheduleTime, task.userId);
      }
    }

    return sendSuccess(res, task, 201);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return sendError(res, "Validation failed", 400, error.errors);
    }
    return sendError(res, error.message || "Failed to create task", 500);
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, "Unauthorized", 401);

    const { id } = req.params;
    const body = updateTaskSchema.parse(req.body);

    const existingTask = await prisma.task.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existingTask) {
      return sendError(res, "Task not found or unauthorized", 404);
    }

    const task = await prisma.task.update({
      where: { id },
      data: body,
    });

    if (body.completed) {
      notificationService.cancelTaskNotification(task.id);
    } else if (body.scheduledTime !== undefined) {
      if (task.scheduledTime) {
        const scheduleTime = new Date(task.scheduledTime);
        if (scheduleTime > new Date()) {
          notificationService.scheduleTaskNotification(task.id, task.title, scheduleTime, task.userId);
        } else {
          notificationService.cancelTaskNotification(task.id);
        }
      } else {
        notificationService.cancelTaskNotification(task.id);
      }
    }

    return sendSuccess(res, task);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return sendError(res, "Validation failed", 400, error.errors);
    }
    return sendError(res, error.message || "Failed to update task", 500);
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, "Unauthorized", 401);

    const { id } = req.params;

    const existingTask = await prisma.task.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existingTask) {
      return sendError(res, "Task not found or unauthorized", 404);
    }

    await prisma.task.delete({
      where: { id },
    });

    notificationService.cancelTaskNotification(id);

    return sendSuccess(res, { id });
  } catch (error: any) {
    return sendError(res, error.message || "Failed to delete task", 500);
  }
};
