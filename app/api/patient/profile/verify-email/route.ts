import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPatientSessionFromRequest, signPatientToken, PATIENT_COOKIE } from "@/lib/patient-auth";
import { apiError } from "@/lib/api";
import { z } from "zod";

const verifyEmailSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

// POST /api/patient/profile/verify-email — verify new email
export async function POST(req: NextRequest) {
  const session = await getPatientSessionFromRequest(req);
  if (!session) return apiError("Unauthorized", 401);

  const body = await req.json();
  const parsed = verifyEmailSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { code } = parsed.data;

  const db = prisma as any;
  const patient = await db.patientAccount.findUnique({
    where: { id: session.id },
  });

  if (!patient) return apiError("Patient not found", 404);
  if (!patient.pendingEmail || !patient.emailVerifyCode || !patient.emailVerifyExpiry) {
    // No verify request found
    return apiError("No pending email verification request found.", 400);
  }

  if (patient.emailVerifyExpiry < new Date()) {
    return apiError("Verification code has expired. Please request a new one.", 400);
  }

  if (patient.emailVerifyCode !== code) {
    return apiError("Invalid verification code.", 400);
  }

  // Update email address and clear pending fields
  const updatedPatient = await db.patientAccount.update({
    where: { id: session.id },
    data: {
      email: patient.pendingEmail,
      pendingEmail: null,
      emailVerifyCode: null,
      emailVerifyExpiry: null,
    },
  });

  // Generate a new JWT session cookie since the email changed
  const token = await signPatientToken({
    id: updatedPatient.id,
    email: updatedPatient.email,
    name: updatedPatient.name,
  });

  const res = NextResponse.json({
    success: true,
    patient: {
      id: updatedPatient.id,
      name: updatedPatient.name,
      email: updatedPatient.email,
      phone: updatedPatient.phone,
      pendingEmail: null,
    },
  });

  res.cookies.set(PATIENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });

  return res;
}
