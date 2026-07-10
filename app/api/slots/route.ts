import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api";
import { generateTimeSlots } from "@/lib/utils";

const SLOT_DURATION_MINUTES = 15;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const doctorId = url.searchParams.get("doctorId");
  const date = url.searchParams.get("date");

  if (!doctorId || !date) {
    return apiError("doctorId and date are required");
  }

  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, isActive: true },
  });
  if (!doctor) return apiError("Doctor not found", 404);

  const dayStart = new Date(date);
  dayStart.setHours(8, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(17, 0, 0, 0);

  const existing = await prisma.appointment.findMany({
    where: {
      doctorId,
      scheduledAt: { gte: dayStart, lt: dayEnd },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      deletedAt: null,
    },
    select: { scheduledAt: true },
  });

  const bookedTimes = new Set(
    existing.map((a) => {
      const d = new Date(a.scheduledAt);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    })
  );

  const allSlots = generateTimeSlots(8, 17, SLOT_DURATION_MINUTES);
  const now = new Date();
  const selectedDate = new Date(date);
  const isToday = selectedDate.toDateString() === now.toDateString();

  const slots = allSlots.map((time) => {
    const [h, m] = time.split(":").map(Number);
    const slotDate = new Date(date);
    slotDate.setHours(h!, m!, 0, 0);

    const isPast = isToday && slotDate < now;
    const isBooked = bookedTimes.has(time);

    return {
      time,
      available: !isPast && !isBooked,
      label: new Date(slotDate).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };
  });

  return apiSuccess(slots);
}
