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

  try {
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

    // Send confirmation email
    const { sendEmail } = await import("@/lib/email");
    const formattedDate = new Date(appointment.scheduledAt).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = new Date(appointment.scheduledAt).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    await sendEmail({
      to: appointment.patientEmail,
      subject: "Your Appointment Confirmation - ClinicQueue",
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #0d9488; margin-top: 0;">Appointment Confirmed!</h2>
          <p>Hello <strong>${appointment.patientName}</strong>,</p>
          <p>Your appointment has been successfully scheduled. Here are the details:</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; font-weight: bold; color: #475569; width: 100px;">Doctor:</td>
                <td style="padding: 4px 0; color: #0f172a;">${appointment.doctor.name} (${appointment.doctor.specialty})</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: bold; color: #475569;">Room:</td>
                <td style="padding: 4px 0; color: #0f172a; font-family: monospace; font-weight: bold;">${appointment.doctor.room}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: bold; color: #475569;">Date:</td>
                <td style="padding: 4px 0; color: #0f172a;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: bold; color: #475569;">Time:</td>
                <td style="padding: 4px 0; color: #0f172a;">${formattedTime}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold; color: #0f766e; text-transform: uppercase; letter-spacing: 0.05em;">Your Arrival Check-In Token</p>
            <p style="margin: 0; font-size: 22px; font-family: monospace; font-weight: bold; color: #0d9488; letter-spacing: 2px;">${appointment.checkInToken}</p>
          </div>

          <p style="font-size: 13px; color: #64748b;">Please arrive 10 minutes prior to your appointment time and use your check-in token at the kiosk or from your phone to join the waitlist.</p>
        </div>
      `,
    });

    return apiSuccess(appointment, 201);
  } catch (error: any) {
    console.error("Failed to create appointment on Vercel:", error);
    return apiError(error?.message || "Internal Server Error during booking", 500);
  }
}
