import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DOCTORS = [
  { name: "Dr. Sarah Chen", specialty: "General Medicine", room: "Room 1", avatarColor: "#06b6d4" },
  { name: "Dr. James Okafor", specialty: "Cardiology", room: "Room 2", avatarColor: "#8b5cf6" },
  { name: "Dr. Priya Sharma", specialty: "Pediatrics", room: "Room 3", avatarColor: "#10b981" },
  { name: "Dr. Marcus Reid", specialty: "Orthopedics", room: "Room 4", avatarColor: "#f59e0b" },
  { name: "Dr. Aisha Patel", specialty: "Dermatology", room: "Room 5", avatarColor: "#ef4444" },
];

const PATIENT_NAMES = [
  "Alice Johnson", "Bob Martinez", "Carol Williams", "David Brown",
  "Emma Davis", "Frank Wilson", "Grace Lee", "Henry Taylor",
  "Isabella Anderson", "Jack Thomas",
];

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminHash = await bcrypt.hash("admin1234", 12);
  await prisma.user.upsert({
    where: { email: "admin@clinicqueue.com" },
    update: {},
    create: {
      email: "admin@clinicqueue.com",
      name: "Admin User",
      passwordHash: adminHash,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  // Create staff user
  const staffHash = await bcrypt.hash("staff1234", 12);
  await prisma.user.upsert({
    where: { email: "staff@clinicqueue.com" },
    update: {},
    create: {
      email: "staff@clinicqueue.com",
      name: "Staff Member",
      passwordHash: staffHash,
      role: "STAFF",
      emailVerified: new Date(),
    },
  });

  // Create demo credentials
  const demoHash = await bcrypt.hash("demo1234", 12);
  await prisma.user.upsert({
    where: { email: "demo@demo.com" },
    update: {},
    create: {
      email: "demo@demo.com",
      name: "Demo User",
      passwordHash: demoHash,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  // Create doctors
  const doctors = await Promise.all(
    DOCTORS.map((d) =>
      prisma.doctor.upsert({
        where: { id: d.name.toLowerCase().replace(/\s/g, "-") },
        update: {},
        create: { id: d.name.toLowerCase().replace(/\s/g, "-"), ...d },
      })
    )
  );

  // Create today's appointments with various statuses
  const today = new Date();
  today.setHours(8, 0, 0, 0);

  const statuses: Array<"SCHEDULED" | "CHECKED_IN" | "IN_PROGRESS" | "COMPLETED"> = [
    "COMPLETED", "COMPLETED", "IN_PROGRESS", "CHECKED_IN",
    "CHECKED_IN", "SCHEDULED", "SCHEDULED", "SCHEDULED",
    "SCHEDULED", "SCHEDULED",
  ];

  for (let i = 0; i < PATIENT_NAMES.length; i++) {
    const name = PATIENT_NAMES[i]!;
    const doctor = doctors[i % doctors.length]!;
    const status = statuses[i]!;
    const slotTime = new Date(today);
    slotTime.setMinutes(i * 15);

    const checkInTime = ["CHECKED_IN", "IN_PROGRESS", "COMPLETED"].includes(status)
      ? new Date(slotTime.getTime() + 5 * 60000)
      : null;
    const calledAt = ["IN_PROGRESS", "COMPLETED"].includes(status)
      ? new Date(slotTime.getTime() + 20 * 60000)
      : null;
    const completedAt = status === "COMPLETED"
      ? new Date(slotTime.getTime() + 35 * 60000)
      : null;

    await prisma.appointment.create({
      data: {
        patientName: name,
        patientPhone: `+1 555-${String(1000 + i).padStart(4, "0")}`,
        patientEmail: `${name.toLowerCase().replace(" ", ".")}@example.com`,
        doctorId: doctor.id,
        scheduledAt: slotTime,
        status,
        checkInTime,
        calledAt,
        completedAt,
      },
    });
  }

  console.log("✅ Seed complete!");
  console.log("\n📋 Demo credentials:");
  console.log("  Admin:  demo@demo.com / demo1234");
  console.log("  Admin:  admin@clinicqueue.com / admin1234");
  console.log("  Staff:  staff@clinicqueue.com / staff1234");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
