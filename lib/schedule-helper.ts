/**
 * Schedule Helper Utilities
 * Convert between user-friendly UI inputs and cron expressions
 */

export const PRESET_SCHEDULES = {
  every_hour: { label: "Every hour", cron: "0 * * * *" },
  every_2_hours: { label: "Every 2 hours", cron: "0 */2 * * *" },
  every_4_hours: { label: "Every 4 hours", cron: "0 */4 * * *" },
  twice_daily: { label: "Twice daily (9am, 6pm)", cron: "0 9,18 * * *" },
  three_times_daily: {
    label: "Three times daily (9am, 2pm, 7pm)",
    cron: "0 9,14,19 * * *",
  },
  daily_morning: { label: "Daily at 9am", cron: "0 9 * * *" },
  daily_afternoon: { label: "Daily at 2pm", cron: "0 14 * * *" },
  daily_evening: { label: "Daily at 7pm", cron: "0 19 * * *" },
  weekdays_9am: { label: "Weekdays at 9am", cron: "0 9 * * 1-5" },
  weekdays_lunch: { label: "Weekdays at 12pm", cron: "0 12 * * 1-5" },
  weekdays_evening: { label: "Weekdays at 6pm", cron: "0 18 * * 1-5" },
  weekend_morning: { label: "Weekends at 10am", cron: "0 10 * * 0,6" },
  custom: { label: "Custom schedule", cron: "" },
} as const;

export type PresetScheduleKey = keyof typeof PRESET_SCHEDULES;

export interface ParsedSchedule {
  preset?: PresetScheduleKey;
  hour?: number;
  minute?: number;
  daysOfWeek?: number[]; // 0=Sunday, 1=Monday, etc.
  interval?: "hourly" | "daily" | "custom";
}

/**
 * Build a cron expression from time and repeat pattern
 */
export function buildCronExpression(
  hour: number,
  minute: number = 0,
  repeat: "daily" | "weekdays" | "weekends" | "custom" = "daily",
  daysOfWeek?: number[]
): string {
  // Cron format: minute hour day month dayOfWeek
  const minuteStr = minute.toString();
  const hourStr = hour.toString();

  switch (repeat) {
    case "daily":
      return `${minuteStr} ${hourStr} * * *`;
    case "weekdays":
      return `${minuteStr} ${hourStr} * * 1-5`;
    case "weekends":
      return `${minuteStr} ${hourStr} * * 0,6`;
    case "custom":
      if (daysOfWeek && daysOfWeek.length > 0) {
        return `${minuteStr} ${hourStr} * * ${daysOfWeek.join(",")}`;
      }
      return `${minuteStr} ${hourStr} * * *`;
    default:
      return `${minuteStr} ${hourStr} * * *`;
  }
}

/**
 * Build cron expression for multiple times per day
 */
export function buildMultipleTimesCron(
  times: Array<{ hour: number; minute: number }>,
  daysOfWeek?: number[]
): string {
  if (times.length === 0) {
    return "0 9 * * *"; // Default to 9am daily
  }

  // Group by minute to optimize cron expression
  const minuteGroups: Record<number, number[]> = {};

  times.forEach(({ hour, minute }) => {
    if (!minuteGroups[minute]) {
      minuteGroups[minute] = [];
    }
    minuteGroups[minute].push(hour);
  });

  // If all same minute, create a single expression
  const minutes = Object.keys(minuteGroups).map(Number);
  if (minutes.length === 1) {
    const minute = minutes[0];
    const hours = minuteGroups[minute].sort((a, b) => a - b);
    const hoursStr = hours.join(",");
    const daysStr = daysOfWeek && daysOfWeek.length > 0 ? daysOfWeek.join(",") : "*";
    return `${minute} ${hoursStr} * * ${daysStr}`;
  }

  // Multiple different minutes - just use first time for simplicity
  const { hour, minute } = times[0];
  return buildCronExpression(hour, minute, "custom", daysOfWeek);
}

/**
 * Parse a cron expression into human-readable format
 */
export function parseCronExpression(cronExpr: string): ParsedSchedule {
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length !== 5) {
    return { interval: "custom" };
  }

  const [minutePart, hourPart, , , dayOfWeekPart] = parts;

  // Check if it matches a preset
  for (const [key, value] of Object.entries(PRESET_SCHEDULES)) {
    if (value.cron === cronExpr) {
      return { preset: key as PresetScheduleKey };
    }
  }

  // Parse hour and minute
  const hour = hourPart === "*" ? undefined : parseInt(hourPart, 10);
  const minute = minutePart === "*" ? 0 : parseInt(minutePart, 10);

  // Parse days of week
  let daysOfWeek: number[] | undefined;
  if (dayOfWeekPart !== "*") {
    if (dayOfWeekPart.includes("-")) {
      // Range like "1-5"
      const [start, end] = dayOfWeekPart.split("-").map(Number);
      daysOfWeek = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    } else if (dayOfWeekPart.includes(",")) {
      // List like "0,6"
      daysOfWeek = dayOfWeekPart.split(",").map(Number);
    } else {
      daysOfWeek = [parseInt(dayOfWeekPart, 10)];
    }
  }

  // Determine interval
  let interval: "hourly" | "daily" | "custom" = "daily";
  if (hourPart.includes("*/")) {
    interval = "hourly";
  } else if (hour !== undefined) {
    interval = "daily";
  } else {
    interval = "custom";
  }

  return {
    hour,
    minute,
    daysOfWeek,
    interval,
  };
}

/**
 * Convert cron expression to human-readable description
 */
export function cronToHumanReadable(cronExpr: string): string {
  // Check presets first
  for (const [, value] of Object.entries(PRESET_SCHEDULES)) {
    if (value.cron === cronExpr) {
      return value.label;
    }
  }

  const parsed = parseCronExpression(cronExpr);

  if (!parsed.hour && parsed.interval === "hourly") {
    const parts = cronExpr.split(/\s+/);
    const hourPart = parts[1];
    if (hourPart.includes("*/")) {
      const hours = hourPart.replace("*/", "");
      return `Every ${hours} hours`;
    }
    return "Every hour";
  }

  if (parsed.hour !== undefined) {
    const time = formatTime(parsed.hour, parsed.minute || 0);

    if (!parsed.daysOfWeek || parsed.daysOfWeek.length === 7) {
      return `Daily at ${time}`;
    }

    if (
      parsed.daysOfWeek.length === 5 &&
      parsed.daysOfWeek.every((d) => d >= 1 && d <= 5)
    ) {
      return `Weekdays at ${time}`;
    }

    if (
      parsed.daysOfWeek.length === 2 &&
      parsed.daysOfWeek.includes(0) &&
      parsed.daysOfWeek.includes(6)
    ) {
      return `Weekends at ${time}`;
    }

    const days = parsed.daysOfWeek.map(getDayName).join(", ");
    return `${days} at ${time}`;
  }

  return cronExpr; // Fallback to raw expression
}

/**
 * Format hour and minute as 12-hour time
 */
export function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  const minuteStr = minute.toString().padStart(2, "0");
  return `${hour12}:${minuteStr} ${period}`;
}

/**
 * Get day name from day number (0=Sunday)
 */
export function getDayName(day: number): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[day] || "Unknown";
}

/**
 * Validate cron expression format
 */
export function isValidCronExpression(cronExpr: string): boolean {
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length !== 5) return false;

  // Basic validation of each part
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Minute: 0-59 or * or */n or n,m
  if (!/^(\*|(\d+|\*\/\d+)(,\d+)*)$/.test(minute)) return false;
  if (minute !== "*" && !minute.includes("/")) {
    const nums = minute.split(",").map(Number);
    if (nums.some((n) => n < 0 || n > 59)) return false;
  }

  // Hour: 0-23 or * or */n or n,m
  if (!/^(\*|(\d+|\*\/\d+)(,\d+)*)$/.test(hour)) return false;
  if (hour !== "*" && !hour.includes("/")) {
    const nums = hour.split(",").map(Number);
    if (nums.some((n) => n < 0 || n > 23)) return false;
  }

  // Day of month: 1-31 or * or n-m or n,m
  if (!/^(\*|(\d+(-\d+)?)(,\d+)*)$/.test(dayOfMonth)) return false;

  // Month: 1-12 or * or n-m or n,m
  if (!/^(\*|(\d+(-\d+)?)(,\d+)*)$/.test(month)) return false;

  // Day of week: 0-6 or * or n-m or n,m
  if (!/^(\*|(\d+(-\d+)?)(,\d+)*)$/.test(dayOfWeek)) return false;

  return true;
}

/**
 * Calculate next run time from cron expression (approximate)
 */
export function getNextRunTime(cronExpr: string): Date | null {
  try {
    const parsed = parseCronExpression(cronExpr);
    const now = new Date();

    if (parsed.hour !== undefined) {
      const nextRun = new Date(now);
      nextRun.setHours(parsed.hour, parsed.minute || 0, 0, 0);

      // If time has passed today, move to tomorrow
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }

      // Adjust for day of week if specified
      if (parsed.daysOfWeek && parsed.daysOfWeek.length > 0) {
        while (!parsed.daysOfWeek.includes(nextRun.getDay())) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
      }

      return nextRun;
    }

    // For hourly schedules, approximate next hour
    if (parsed.interval === "hourly") {
      const nextRun = new Date(now);
      nextRun.setMinutes(parsed.minute || 0, 0, 0);
      nextRun.setHours(nextRun.getHours() + 1);
      return nextRun;
    }

    return null;
  } catch (error) {
    console.error("Error calculating next run time:", error);
    return null;
  }
}
