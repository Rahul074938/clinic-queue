import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return apiError("Email is required", 400);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) return apiError("User not found", 404);
    if (user.emailVerified) return apiSuccess({ message: "Email is already verified" });

    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    return apiSuccess({ message: "Email verified successfully!" });
  } catch (error) {
    console.error("Email verification error:", error);
    return apiError("An internal error occurred", 500);
  }
}
