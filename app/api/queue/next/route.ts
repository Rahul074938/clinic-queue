import { type NextRequest, NextResponse } from "next/server";
import { callNextPatient } from "@/lib/queue";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(["ADMIN", "STAFF"]);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const body = await req.json().catch(() => ({})) as { doctorId?: string };
  const doctorId = typeof body.doctorId === "string" ? body.doctorId : undefined;

  const next = await callNextPatient(userId, doctorId);
  if (!next) {
    return apiError("No patients waiting in the queue", 404);
  }

  return apiSuccess(next);
}
