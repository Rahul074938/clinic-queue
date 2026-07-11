import { NextResponse } from "next/server";
import { PATIENT_COOKIE } from "@/lib/patient-auth";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(PATIENT_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return res;
}
