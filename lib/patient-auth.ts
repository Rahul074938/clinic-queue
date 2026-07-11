/**
 * Patient Auth Utilities
 * Uses HMAC-SHA256 via Node's built-in crypto to sign/verify
 * patient session tokens, kept fully separate from NextAuth staff sessions.
 */
import { cookies } from "next/headers";
import { type NextRequest } from "next/server";

export const PATIENT_COOKIE = "patient_session";
const SECRET = process.env.PATIENT_JWT_SECRET ?? "fallback-secret";
const EXPIRY_DAYS = 7;

// ─── Simple HMAC-JWT (header.payload.sig, base64url) ─────────────────────────

function base64url(data: string): string {
  return Buffer.from(data)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function base64urlDecode(str: string): string {
  // Re-add padding
  const pad = str.length % 4;
  const padded = pad ? str + "=".repeat(4 - pad) : str;
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

async function hmacSign(data: string): Promise<string> {
  const { createHmac } = await import("crypto");
  return base64url(createHmac("sha256", SECRET).update(data).digest("base64"));
}

export interface PatientPayload {
  id: string;
  email: string;
  name: string;
}

/** Returns a signed token string */
export async function signPatientToken(payload: PatientPayload): Promise<string> {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp = Math.floor(Date.now() / 1000) + EXPIRY_DAYS * 24 * 60 * 60;
  const body = base64url(JSON.stringify({ ...payload, exp }));
  const sig = await hmacSign(`${header}.${body}`);
  return `${header}.${body}.${sig}`;
}

/** Verifies and decodes a token. Returns null if invalid or expired. */
export async function verifyPatientToken(token: string): Promise<(PatientPayload & { exp: number }) | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts as [string, string, string];
    const expectedSig = await hmacSign(`${header}.${body}`);
    if (sig !== expectedSig) return null;

    const decoded = JSON.parse(base64urlDecode(body)) as PatientPayload & { exp: number };
    if (decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}

/** Read patient session from cookies() (Server Component / Route Handler) */
export async function getPatientSession(): Promise<PatientPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PATIENT_COOKIE)?.value;
  if (!token) return null;
  const decoded = await verifyPatientToken(token);
  if (!decoded) return null;
  return { id: decoded.id, email: decoded.email, name: decoded.name };
}

/** Read patient session from a Request object (Route Handler) */
export async function getPatientSessionFromRequest(req: NextRequest): Promise<PatientPayload | null> {
  const token = req.cookies.get(PATIENT_COOKIE)?.value;
  if (!token) return null;
  const decoded = await verifyPatientToken(token);
  if (!decoded) return null;
  return { id: decoded.id, email: decoded.email, name: decoded.name };
}
