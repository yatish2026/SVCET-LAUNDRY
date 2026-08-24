// RVS University Official Hostel Laundry Schedule Mapping

export const STUDENT_GENDERS = [
  { id: 'male', label: 'Male (Boys Hostel)', icon: 'man-outline' },
  { id: 'female', label: 'Female (Girls Hostel)', icon: 'woman-outline' },
];

export const STUDENT_LOCATIONS = [
  'Andhra Pradesh',
  'Telangana',
  'Karnataka',
  'Tamil Nadu',
  'Kerala',
  'Bihar',
  'Nepal',
  'Rajasthan',
  'Punjab',
  'Andaman & Nicobar',
  'South Africa',
  'Other States / International',
];

export const ACADEMIC_COURSES = [
  'B.Tech 1st Year',
  'B.Tech 2nd Year',
  'B.Tech 3rd Year',
  'B.Tech 4th Year',
  'Diploma 1st Year',
  'Diploma 2nd Year',
  'Pharmacy',
  'Nursing',
  'MBA',
  'MCA',
  'BBT / Bio-Tech',
  'Other Courses',
];

export const ACADEMIC_YEARS = ACADEMIC_COURSES;

/**
 * Official RVS University Schedule Matrix:
 * 1. Girls Hostel (All Branches): Drop Tuesday -> Return Friday
 * 2. Nursing, Pharmacy, BBT, Diploma 2nd Year, Nepal: Drop Tuesday -> Return Thursday
 * 3. Bihar Batch: Drop Wednesday -> Return Friday
 * 4. B.Tech 3rd & 4th Year, MBA, MCA: Drop Monday -> Return Wednesday
 * 5. B.Tech 2nd Year & Diploma 1st Year: Drop Saturday -> Return Tuesday
 * 6. B.Tech 1st Year: Drop Friday -> Return Monday
 */
export const getStudentSchedule = (studentProfile) => {
  const gender = (studentProfile?.gender || '').toLowerCase().trim();
  const location = (studentProfile?.location || studentProfile?.state || '').toLowerCase().trim();
  const category = (studentProfile?.academic_year || studentProfile?.course || '').toLowerCase().trim();
  const hostel = (studentProfile?.hostel_block || '').toLowerCase().trim();

  // 1. Girls Hostel: Drop-off Tuesday -> Pickup Friday (All female students in Girls Hostel)
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

  // 2. Nepal, Diploma 2nd Year, BBT, Nursing, Pharmacy: Drop Tuesday -> Return Thursday
  if (
    category.includes('nursing') ||
    category.includes('pharmacy') ||
    category.includes('bbt') ||
    category.includes('bio') ||
    category.includes('2nd year diploma') ||
    category.includes('diploma 2') ||
    category.includes('2nd dip') ||
    category.includes('diploma 2nd') ||
    location.includes('nepal')
  ) {
    return {
      category: 'Nepal / Dip 2 / Nursing / Pharmacy / BBT',
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

  // 3. Bihar Batch: Drop Wednesday -> Return Friday
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

  // 4. B.Tech 3rd & 4th Year, MBA, MCA: Drop Monday -> Pickup Wednesday
  if (
    category.includes('3rd') ||
    category.includes('4th') ||
    category.includes('third') ||
    category.includes('fourth') ||
    category.includes('final') ||
    category.includes('mba') ||
    category.includes('mca')
  ) {
    return {
      category: 'B.Tech 3rd/4th / MBA / MCA',
      dropoffDay: 'Monday',
      pickupDay: 'Wednesday',
      dropoffSlot: '08:00 AM - 11:30 AM',
      pickupSlot: '04:00 PM - 07:30 PM',
      badgeColor: '#7C3AED', // Violet
      badgeBg: '#F5F3FF',
      badgeBorder: '#DDD6FE',
      description: 'Senior Batch: Drop-off on Monday • Return on Wednesday',
    };
  }

  // 5. B.Tech 2nd Year & Diploma 1st Year: Drop Saturday -> Pickup Tuesday
  if (
    category.includes('2nd year b') ||
    category.includes('b.tech 2') ||
    category.includes('2nd b') ||
    category.includes('1st year diploma') ||
    category.includes('diploma 1') ||
    category.includes('1st dip') ||
    category.includes('diploma 1st')
  ) {
    return {
      category: 'B.Tech 2nd / Diploma 1st',
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

  // 6. B.Tech 1st Year (Default): Drop Friday -> Pickup Monday
  return {
    category: 'B.Tech 1st Year',
    dropoffDay: 'Friday',
    pickupDay: 'Monday',
    dropoffSlot: '08:00 AM - 11:30 AM',
    pickupSlot: '04:00 PM - 07:30 PM',
    badgeColor: '#2563EB', // Blue
    badgeBg: '#EFF6FF',
    badgeBorder: '#BFDBFE',
    description: 'B.Tech 1st Year: Drop-off on Friday • Return on Monday',
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
