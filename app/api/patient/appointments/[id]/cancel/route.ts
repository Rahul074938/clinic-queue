import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPatientSessionFromRequest } from "@/lib/patient-auth";
import { apiError, apiSuccess } from "@/lib/api";

/** POST /api/patient/appointments/[id]/cancel — allows patient to cancel their own appointment */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getPatientSessionFromRequest(req);
  if (!session) return apiError("Unauthorized", 401);

  const { id } = await params;

  const appointment = await prisma.appointment.findFirst({
    where: { id, deletedAt: null },
  });

  if (!appointment) return apiError("Appointment not found", 404);

  // Verify ownership by email
  if (appointment.patientEmail.toLowerCase() !== session.email.toLowerCase()) {
    return apiError("Forbidden", 403);
  }

  // Only SCHEDULED appointments can be cancelled by the patient
  if (appointment.status !== "SCHEDULED") {
    return apiError(
      `Cannot cancel an appointment with status: ${appointment.status}`,
      400
    );
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: "CANCELLED" },
    include: { doctor: true },
  });

  return apiSuccess(updated);
}
