import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPatientSessionFromRequest } from "@/lib/patient-auth";
import { apiError, apiSuccess } from "@/lib/api";
import { sendEmail } from "@/lib/email";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
});

// PATCH /api/patient/profile — update profile
export async function PATCH(req: NextRequest) {
  const session = await getPatientSessionFromRequest(req);
  if (!session) return apiError("Unauthorized", 401);

  const body = await req.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { name, phone, email } = parsed.data;

  // Fetch current user details
  const patient = await prisma.patientAccount.findUnique({
    where: { id: session.id },
  });
  if (!patient) return apiError("Patient not found", 404);

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;

  let emailVerifyInitiated = false;

  if (email && email.toLowerCase() !== patient.email.toLowerCase()) {
    // Check if new email is already taken
    const existing = await prisma.patientAccount.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return apiError("Email is already in use by another account.", 409);
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes TTL

    updateData.pendingEmail = email.toLowerCase();
    updateData.emailVerifyCode = code;
    updateData.emailVerifyExpiry = expiry;
    emailVerifyInitiated = true;

    // Send email to new email ID
    await sendEmail({
      to: email.toLowerCase(),
      subject: "Verify your new email address",
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 10px;">
          <h2 style="color: #0d9488;">Verify your email address</h2>
          <p>You requested to update your email address on ClinicQueue to <strong>${email}</strong>.</p>
          <p>Please enter the following 6-digit verification code to complete the update:</p>
          <div style="font-size: 24px; font-weight: bold; tracking-width: 4px; padding: 10px; background-color: #f1f5f9; border-radius: 5px; text-align: center; margin: 20px 0;">
            ${code}
          </div>
          <p style="font-size: 12px; color: #64748b;">This code is valid for 15 minutes. If you did not request this change, please ignore this email.</p>
        </div>
      `,
    });
  }

  const updatedPatient = await prisma.patientAccount.update({
    where: { id: session.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      pendingEmail: true,
    },
  });

  return apiSuccess({
    patient: updatedPatient,
    emailVerifyInitiated,
  });
}
