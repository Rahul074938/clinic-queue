import { type NextRequest, NextResponse } from "next/server";
import { getPatientSessionFromRequest } from "@/lib/patient-auth";
import { apiError, apiSuccess } from "@/lib/api";

export async function GET(req: NextRequest) {
  const session = await getPatientSessionFromRequest(req);
  if (!session) return apiError("Unauthorized", 401);
  return apiSuccess(session);
}
