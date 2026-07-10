import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateAppointmentSchema } from "@/lib/validations/appointment";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(["ADMIN", "STAFF"]);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const appointment = await prisma.appointment.findFirst({
    where: { id, deletedAt: null },
    include: { doctor: true, auditLogs: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 20 } },
  });

  if (!appointment) return apiError("Appointment not found", 404);
  return apiSuccess(appointment);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(["ADMIN", "STAFF"]);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { id } = await params;
  const existing = await prisma.appointment.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) return apiError("Appointment not found", 404);

  const body: unknown = await req.json();
  const parsed = updateAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { status, notes, scheduledAt, doctorId } = parsed.data;
  
  const updateData: {
    status?: "SCHEDULED" | "CHECKED_IN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
    notes?: string | null;
    scheduledAt?: Date;
    doctorId?: string;
    calledAt?: Date;
    completedAt?: Date;
    auditLogs?: {
      create: {
        userId: string;
        action: string;
        entityType: string;
        entityId: string;
        before: string;
        after: string;
      };
    };
  } = {
    auditLogs: {
      create: {
        userId,
        action: "UPDATE",
        entityType: "appointment",
        entityId: id,
        before: JSON.stringify({ status: existing.status }),
        after: JSON.stringify(parsed.data),
      },
    },
  };

  if (status !== undefined) updateData.status = status;
  if (notes !== undefined) updateData.notes = notes ?? null;
  if (scheduledAt !== undefined) updateData.scheduledAt = new Date(scheduledAt);
  if (doctorId !== undefined) updateData.doctorId = doctorId;

  if (status === "COMPLETED") updateData.completedAt = new Date();
  if (status === "IN_PROGRESS") updateData.calledAt = new Date();

  const updated = await prisma.appointment.update({
    where: { id },
    data: updateData,
    include: { doctor: true },
  });

  return apiSuccess(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(["ADMIN"]);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { id } = await params;
  const existing = await prisma.appointment.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) return apiError("Appointment not found", 404);

  await prisma.appointment.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      auditLogs: {
        create: {
          userId,
          action: "DELETE",
          entityType: "appointment",
          entityId: id,
          before: JSON.stringify({ status: existing.status }),
        },
      },
    },
  });

  return apiSuccess({ success: true });
}
