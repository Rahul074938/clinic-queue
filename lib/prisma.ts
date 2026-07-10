import { PrismaClient } from "@prisma/client";
import fs from "fs";

// --- VERCEL SQLITE HACK ---
// Vercel Serverless Functions have a strictly read-only file system (except for /tmp).
// When the app tries to save an appointment, it crashes because Prisma cannot write to the bundled database.
// To bypass this for demo purposes, we copy the database to /tmp (which is writable) on cold start.
if (process.env.VERCEL) {
  const tmpDbPath = "/tmp/dev.db";
  let useTmp = false;

  if (!fs.existsSync(tmpDbPath)) {
    try {
      // Next.js moves files around in serverless environments. 
      // We use 'find' to dynamically locate the bundled dev.db file.
      const { execSync } = require("child_process");
      const bundledDbPath = execSync("find /var/task -name dev.db 2>/dev/null | head -n 1").toString().trim();
      
      if (bundledDbPath && fs.existsSync(bundledDbPath)) {
        fs.copyFileSync(bundledDbPath, tmpDbPath);
        console.log("Successfully located and copied SQLite database to writable /tmp/dev.db");
        useTmp = true;
      } else {
        console.error("Could not dynamically locate dev.db in /var/task");
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
