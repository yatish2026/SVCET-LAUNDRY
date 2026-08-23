// Year-wise hostel laundry schedule mapping
export const YEAR_SCHEDULE = {
  '1st Year': {
    year: '1st Year',
    yearNumber: 1,
    dropoffDay: 'Monday',
    pickupDay: 'Wednesday',
    badgeColor: '#3B82F6', // Blue
    badgeBg: '#EFF6FF',
    badgeBorder: '#BFDBFE',
    shifts: [
      { id: 'shift-1-m', time: '08:00 AM - 11:30 AM', name: 'Morning Shift' },
      { id: 'shift-1-e', time: '04:00 PM - 07:30 PM', name: 'Evening Shift' },
    ],
  },
  '2nd Year': {
    year: '2nd Year',
    yearNumber: 2,
    dropoffDay: 'Tuesday',
    pickupDay: 'Thursday',
    badgeColor: '#0D9488', // Teal
    badgeBg: '#F0FDFA',
    badgeBorder: '#99F6E4',
    shifts: [
      { id: 'shift-2-m', time: '08:00 AM - 11:30 AM', name: 'Morning Shift' },
      { id: 'shift-2-e', time: '04:00 PM - 07:30 PM', name: 'Evening Shift' },
    ],
  },
  '3rd Year': {
    year: '3rd Year',
    yearNumber: 3,
    dropoffDay: 'Wednesday',
    pickupDay: 'Friday',
    badgeColor: '#8B5CF6', // Purple
    badgeBg: '#F5F3FF',
    badgeBorder: '#DDD6FE',
    shifts: [
      { id: 'shift-3-m', time: '08:00 AM - 11:30 AM', name: 'Morning Shift' },
      { id: 'shift-3-e', time: '04:00 PM - 07:30 PM', name: 'Evening Shift' },
    ],
  },
  '4th Year': {
    year: '4th Year',
    yearNumber: 4,
    dropoffDay: 'Friday',
    pickupDay: 'Sunday',
    badgeColor: '#F59E0B', // Amber
    badgeBg: '#FFFBEB',
    badgeBorder: '#FDE68A',
    shifts: [
      { id: 'shift-4-m', time: '08:00 AM - 11:30 AM', name: 'Morning Shift' },
      { id: 'shift-4-e', time: '04:00 PM - 07:30 PM', name: 'Evening Shift' },
    ],
  },
};

export const ACADEMIC_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export const getYearConfig = (yearString) => {
  if (!yearString) return YEAR_SCHEDULE['1st Year'];
  if (yearString.includes('1') || yearString.toLowerCase().includes('first')) return YEAR_SCHEDULE['1st Year'];
  if (yearString.includes('2') || yearString.toLowerCase().includes('second')) return YEAR_SCHEDULE['2nd Year'];
  if (yearString.includes('3') || yearString.toLowerCase().includes('third')) return YEAR_SCHEDULE['3rd Year'];
  if (yearString.includes('4') || yearString.toLowerCase().includes('fourth') || yearString.toLowerCase().includes('final')) return YEAR_SCHEDULE['4th Year'];
  return YEAR_SCHEDULE['1st Year'];
};

export const calculateYearSchedule = getYearConfig;

// Calculate next drop-off date string and guaranteed pickup date (+2 days)
export const getScheduledDates = (yearString) => {
  const config = getYearConfig(yearString);
  return {
    dropoffDay: config.dropoffDay,
    pickupDay: config.pickupDay,
    dropoffNotice: `Every ${config.dropoffDay}`,
    pickupNotice: `Every ${config.pickupDay} (after 2 days)`,
  };
};
