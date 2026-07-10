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
      const path = require("path");
      
      // Define potential locations where Next.js / Vercel bundles the dev.db file
      const potentialPaths = [
        path.join(process.cwd(), "prisma", "dev.db"),
        path.join(process.cwd(), ".next", "server", "prisma", "dev.db"),
        "/var/task/prisma/dev.db"
      ];

      // Try resolving via Prisma client package path
      try {
        const prismaClientPath = require.resolve(".prisma/client");
        potentialPaths.push(path.join(path.dirname(prismaClientPath), "dev.db"));
        potentialPaths.push(path.join(path.dirname(prismaClientPath), "..", "..", "..", "prisma", "dev.db"));
      } catch (_) {}

      let bundledDbPath = "";
      for (const p of potentialPaths) {
        if (fs.existsSync(p)) {
          bundledDbPath = p;
          break;
        }
      }

      // Fallback to a shell find if none of the specific paths worked (safely caught)
      if (!bundledDbPath) {
        try {
          const { execSync } = require("child_process");
          bundledDbPath = execSync("find /var/task -name dev.db 2>/dev/null | head -n 1").toString().trim();
        } catch (_) {}
      }

      if (bundledDbPath && fs.existsSync(bundledDbPath)) {
        fs.copyFileSync(bundledDbPath, tmpDbPath);
        // Unlock write permissions on the copied file
        fs.chmodSync(tmpDbPath, 0o666);
        console.log(`Successfully copied SQLite DB from ${bundledDbPath} to writable /tmp/dev.db`);
        useTmp = true;
      } else {
        console.error("Vercel SQLite Hack: Could not locate dev.db to copy.");
      }
    } catch (e) {
      console.error("Vercel SQLite Hack: Failed to copy database to /tmp", e);
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
