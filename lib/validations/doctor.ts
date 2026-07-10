import { z } from "zod";

export const createDoctorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  specialty: z.string().min(2, "Specialty is required").max(100),
  room: z.string().min(1, "Room is required").max(50),
  avatarColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color").default("#06b6d4"),
});

export const updateDoctorSchema = createDoctorSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
