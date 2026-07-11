import { type NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiError, rateLimit, getClientIp } from "@/lib/api";
import { signPatientToken, PATIENT_COOKIE } from "@/lib/patient-auth";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`patient-login:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body: unknown = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { email, password } = parsed.data;

  const patient = await prisma.patientAccount.findUnique({ where: { email } });
  if (!patient) {
    return apiError("Invalid email or password.", 401);
  }

  const valid = await bcrypt.compare(password, patient.passwordHash);
  if (!valid) {
    return apiError("Invalid email or password.", 401);
  }

  const token = await signPatientToken({
    id: patient.id,
    email: patient.email,
    name: patient.name,
  });

  const res = NextResponse.json({ success: true, name: patient.name, email: patient.email });
  res.cookies.set(PATIENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });

  return res;
}
