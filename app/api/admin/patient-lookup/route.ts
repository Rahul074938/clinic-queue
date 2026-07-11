export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

/** GET /api/admin/patient-lookup?email= — returns all appointments for a patient email (staff/admin only) */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(["ADMIN", "STAFF"]);
  if (authResult instanceof NextResponse) return authResult;

  const url = new URL(req.url);
  const parsed = schema.safeParse({ email: url.searchParams.get("email") ?? "" });
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid email");
  }

  const { email } = parsed.data;

  const appointments = await prisma.appointment.findMany({
    where: {
      patientEmail: { equals: email, mode: "insensitive" },
      deletedAt: null,
    },
    include: { doctor: true },
    orderBy: { scheduledAt: "desc" },
  });

  // Also try to find if they have a patient account
  const patientAccount = await prisma.patientAccount.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return apiSuccess({ appointments, patientAccount });
}
