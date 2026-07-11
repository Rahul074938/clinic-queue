import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPatientSessionFromRequest } from "@/lib/patient-auth";
import { apiError, apiSuccess } from "@/lib/api";

/** GET /api/patient/appointments — returns all appointments for the logged-in patient */
export async function GET(req: NextRequest) {
  const session = await getPatientSessionFromRequest(req);
  if (!session) return apiError("Unauthorized", 401);

  const appointments = await prisma.appointment.findMany({
    where: {
      patientEmail: { equals: session.email },
      deletedAt: null,
    },
    include: { doctor: true },
    orderBy: { scheduledAt: "desc" },
  });

  return apiSuccess(appointments);
}
