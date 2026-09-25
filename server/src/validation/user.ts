import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  institution: z.string().optional(),
  course: z.string().optional(),
  semester: z.string().optional(),
  studyHoursPerDay: z.number().int().min(1).max(24).optional(),
  wakeUpTime: z.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format").optional(),
  sleepTime: z.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format").optional(),
  goals: z.array(z.string()).optional(),
});
