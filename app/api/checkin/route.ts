import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkInSchema } from "@/lib/validations/appointment";
import { apiError, apiSuccess, rateLimit, getClientIp } from "@/lib/api";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`checkin:${ip}`, 10, 5 * 60 * 1000);
  if (!rl.success) {
    return apiError("Too many requests. Please wait before trying again.", 429);
  }

  const body: unknown = await req.json();
  const parsed = checkInSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid token");
  }

  const { token } = parsed.data;

  const appointment = await prisma.appointment.findUnique({
    where: { checkInToken: token, deletedAt: null },
    include: { doctor: true },
  });

  if (!appointment) {
    return apiError("Invalid check-in token. Please check your confirmation.", 404);
  }

  if (appointment.status === "COMPLETED" || appointment.status === "CANCELLED") {
    return apiError(`This appointment is already ${appointment.status.toLowerCase()}.`, 400);
  }

  if (appointment.status === "CHECKED_IN" || appointment.status === "IN_PROGRESS") {
    return apiSuccess({ appointment, alreadyCheckedIn: true });
  }

  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      status: "CHECKED_IN",
      checkInTime: new Date(),
      auditLogs: {
        create: {
          action: "CHECK_IN",
          entityType: "appointment",
          entityId: appointment.id,
          before: JSON.stringify({ status: "SCHEDULED" }),
          after: JSON.stringify({ status: "CHECKED_IN" }),
        },
      },
    },
    include: { doctor: true },
  });

  return apiSuccess({ appointment: updated, alreadyCheckedIn: false });
}
