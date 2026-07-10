import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateDoctorSchema } from "@/lib/validations/doctor";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doctor = await prisma.doctor.findUnique({ where: { id } });
  if (!doctor) return apiError("Doctor not found", 404);
  return apiSuccess(doctor);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(["ADMIN"]);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const body: unknown = await req.json();
  const parsed = updateDoctorSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { name, specialty, room, avatarColor, isActive } = parsed.data;
  const updateData: {
    name?: string;
    specialty?: string;
    room?: string;
    avatarColor?: string;
    isActive?: boolean;
  } = {};

  if (name !== undefined) updateData.name = name;
  if (specialty !== undefined) updateData.specialty = specialty;
  if (room !== undefined) updateData.room = room;
  if (avatarColor !== undefined) updateData.avatarColor = avatarColor;
  if (isActive !== undefined) updateData.isActive = isActive;

  const doctor = await prisma.doctor.update({
    where: { id },
    data: updateData,
  });
  return apiSuccess(doctor);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(["ADMIN"]);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  await prisma.doctor.update({ where: { id }, data: { isActive: false } });
  return apiSuccess({ success: true });
}
