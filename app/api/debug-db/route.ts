import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const diagnostics: any = {
    env: {
      VERCEL: process.env.VERCEL,
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_CURRENT: process.env.DATABASE_URL,
    },
    paths: {},
  };

  const pathsToCheck = [
    path.join(process.cwd(), "prisma", "dev.db"),
    path.join(process.cwd(), ".next", "server", "prisma", "dev.db"),
    "/var/task/prisma/dev.db",
  ];

  try {
    const prismaClientPath = require.resolve(".prisma/client");
    pathsToCheck.push(path.join(path.dirname(prismaClientPath), "dev.db"));
    pathsToCheck.push(path.join(path.dirname(prismaClientPath), "..", "..", "..", "prisma", "dev.db"));
  } catch (e: any) {
    diagnostics.prismaClientResolveError = e.message;
  }

  for (const p of pathsToCheck) {
    diagnostics.paths[p] = {
      exists: fs.existsSync(p),
    };
    if (fs.existsSync(p)) {
      try {
        const stats = fs.statSync(p);
        diagnostics.paths[p].size = stats.size;
        diagnostics.paths[p].mode = stats.mode;
      } catch (err: any) {
        diagnostics.paths[p].error = err.message;
      }
    }
  }

  const tmpPath = "/tmp/dev.db";
  diagnostics.tmp = {
    exists: fs.existsSync(tmpPath),
  };
  
  if (fs.existsSync(tmpPath)) {
    try {
      const stats = fs.statSync(tmpPath);
      diagnostics.tmp.size = stats.size;
      diagnostics.tmp.mode = stats.mode;
    } catch (err: any) {
      diagnostics.tmp.error = err.message;
    }
  }

  // Try listing files in /var/task to see what's bundled
  try {
    const { execSync } = require("child_process");
    diagnostics.findDevDb = execSync("find /var/task -name dev.db 2>/dev/null").toString().trim().split("\n");
  } catch (e: any) {
    diagnostics.findError = e.message;
  }

  // Try writing to the database
  try {
    // Just a test read first
    const doctorsCount = await prisma.doctor.count();
    diagnostics.dbReadTest = { success: true, count: doctorsCount };
  } catch (e: any) {
    diagnostics.dbReadTest = { success: false, error: e.message };
  }

  try {
    // Test write (will rollback or we can catch error)
    // We try to update a non-existent doctor or create/delete
    diagnostics.dbWriteTest = "Not attempted yet due to read failure";
    if (diagnostics.dbReadTest.success) {
      // Let's try to update the first doctor's room to the same room to trigger a write
      const firstDoctor = await prisma.doctor.findFirst();
      if (firstDoctor) {
        await prisma.doctor.update({
          where: { id: firstDoctor.id },
          data: { room: firstDoctor.room }
        });
        diagnostics.dbWriteTest = { success: true };
      } else {
        diagnostics.dbWriteTest = { success: false, reason: "No doctors found to update" };
      }
    }
  } catch (e: any) {
    diagnostics.dbWriteTest = { success: false, error: e.message };
  }

  return NextResponse.json(diagnostics);
}
