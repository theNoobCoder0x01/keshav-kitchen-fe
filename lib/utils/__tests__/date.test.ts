/**
 * Tests for date-fns migration
 * These tests verify that our date utilities work correctly across timezones
 */

import {
  formatEpochToDate,
  formatEpochToTime,
  dateToEpoch,
  getLocalTimezone,
  getCurrentDateUTC,
  getCurrentEpoch,
  epochToDate,
  getNextDay,
  getPreviousDay,
  formatTimeAgo,
  createStartOfDayUTC,
  createEndOfDayUTC,
  formatForStorage,
  formatForDisplay,
  parseISOString,
  isSameDate,
  addTime,
  subtractTime,
  dateDifference,
} from '../date';
import { formatInTimeZone } from 'date-fns-tz';

describe('Date Utils Migration Tests', () => {
  const testDate = new Date('2024-01-15T12:30:45.123Z'); // UTC date
  const testEpoch = testDate.getTime();

  describe('Basic Date Operations', () => {
    test('epochToDate converts correctly', () => {
      expect(epochToDate(testEpoch)).toEqual(testDate);
      expect(epochToDate(testEpoch / 1000)).toEqual(testDate); // seconds to ms
    });

    test('dateToEpoch converts correctly', () => {
      expect(dateToEpoch(testDate)).toBe(testEpoch);
      expect(dateToEpoch('2024-01-15T12:30:45.123Z')).toBe(testEpoch);
    });

    test('parseISOString works correctly', () => {
      const parsed = parseISOString('2024-01-15T12:30:45.123Z');
      expect(parsed.getTime()).toBe(testEpoch);
    });
  });

  describe('Timezone Handling', () => {
    test('formatEpochToDate respects timezone', () => {
      const utcFormat = formatEpochToDate(testEpoch, 'yyyy-MM-dd', 'UTC');
      const nyFormat = formatEpochToDate(testEpoch, 'yyyy-MM-dd', 'America/New_York');
      
      expect(utcFormat).toBe('2024-01-15');
      // NY is UTC-5 in January, so same date but different time context
      expect(nyFormat).toBe('2024-01-15');
    });

    test('formatEpochToTime respects timezone', () => {
      const utcTime = formatEpochToTime(testEpoch, 'HH:mm', false, 'UTC');
      const nyTime = formatEpochToTime(testEpoch, 'HH:mm', false, 'America/New_York');
      
      expect(utcTime).toBe('12:30');
      expect(nyTime).toBe('07:30'); // UTC-5
    });

    test('formatForDisplay uses user timezone', () => {
      const formatted = formatForDisplay(testDate, 'PPP', 'Asia/Kolkata');
      // Should format in IST (UTC+5:30)
      expect(formatted).toContain('January 15th, 2024');
    });
  });

  describe('Date Arithmetic', () => {
    test('addTime functions work correctly', () => {
      const nextDay = addTime.days(testDate, 1);
      const nextHour = addTime.hours(testDate, 1);
      
      expect(nextDay.getDate()).toBe(testDate.getDate() + 1);
      expect(nextHour.getHours()).toBe(testDate.getHours() + 1);
    });

    test('subtractTime functions work correctly', () => {
      const prevDay = subtractTime.days(testDate, 1);
      const prevHour = subtractTime.hours(testDate, 1);
      
      expect(prevDay.getDate()).toBe(testDate.getDate() - 1);
      expect(prevHour.getHours()).toBe(testDate.getHours() - 1);
    });

    test('dateDifference functions work correctly', () => {
      const laterDate = addTime.days(testDate, 5);
      
      expect(dateDifference.inDays(laterDate, testDate)).toBe(5);
      expect(dateDifference.inHours(laterDate, testDate)).toBe(5 * 24);
    });
  });

  describe('Day Boundaries', () => {
    test('createStartOfDayUTC creates correct boundary', () => {
      const startOfDay = createStartOfDayUTC(testDate);
      
      expect(startOfDay.getUTCHours()).toBe(0);
      expect(startOfDay.getUTCMinutes()).toBe(0);
      expect(startOfDay.getUTCSeconds()).toBe(0);
      expect(startOfDay.getUTCMilliseconds()).toBe(0);
    });

    test('createEndOfDayUTC creates correct boundary', () => {
      const endOfDay = createEndOfDayUTC(testDate);
      
      expect(endOfDay.getUTCHours()).toBe(23);
      expect(endOfDay.getUTCMinutes()).toBe(59);
      expect(endOfDay.getUTCSeconds()).toBe(59);
      expect(endOfDay.getUTCMilliseconds()).toBe(999);
    });
  });

  describe('Helper Functions', () => {
    test('getNextDay and getPreviousDay work correctly', () => {
      const next = getNextDay(testDate);
      const prev = getPreviousDay(testDate);
      
      expect(dateDifference.inDays(next, testDate)).toBe(1);
      expect(dateDifference.inDays(testDate, prev)).toBe(1);
    });

    test('isSameDate works correctly', () => {
      const sameDay = new Date('2024-01-15T23:59:59.999Z');
      const differentDay = new Date('2024-01-16T00:00:00.000Z');
      
      expect(isSameDate(testDate, sameDay)).toBe(true);
      expect(isSameDate(testDate, differentDay)).toBe(false);
    });

    test('formatTimeAgo works correctly', () => {
      const fiveMinutesAgo = subtractTime.minutes(getCurrentDateUTC(), 5);
      const timeAgo = formatTimeAgo(fiveMinutesAgo);
      
      expect(timeAgo).toContain('5 minutes ago');
    });
  });

  describe('Storage vs Display', () => {
    test('formatForStorage always returns UTC ISO string', () => {
      const stored = formatForStorage(testDate);
      expect(stored).toBe('2024-01-15T12:30:45.123Z');
    });

    test('formatForDisplay respects user timezone', () => {
      // Test with different timezones
      const utcDisplay = formatForDisplay(testDate, 'PPP', 'UTC');
      const istDisplay = formatForDisplay(testDate, 'PPP', 'Asia/Kolkata');
      
      expect(utcDisplay).toContain('January 15th, 2024');
      expect(istDisplay).toContain('January 15th, 2024'); // Same date, different time context
    });
  });
});

// Example usage patterns for developers
export const USAGE_EXAMPLES = {
  // When receiving date from API (always UTC)
  parseApiDate: (isoString: string) => parseISOString(isoString),
  
  // When storing date to API (convert to UTC ISO)
  prepareForApi: (date: Date) => formatForStorage(date),
  
  // When displaying date to user (use their timezone)
  displayToUser: (utcDate: Date, userTimezone: string) => 
    formatInTimeZone(utcDate, userTimezone, 'PPP'),
  
  // When creating database queries for a specific day
  createDayQuery: (date: Date) => ({
    gte: createStartOfDayUTC(date),
    lte: createEndOfDayUTC(date),
  }),
  
  // When calculating time differences
  calculateDaysBetween: (startDate: Date, endDate: Date) => 
    dateDifference.inDays(endDate, startDate),
};