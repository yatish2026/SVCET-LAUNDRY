export const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳', length: 10, placeholder: '98765 43210' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵', length: 10, placeholder: '98123 45678' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦', length: 9, placeholder: '71 234 5678' },
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸', length: 10, placeholder: '202 555 0123' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧', length: 10, placeholder: '7911 123456' },
  { code: '+971', country: 'UAE', flag: '🇦🇪', length: 9, placeholder: '50 123 4567' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩', length: 10, placeholder: '1712 345678' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰', length: 9, placeholder: '71 234 5678' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪', length: 9, placeholder: '712 345678' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬', length: 10, placeholder: '802 123 4567' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾', length: 9, placeholder: '12 345 6789' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', length: 8, placeholder: '8123 4567' },
];

export const STUDENT_GENDERS = [
  { id: 'male', label: 'Male (Boys Hostel)', icon: 'man-outline' },
  { id: 'female', label: 'Female (Girls Hostel)', icon: 'woman-outline' },
];

export const STUDENT_LOCATIONS = [
  'Andhra Pradesh',
  'Tamil Nadu',
  'Kerala',
  'Bihar',
  'Nepal',
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

export const STUDENT_BRANCHES = [
  'CSE (Computer Science)',
  'ECE (Electronics & Comm)',
  'AI & DS (Artificial Intelligence)',
  'IT (Information Tech)',
  'Mechanical Engineering',
  'Civil Engineering',
  'EEE (Electrical & Electronics)',
  'MBA (Management)',
  'MCA (Computer Apps)',
  'B.Pharmacy',
  'B.Sc Nursing',
  'Bio-Technology',
  'General / Other',
];

export const ACADEMIC_YEARS = ACADEMIC_COURSES;

/**
 * Official RVS University 6-Day Weekly Schedule Matrix:
 * 1. 🗓️ MONDAY: B.Tech 1st Year & B.Tech 2nd Year -> Return WEDNESDAY (2 Days)
 * 2. 🗓️ TUESDAY: B.Tech 3rd Year & B.Tech 4th Year (MBA, MCA) -> Return THURSDAY (2 Days)
 * 3. 🗓️ WEDNESDAY: Diploma 1st Year & Diploma 2nd Year (Nursing, Pharmacy, BBT) -> Return FRIDAY (2 Days)
 * 4. 🗓️ THURSDAY: 🚺 Girls Hostel (All Branches & Years) -> Return SATURDAY (2 Days)
 * 5. 🗓️ FRIDAY: 🏔️ Nepal, Andaman & Nicobar, South Africa, Other States & International -> Return MONDAY
 * 6. 🗓️ SATURDAY: 🌾 Bihar State Batch -> Return TUESDAY
 * 7. 🗓️ SUNDAY: Laundry Center Maintenance / Rest
 */
export const getStudentSchedule = (studentProfile) => {
  const gender = (studentProfile?.gender || '').toLowerCase().trim();
  const location = (studentProfile?.location || studentProfile?.state || '').toLowerCase().trim();
  const category = (studentProfile?.academic_year || studentProfile?.course || '').toLowerCase().trim();
  const hostel = (studentProfile?.hostel_block || '').toLowerCase().trim();

  // 1. 🚺 THURSDAY: Girls Hostel (All female students in Girls Hostel) -> Return Saturday
  if (gender === 'female' || hostel.includes('girl') || hostel.includes('women') || hostel.includes('ladies')) {
    return {
      category: 'Girls Hostel (All Branches)',
      dropoffDay: 'Thursday',
      pickupDay: 'Saturday',
      dropoffSlot: '08:00 AM - 11:30 AM',
      pickupSlot: '04:00 PM - 07:30 PM',
      badgeColor: '#DB2777', // Pink
      badgeBg: '#FDF2F8',
      badgeBorder: '#FBCFE8',
      description: 'Thursday Batch: Drop-off on Thursday • Return on Saturday (2 Days)',
    };
  }

  // 2. 🌾 SATURDAY: Bihar State Batch -> Return Tuesday
  if (location.includes('bihar')) {
    return {
      category: 'Bihar State Batch',
      dropoffDay: 'Saturday',
      pickupDay: 'Tuesday',
      dropoffSlot: '08:00 AM - 11:30 AM',
      pickupSlot: '04:00 PM - 07:30 PM',
      badgeColor: '#D97706', // Amber
      badgeBg: '#FEF3C7',
      badgeBorder: '#FDE68A',
      description: 'Saturday Batch: Drop-off on Saturday • Return on Tuesday (3 Days)',
    };
  }

  // 3. 🏔️ FRIDAY: Nepal, Andaman & Nicobar, South Africa, Other States & International -> Return Monday
  if (
    location.includes('nepal') ||
    location.includes('andaman') ||
    location.includes('south africa') ||
    location.includes('other states') ||
    location.includes('international')
  ) {
    return {
      category: 'International & Other States',
      dropoffDay: 'Friday',
      pickupDay: 'Monday',
      dropoffSlot: '08:00 AM - 11:30 AM',
      pickupSlot: '04:00 PM - 07:30 PM',
      badgeColor: '#059669', // Emerald
      badgeBg: '#ECFDF5',
      badgeBorder: '#A7F3D0',
      description: 'Friday Batch: Drop-off on Friday • Return on Monday (3 Days)',
    };
  }

  // 4. 🛠️ WEDNESDAY: Diploma 1st Year, Diploma 2nd Year, Nursing, Pharmacy, BBT -> Return Friday
  if (
    category.includes('diploma') ||
    category.includes('nursing') ||
    category.includes('pharmacy') ||
    category.includes('bbt') ||
    category.includes('bio')
  ) {
    return {
      category: 'Diploma 1st/2nd, Nursing, Pharmacy, BBT',
      dropoffDay: 'Wednesday',
      pickupDay: 'Friday',
      dropoffSlot: '08:00 AM - 11:30 AM',
      pickupSlot: '04:00 PM - 07:30 PM',
      badgeColor: '#0284C7', // Sky Blue
      badgeBg: '#F0F9FF',
      badgeBorder: '#BAE6FD',
      description: 'Wednesday Batch: Drop-off on Wednesday • Return on Friday (2 Days)',
    };
  }

  // 5. 📙 TUESDAY: B.Tech 3rd Year & B.Tech 4th Year (MBA, MCA) -> Return Thursday
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
      category: 'B.Tech 3rd & 4th Year (MBA, MCA)',
      dropoffDay: 'Tuesday',
      pickupDay: 'Thursday',
      dropoffSlot: '08:00 AM - 11:30 AM',
      pickupSlot: '04:00 PM - 07:30 PM',
      badgeColor: '#7C3AED', // Violet
      badgeBg: '#F5F3FF',
      badgeBorder: '#DDD6FE',
      description: 'Tuesday Batch: Drop-off on Tuesday • Return on Thursday (2 Days)',
    };
  }

  // 6. 🎓 MONDAY: B.Tech 1st Year & B.Tech 2nd Year -> Return Wednesday
  return {
    category: 'B.Tech 1st & 2nd Year',
    dropoffDay: 'Monday',
    pickupDay: 'Wednesday',
    dropoffSlot: '08:00 AM - 11:30 AM',
    pickupSlot: '04:00 PM - 07:30 PM',
    badgeColor: '#2563EB', // Blue
    badgeBg: '#EFF6FF',
    badgeBorder: '#BFDBFE',
    description: 'Monday Batch: Drop-off on Monday • Return on Wednesday (2 Days)',
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
