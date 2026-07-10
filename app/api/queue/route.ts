import { NextResponse } from "next/server";
import { getLiveQueue } from "@/lib/queue";
import { requireAuth, apiSuccess } from "@/lib/api";

export async function GET() {
  const authResult = await requireAuth(["ADMIN", "STAFF"]);
  if (authResult instanceof NextResponse) return authResult;

  const queue = await getLiveQueue();
  return apiSuccess(queue);
}
