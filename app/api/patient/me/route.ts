import { type NextRequest } from "next/server";
import { getPatientSessionFromRequest } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api";

// GET /api/patient/me — get profile details
export async function GET(req: NextRequest) {
  const session = await getPatientSessionFromRequest(req);
  if (!session) return apiError("Unauthorized", 401);

  // Get full fresh data from the database
  const db = prisma as any;
  const patient = await db.patientAccount.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      pendingEmail: true,
    },
  });

  if (!patient) return apiError("Patient not found", 404);

  return apiSuccess(patient);
}
