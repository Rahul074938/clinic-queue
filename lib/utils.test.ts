import { describe, it, expect } from "vitest";
import { formatWaitTime, generateTimeSlots } from "./utils";

describe("Queue Utilities", () => {
  describe("formatWaitTime", () => {
    it("should return Now for 0 minutes", () => {
      expect(formatWaitTime(0)).toBe("Now");
    });

    it("should format minutes correctly", () => {
      expect(formatWaitTime(15)).toBe("15 min");
      expect(formatWaitTime(45)).toBe("45 min");
    });

    it("should format hours and minutes correctly", () => {
      expect(formatWaitTime(60)).toBe("1h");
      expect(formatWaitTime(75)).toBe("1h 15m");
      expect(formatWaitTime(120)).toBe("2h");
      expect(formatWaitTime(145)).toBe("2h 25m");
    });
  });

  describe("generateTimeSlots", () => {
    it("should generate slots on 15 minutes interval", () => {
      const slots = generateTimeSlots(9, 10, 15);
      expect(slots).toEqual(["09:00", "09:15", "09:30", "09:45"]);
    });

    it("should default to 8 to 17 schedules", () => {
      const slots = generateTimeSlots();
      expect(slots[0]).toBe("08:00");
      expect(slots[slots.length - 1]).toBe("16:45");
    });
  });
});
