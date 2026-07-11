import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPatientSessionFromRequest } from "@/lib/patient-auth";
import { apiError, apiSuccess } from "@/lib/api";
import { z } from "zod";

const verifyPhoneSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

export async function POST(req: NextRequest) {
  const session = await getPatientSessionFromRequest(req);
  if (!session) return apiError("Unauthorized", 401);

  const body = await req.json();
  const parsed = verifyPhoneSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { code } = parsed.data;

  const db = prisma as any;
  const patient = await db.patientAccount.findUnique({
    where: { id: session.id },
  });

  if (!patient) return apiError("Patient not found", 404);
  if (!patient.pendingPhone || !patient.phoneVerifyCode || !patient.phoneVerifyExpiry) {
    return apiError("No pending phone verification request found.", 400);
  }

  if (patient.phoneVerifyExpiry < new Date()) {
    return apiError("Verification code has expired. Please request a new one.", 400);
  }

  if (patient.phoneVerifyCode !== code) {
    return apiError("Invalid verification code.", 400);
  }

  // Update phone number and clear pending fields
  const updatedPatient = await db.patientAccount.update({
    where: { id: session.id },
    data: {
      phone: patient.pendingPhone,
      pendingPhone: null,
      phoneVerifyCode: null,
      phoneVerifyExpiry: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      pendingEmail: true,
      pendingPhone: true,
    },
  });

  return apiSuccess({
    success: true,
    patient: updatedPatient,
  });
}
