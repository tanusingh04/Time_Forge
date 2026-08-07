import { z } from "zod";

export const createCollegeSlotSchema = z.object({
  day: z.number().int().min(0).max(6, "Day must be between 0 (Sunday) and 6 (Saturday)"),
  startTime: z.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid start time format"),
  endTime: z.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid end time format"),
  subject: z.string().min(1, "Subject is required"),
  roomOrCode: z.string().optional().nullable(),
});

export const saveTimetableSchema = z.object({
  name: z.string().optional().nullable(),
  entries: z.array(z.object({
    id: z.string(),
    time: z.string(),
    endTime: z.string(),
    task: z.string(),
    subject: z.string(),
    type: z.enum(["study", "break", "meal", "exercise", "personal"]),
  })),
});
