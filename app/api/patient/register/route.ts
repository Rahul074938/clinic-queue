import { type NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess, rateLimit, getClientIp } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`patient-register:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body: unknown = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.patientAccount.findUnique({ where: { email } });
  if (existing) {
    return apiError("An account with this email already exists.", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const patient = await prisma.patientAccount.create({
    data: { name, email, passwordHash },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  return apiSuccess(patient, 201);
}
