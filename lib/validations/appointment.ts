import { z } from "zod";

export const createAppointmentSchema = z.object({
  patientName: z.string().min(2, "Name must be at least 2 characters").max(100),
  patientPhone: z.string().min(7, "Invalid phone number").max(20),
  patientEmail: z.string().email("Invalid email address"),
  doctorId: z.string().min(1, "Please select a doctor"),
  scheduledAt: z.string().datetime("Invalid date/time"),
  notes: z.string().max(500).optional(),
});

export const updateAppointmentSchema = z.object({
  status: z.enum(["SCHEDULED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  notes: z.string().max(500).optional(),
  scheduledAt: z.string().datetime().optional(),
  doctorId: z.string().optional(),
});

export const checkInSchema = z.object({
  token: z.string().min(1, "Check-in token is required"),
});

export const appointmentListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().max(100).optional(),
  status: z.enum(["SCHEDULED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW", "all"]).optional(),
  doctorId: z.string().optional(),
  date: z.string().optional(),
  sortBy: z.enum(["scheduledAt", "patientName", "createdAt", "status"]).default("scheduledAt"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type AppointmentListInput = z.infer<typeof appointmentListSchema>;
