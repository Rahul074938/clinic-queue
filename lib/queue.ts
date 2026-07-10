import { prisma } from "@/lib/prisma";

/**
 * Calculates estimated wait time in minutes for a patient at given position.
 * Average consultation: 15 minutes.
 */
export const AVG_CONSULTATION_MINUTES = 15;

export async function getLiveQueue() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const queue = await prisma.appointment.findMany({
    where: {
      scheduledAt: { gte: startOfDay },
      status: { in: ["CHECKED_IN", "IN_PROGRESS"] },
      deletedAt: null,
    },
    include: { doctor: true },
    orderBy: [{ status: "asc" }, { checkInTime: "asc" }],
  });

  return queue.map((appt, index) => {
    const waitMinutes = index * AVG_CONSULTATION_MINUTES;
    return {
      ...appt,
      position: index + 1,
      estimatedWaitMinutes: appt.status === "IN_PROGRESS" ? 0 : waitMinutes,
    };
  });
}

export async function getQueueByToken(token: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { checkInToken: token, deletedAt: null },
    include: { doctor: true },
  });

  if (!appointment) return null;

  // Count how many patients are ahead
  const aheadCount = await prisma.appointment.count({
    where: {
      status: { in: ["CHECKED_IN", "IN_PROGRESS"] },
      checkInTime: { lt: appointment.checkInTime ?? new Date() },
      deletedAt: null,
    },
  });

  const position = aheadCount + 1;
  const estimatedWaitMinutes =
    appointment.status === "IN_PROGRESS"
      ? 0
      : aheadCount * AVG_CONSULTATION_MINUTES;

  return { ...appointment, position, estimatedWaitMinutes };
}

export async function callNextPatient(userId: string, doctorId?: string) {
  const where = {
    status: "CHECKED_IN" as const,
    deletedAt: null,
    ...(doctorId ? { doctorId } : {}),
  };

  const next = await prisma.appointment.findFirst({
    where,
    orderBy: { checkInTime: "asc" },
  });

  if (!next) return null;

  const updated = await prisma.appointment.update({
    where: { id: next.id },
    data: {
      status: "IN_PROGRESS",
      calledAt: new Date(),
    },
    include: { doctor: true },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: "CALL_NEXT",
      entityType: "appointment",
      entityId: next.id,
      appointmentId: next.id,
      before: JSON.stringify({ status: "CHECKED_IN" }),
      after: JSON.stringify({ status: "IN_PROGRESS" }),
    },
  });

  return updated;
}

export async function completeAppointment(appointmentId: string, userId: string) {
  return prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      auditLogs: {
        create: {
          userId,
          action: "COMPLETE",
          entityType: "appointment",
          entityId: appointmentId,
        },
      },
    },
    include: { doctor: true },
  });
}

export async function getTodayStats() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const [total, completed, checkedIn, inProgress, cancelled] = await Promise.all([
    prisma.appointment.count({
      where: { scheduledAt: { gte: startOfDay }, deletedAt: null },
    }),
    prisma.appointment.count({
      where: { scheduledAt: { gte: startOfDay }, status: "COMPLETED", deletedAt: null },
    }),
    prisma.appointment.count({
      where: { scheduledAt: { gte: startOfDay }, status: "CHECKED_IN", deletedAt: null },
    }),
    prisma.appointment.count({
      where: { scheduledAt: { gte: startOfDay }, status: "IN_PROGRESS", deletedAt: null },
    }),
    prisma.appointment.count({
      where: { scheduledAt: { gte: startOfDay }, status: "CANCELLED", deletedAt: null },
    }),
  ]);

  // Average wait time from check-in to called
  const completedWithTimes = await prisma.appointment.findMany({
    where: {
      scheduledAt: { gte: startOfDay },
      status: "COMPLETED",
      checkInTime: { not: null },
      calledAt: { not: null },
    },
    select: { checkInTime: true, calledAt: true },
  });

  const avgWaitMinutes =
    completedWithTimes.length > 0
      ? completedWithTimes.reduce((acc, a) => {
          const wait =
            (new Date(a.calledAt!).getTime() -
              new Date(a.checkInTime!).getTime()) /
            60000;
          return acc + wait;
        }, 0) / completedWithTimes.length
      : 0;

  return {
    total,
    completed,
    checkedIn,
    inProgress,
    cancelled,
    waiting: checkedIn,
    avgWaitMinutes: Math.round(avgWaitMinutes),
  };
}
