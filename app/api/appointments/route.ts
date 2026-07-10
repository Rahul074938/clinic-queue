export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appointmentListSchema, createAppointmentSchema } from "@/lib/validations/appointment";
import { requireAuth, apiError, apiSuccess, rateLimit, getClientIp } from "@/lib/api";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(["ADMIN", "STAFF"]);
  if (authResult instanceof NextResponse) return authResult;

  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams);
  const parsed = appointmentListSchema.safeParse(params);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid parameters");
  }

  const { page, pageSize, search, status, doctorId, date, sortBy, sortOrder } = parsed.data;

  const startOfDate = date ? new Date(date) : undefined;
  const endOfDate = date ? new Date(new Date(date).setHours(23, 59, 59, 999)) : undefined;

  const where = {
    deletedAt: null,
    ...(status && status !== "all" ? { status } : {}),
    ...(doctorId ? { doctorId } : {}),
    ...(startOfDate && endOfDate ? { scheduledAt: { gte: startOfDate, lte: endOfDate } } : {}),
    ...(search
      ? {
          OR: [
            { patientName: { contains: search, mode: "insensitive" as const } },
            { patientEmail: { contains: search, mode: "insensitive" as const } },
            { patientPhone: { contains: search } },
          ],
        }
      : {}),
  };

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: { doctor: true },
      orderBy: [{ [sortBy]: sortOrder }, { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.appointment.count({ where }),
  ]);

  return apiSuccess({
    appointments,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

export async function POST(req: NextRequest) {
  // Rate limit appointment creation per IP
  const ip = getClientIp(req);
  const rl = rateLimit(`create-appt:${ip}`, 10, 60 * 60 * 1000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body: unknown = await req.json();
  const parsed = createAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { patientName, patientPhone, patientEmail, doctorId, scheduledAt, notes } = parsed.data;

  // Verify doctor exists and is active
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, isActive: true },
  });
  if (!doctor) return apiError("Doctor not found", 404);

  const appointment = await prisma.appointment.create({
    data: {
      patientName,
      patientPhone,
      patientEmail,
      doctorId,
      scheduledAt: new Date(scheduledAt),
      notes: notes ?? null,
    },
    include: { doctor: true },
  });

  return apiSuccess(appointment, 201);
}
