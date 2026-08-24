// RVS University Official Hostel Laundry Schedule Mapping

export const STUDENT_GENDERS = [
  { id: 'male', label: 'Male (Boys Hostel)', icon: 'man-outline' },
  { id: 'female', label: 'Female (Girls Hostel)', icon: 'woman-outline' },
];

export const STUDENT_LOCATIONS = [
  'Andhra Pradesh',
  'Kerala',
  'Tamil Nadu',
  'Bihar',
  'Nepal',
  'Andaman & Nicobar',
  'South Africa',
  'Other States / International',
];

export const ACADEMIC_COURSES = [
  '1st Year B.Tech',
  '2nd Year B.Tech',
  '3rd Year B.Tech',
  '4th Year B.Tech',
  '1st Year Diploma',
  '2nd Year Diploma',
  'BBT / Bio-Tech',
  'Nursing',
  'Other Courses',
];

export const ACADEMIC_YEARS = ACADEMIC_COURSES;

/**
 * Official RVS University Schedule Matrix:
 * 1. 1st Year B.Tech: Drop Friday -> Pickup Monday
 * 2. 2nd Year B.Tech & 1st Year Diploma: Drop Saturday -> Pickup Tuesday
 * 3. 3rd & 4th Year B.Tech: Drop Monday -> Pickup Wednesday
 * 4. Nepal, 2nd Year Diploma, BBT, Nursing: Drop Tuesday -> Pickup Thursday
 * 5. Bihar: Drop Wednesday -> Pickup Friday
 * 6. Girls Hostel: Drop Tuesday -> Pickup Friday
 */
export const getStudentSchedule = (studentProfile) => {
  const gender = (studentProfile?.gender || '').toLowerCase();
  const location = (studentProfile?.location || studentProfile?.state || '').toLowerCase();
  const category = (studentProfile?.academic_year || studentProfile?.course || '').toLowerCase();
  const hostel = (studentProfile?.hostel_block || '').toLowerCase();

  // 1. Girls Hostel: Drop-off Tuesday -> Pickup Friday
  if (gender === 'female' || hostel.includes('girl') || hostel.includes('women') || hostel.includes('ladies')) {
    return {
      category: 'Girls Hostel (All Branches)',
      dropoffDay: 'Tuesday',
      pickupDay: 'Friday',
      dropoffSlot: '08:00 AM - 11:30 AM',
      pickupSlot: '04:00 PM - 07:30 PM',
      badgeColor: '#DB2777', // Pink
      badgeBg: '#FDF2F8',
      badgeBorder: '#FBCFE8',
      description: 'Girls Hostel: Drop-off on Tuesday • Collect on Friday',
    };
  }

  // 2. Bihar Batch: Drop-off Wednesday -> Return Friday
  if (location.includes('bihar')) {
    return {
      category: 'Bihar Batch',
      dropoffDay: 'Wednesday',
      pickupDay: 'Friday',
      dropoffSlot: '08:00 AM - 11:30 AM',
      pickupSlot: '04:00 PM - 07:30 PM',
      badgeColor: '#D97706', // Amber
      badgeBg: '#FEF3C7',
      badgeBorder: '#FDE68A',
      description: 'Bihar Batch: Drop-off on Wednesday • Return on Friday',
    };
  }

  // 3. Nepal, 2nd Year Diploma, BBT, Nursing: Drop-off Tuesday -> Return Thursday
  if (
    location.includes('nepal') ||
    category.includes('2nd year diploma') ||
    category.includes('diploma 2') ||
    category.includes('bbt') ||
    category.includes('nursing')
  ) {
    return {
      category: 'Nepal / 2nd Dip / BBT / Nursing',
      dropoffDay: 'Tuesday',
      pickupDay: 'Thursday',
      dropoffSlot: '08:00 AM - 11:30 AM',
      pickupSlot: '04:00 PM - 07:30 PM',
      badgeColor: '#059669', // Emerald
      badgeBg: '#ECFDF5',
      badgeBorder: '#A7F3D0',
      description: 'Tuesday Batch: Drop-off on Tuesday • Return on Thursday',
    };
  }

  // 4. 3rd and 4th Year B.Tech: Drop-off Monday -> Pickup Wednesday
  if (
    category.includes('3rd') ||
    category.includes('4th') ||
    category.includes('third') ||
    category.includes('fourth') ||
    category.includes('final')
  ) {
    return {
      category: '3rd & 4th Year B.Tech',
      dropoffDay: 'Monday',
      pickupDay: 'Wednesday',
      dropoffSlot: '08:00 AM - 11:30 AM',
      pickupSlot: '04:00 PM - 07:30 PM',
      badgeColor: '#7C3AED', // Violet
      badgeBg: '#F5F3FF',
      badgeBorder: '#DDD6FE',
      description: '3rd & 4th Year B.Tech: Drop-off on Monday • Return on Wednesday',
    };
  }

  // 5. 2nd Year B.Tech & 1st Year Diploma: Drop-off Saturday -> Pickup Tuesday
  if (
    category.includes('2nd year b') ||
    category.includes('2nd b') ||
    category.includes('1st year diploma') ||
    category.includes('diploma 1')
  ) {
    return {
      category: '2nd B.Tech & 1st Diploma',
      dropoffDay: 'Saturday',
      pickupDay: 'Tuesday',
      dropoffSlot: '08:00 AM - 11:30 AM',
      pickupSlot: '04:00 PM - 07:30 PM',
      badgeColor: '#0284C7', // Sky Blue
      badgeBg: '#F0F9FF',
      badgeBorder: '#BAE6FD',
      description: '2nd B.Tech / 1st Dip: Drop-off on Saturday • Return on Tuesday',
    };
  }

  // 6. 1st Year B.Tech (Default): Drop-off Friday -> Pickup Monday
  return {
    category: '1st Year B.Tech',
    dropoffDay: 'Friday',
    pickupDay: 'Monday',
    dropoffSlot: '08:00 AM - 11:30 AM',
    pickupSlot: '04:00 PM - 07:30 PM',
    badgeColor: '#2563EB', // Blue
    badgeBg: '#EFF6FF',
    badgeBorder: '#BFDBFE',
    description: '1st Year B.Tech: Drop-off on Friday • Return on Monday',
  };
};

export const getYearConfig = (studentOrYear) => {
  if (typeof studentOrYear === 'object' && studentOrYear !== null) {
    return getStudentSchedule(studentOrYear);
  }
  return getStudentSchedule({ academic_year: studentOrYear });
};

export const calculateYearSchedule = getYearConfig;

export const getScheduledDates = (studentProfile) => {
  const config = getYearConfig(studentProfile);
  return {
    dropoffDay: config.dropoffDay,
    pickupDay: config.pickupDay,
    dropoffNotice: `Every ${config.dropoffDay}`,
    pickupNotice: `Every ${config.pickupDay}`,
  };
};

export default getStudentSchedule;
