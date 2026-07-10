export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTodayStats } from "@/lib/queue";
import { requireAuth, apiSuccess } from "@/lib/api";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(["ADMIN", "STAFF"]);
  if (authResult instanceof NextResponse) return authResult;

  const url = new URL(req.url);
  const days = Math.min(parseInt(url.searchParams.get("days") ?? "7"), 30);

  const todayStats = await getTodayStats();

  // Historical data for charts
  const results = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const [total, completed, cancelled] = await Promise.all([
      prisma.appointment.count({
        where: { scheduledAt: { gte: date, lte: endDate }, deletedAt: null },
      }),
      prisma.appointment.count({
        where: { scheduledAt: { gte: date, lte: endDate }, status: "COMPLETED", deletedAt: null },
      }),
      prisma.appointment.count({
        where: { scheduledAt: { gte: date, lte: endDate }, status: "CANCELLED", deletedAt: null },
      }),
    ]);

    // Avg wait time for this day
    const withWait = await prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: date, lte: endDate },
        status: "COMPLETED",
        checkInTime: { not: null },
        calledAt: { not: null },
      },
      select: { checkInTime: true, calledAt: true },
    });

    const avgWait =
      withWait.length > 0
        ? Math.round(
            withWait.reduce((acc, a) => {
              return acc + (new Date(a.calledAt!).getTime() - new Date(a.checkInTime!).getTime()) / 60000;
            }, 0) / withWait.length
          )
        : 0;

    results.push({
      date: date.toISOString().split("T")[0],
      total,
      completed,
      cancelled,
      avgWaitMinutes: avgWait,
    });
  }

  // Per-doctor stats today
  const doctors = await prisma.doctor.findMany({
    where: { isActive: true },
    include: {
      appointments: {
        where: {
          scheduledAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
          deletedAt: null,
        },
      },
    },
  });

  const doctorStats = doctors.map((d) => ({
    id: d.id,
    name: d.name,
    specialty: d.specialty,
    room: d.room,
    avatarColor: d.avatarColor,
    total: d.appointments.length,
    completed: d.appointments.filter((a) => a.status === "COMPLETED").length,
    inProgress: d.appointments.filter((a) => a.status === "IN_PROGRESS").length,
    waiting: d.appointments.filter((a) => a.status === "CHECKED_IN").length,
  }));

  return apiSuccess({ today: todayStats, history: results, doctors: doctorStats });
}
