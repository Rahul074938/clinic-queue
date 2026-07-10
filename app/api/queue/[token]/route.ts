import { type NextRequest } from "next/server";
import { getQueueByToken } from "@/lib/queue";
import { apiError, apiSuccess } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const data = await getQueueByToken(token);
  if (!data) return apiError("Invalid token", 404);
  return apiSuccess(data);
}
