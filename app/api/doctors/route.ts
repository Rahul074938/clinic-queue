import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDoctorSchema } from "@/lib/validations/doctor";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

export async function GET() {
  const doctors = await prisma.doctor.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return apiSuccess(doctors);
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(["ADMIN"]);
  if (authResult instanceof NextResponse) return authResult;

  const body: unknown = await req.json();
  const parsed = createDoctorSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const doctor = await prisma.doctor.create({ data: parsed.data });
  return apiSuccess(doctor, 201);
}
