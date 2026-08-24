// RVS University Official Hostel Laundry Schedule Mapping

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

export const ACADEMIC_YEARS = ACADEMIC_COURSES;

/**
 * Clean 6-Day Weekly Schedule Matrix (Monday to Saturday):
 * 1. 🗓️ MONDAY: 3rd & 4th Year B.Tech, MBA, MCA (Senior PG / Final Years) -> Return WEDNESDAY (2 Days)
 * 2. 🗓️ TUESDAY: Nepal, Andaman & Nicobar, South Africa, Other States/Countries & 2nd Dip, BBT, Nursing, Pharmacy -> Return THURSDAY (2 Days)
 * 3. 🗓️ WEDNESDAY: Bihar State Batch -> Return FRIDAY (2 Days)
 * 4. 🗓️ THURSDAY: 🚺 Girls Hostel (All Branches & Years) -> Return SATURDAY (2 Days)
 * 5. 🗓️ FRIDAY: 1st Year B.Tech (Andhra Pradesh, Tamil Nadu, Kerala, General) -> Return MONDAY
 * 6. 🗓️ SATURDAY: 2nd Year B.Tech & 1st Year Diploma -> Return TUESDAY
 * 7. 🗓️ SUNDAY: Laundry Center Maintenance / Rest
 */
export const getStudentSchedule = (studentProfile) => {
  const gender = (studentProfile?.gender || '').toLowerCase().trim();
  const location = (studentProfile?.location || studentProfile?.state || '').toLowerCase().trim();
  const category = (studentProfile?.academic_year || studentProfile?.course || '').toLowerCase().trim();
  const hostel = (studentProfile?.hostel_block || '').toLowerCase().trim();

  // 1. 🚺 Girls Hostel: Drop-off THURSDAY -> Pickup SATURDAY
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

  // 2. 🏔️ International / Remote Regions (Nepal, Andaman & Nicobar, South Africa, Other States/Countries)
  //    + Specialized Courses (2nd Year Diploma, BBT, Nursing, Pharmacy): Drop-off TUESDAY -> Return THURSDAY
  if (
    category.includes('nursing') ||
    category.includes('pharmacy') ||
    category.includes('bbt') ||
    category.includes('bio') ||
    category.includes('2nd year diploma') ||
    category.includes('diploma 2') ||
    category.includes('2nd dip') ||
    category.includes('diploma 2nd') ||
    location.includes('nepal') ||
    location.includes('andaman') ||
    location.includes('south africa') ||
    location.includes('other states') ||
    location.includes('international')
  ) {
    const isRemote =
      location.includes('nepal') ||
      location.includes('andaman') ||
      location.includes('south africa') ||
      location.includes('other states') ||
      location.includes('international');

    return {
      category: isRemote ? 'International & Remote Batch' : 'Nursing / Pharmacy / BBT / 2nd Dip',
      dropoffDay: 'Tuesday',
      pickupDay: 'Thursday',
      dropoffSlot: '08:00 AM - 11:30 AM',
      pickupSlot: '04:00 PM - 07:30 PM',
      badgeColor: '#059669', // Emerald
      badgeBg: '#ECFDF5',
      badgeBorder: '#A7F3D0',
      description: 'Tuesday Batch: Drop-off on Tuesday • Return on Thursday (2 Days)',
    };
  }

  // 3. 🌾 Bihar State Batch: Drop-off WEDNESDAY -> Return FRIDAY
  if (location.includes('bihar')) {
    return {
      category: 'Bihar State Batch',
      dropoffDay: 'Wednesday',
      pickupDay: 'Friday',
      dropoffSlot: '08:00 AM - 11:30 AM',
      pickupSlot: '04:00 PM - 07:30 PM',
      badgeColor: '#D97706', // Amber
      badgeBg: '#FEF3C7',
      badgeBorder: '#FDE68A',
      description: 'Wednesday Batch: Drop-off on Wednesday • Return on Friday (2 Days)',
    };
  }

  // 4. 📙 Senior PG & Final Years (3rd & 4th Year B.Tech, MBA, MCA): Drop-off MONDAY -> Return WEDNESDAY
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
      description: 'Monday Batch: Drop-off on Monday • Return on Wednesday (2 Days)',
    };
  }

  // 5. 📘 2nd Year B.Tech & 1st Year Diploma: Drop-off SATURDAY -> Return TUESDAY
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
      description: 'Saturday Batch: Drop-off on Saturday • Return on Tuesday',
    };
  }

  // 6. 🎓 1st Year B.Tech (Andhra Pradesh, Tamil Nadu, Kerala, General): Drop-off FRIDAY -> Return MONDAY
  return {
    category: '1st Year B.Tech',
    dropoffDay: 'Friday',
    pickupDay: 'Monday',
    dropoffSlot: '08:00 AM - 11:30 AM',
    pickupSlot: '04:00 PM - 07:30 PM',
    badgeColor: '#2563EB', // Blue
    badgeBg: '#EFF6FF',
    badgeBorder: '#BFDBFE',
    description: 'Friday Batch: Drop-off on Friday • Return on Monday',
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
