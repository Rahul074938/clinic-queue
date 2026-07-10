import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validations/auth";
import bcrypt from "bcryptjs";
import { apiError, apiSuccess } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const { email, password, name } = parsed.data;

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return apiError("Email already in use", 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user. In trial, we'll mark them as verified immediately or let them verify via a simple flow.
    // To strictly support the PDF's requirement ("require email verification before granting write access"),
    // we'll default emailVerified to null and let them verify with a mock verification link/button.
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "STAFF", // default role is staff for clinic staff signups
        emailVerified: null, // requires verification
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return apiSuccess({
      message: "Registration successful. Please verify your email.",
      user,
    }, 201);
  } catch (error) {
    console.error("Signup error:", error);
    return apiError("An internal error occurred", 500);
  }
}
