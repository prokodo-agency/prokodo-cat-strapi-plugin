import { zonedTimeToUtc } from 'date-fns-tz';
import { Frequency, Weekday } from '../types/config/config.enums';

/**
 * Calculates the next scheduled time for the newsletter based on frequency and schedule.
 * @param frequency - The frequency of the newsletter (daily or weekly).
 * @param schedule - The time in HH:mm format.
 * @param day - The day of the week (required for weekly frequency).
 * @param referenceDate - The current date and time.
 * @returns A Date object representing the next scheduled time.
 */
export function calculateScheduledTime(
  frequency: Frequency,
  schedule: string,
  day: Weekday | undefined,
  timezone: string,
  referenceDate: Date
): Date {
  const [hourStr, minuteStr] = schedule.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  let scheduledDate = new Date(referenceDate);
  scheduledDate.setHours(hour, minute, 0, 0);

  if (frequency === Frequency.Daily) {
    // If the scheduled time has already passed today, set for tomorrow
    if (scheduledDate <= referenceDate) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }
  } else if (frequency === Frequency.Weekly && day) {
    const targetDayNumber = getWeekdayNumber(day);
    const currentDayNumber = referenceDate.getDay(); // Sunday - Saturday : 0 - 6
    let daysToAdd = targetDayNumber - currentDayNumber;

    if (daysToAdd < 0 || (daysToAdd === 0 && scheduledDate <= referenceDate)) {
      daysToAdd += 7;
    }

    scheduledDate.setDate(scheduledDate.getDate() + daysToAdd);
  }

  return zonedTimeToUtc(scheduledDate, timezone);
}

/**
 * Converts weekday enum to cron-compatible number.
 * @param weekday - Weekday enum.
 * @returns Number representing the day of the week in cron (0-6, Sunday-Saturday).
 */
export function getWeekdayNumber(weekday: Weekday): number {
  const mapping: { [key in Weekday]: number } = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 0,
  };
  return mapping[weekday] ?? 1; // Default to Monday
}
