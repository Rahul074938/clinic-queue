import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// --- VERCEL SQLITE HACK ---
// Vercel Serverless Functions have a strictly read-only file system (except for /tmp).
// When the app tries to save an appointment, it crashes because Prisma cannot write to the bundled database.
// To bypass this for demo purposes, we copy the database to /tmp (which is writable) on cold start.
if (process.env.VERCEL) {
  const tmpDbPath = "/tmp/dev.db";
  const bundledDbPath = path.join(process.cwd(), "prisma", "dev.db");
  let useTmp = false;

  if (!fs.existsSync(tmpDbPath)) {
    try {
      if (fs.existsSync(bundledDbPath)) {
        fs.copyFileSync(bundledDbPath, tmpDbPath);
        console.log("Copied read-only SQLite database to writable /tmp/dev.db");
        useTmp = true;
      }
    } catch (e) {
      console.error("Failed to copy database to /tmp", e);
    }
  } else {
    useTmp = true;
  }
  
  if (useTmp) {
    process.env.DATABASE_URL = `file:${tmpDbPath}`;
  }
}
// ---------------------------

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
