export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(["ADMIN", "STAFF"]);
  if (authResult instanceof NextResponse) return authResult;

  const url = new URL(req.url);
  const date = url.searchParams.get("date");

  const where = {
    deletedAt: null,
    ...(date
      ? {
          scheduledAt: {
            gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
            lte: new Date(new Date(date).setHours(23, 59, 59, 999)),
          },
        }
      : {}),
  };

  const appointments = await prisma.appointment.findMany({
    where,
    include: { doctor: true },
    orderBy: { scheduledAt: "asc" },
  });

  const rows = [
    ["ID", "Patient Name", "Email", "Phone", "Doctor", "Specialty", "Room", "Scheduled At", "Status", "Check-In Time", "Called At", "Completed At"],
    ...appointments.map((a) => [
      a.id,
      a.patientName,
      a.patientEmail,
      a.patientPhone,
      a.doctor.name,
      a.doctor.specialty,
      a.doctor.room,
      a.scheduledAt.toISOString(),
      a.status,
      a.checkInTime?.toISOString() ?? "",
      a.calledAt?.toISOString() ?? "",
      a.completedAt?.toISOString() ?? "",
    ]),
  ];

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const filename = `appointments-${date ?? "all"}-${Date.now()}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
