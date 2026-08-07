import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  subject: z.string().min(1, "Subject is required"),
  duration: z.number().int().positive("Duration must be a positive integer"),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  duration: z.number().int().positive().optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  completed: z.boolean().optional(),
  scheduledTime: z.string().nullable().optional(),
});
