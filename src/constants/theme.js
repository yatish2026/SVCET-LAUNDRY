export const THEME = {
  colors: {
    // Cool Modern Palette
    primary: '#2563EB', // Vibrant Cool Blue
    primaryDark: '#1D4ED8',
    primaryLight: '#60A5FA',
    primarySoft: '#EFF6FF',

    secondary: '#0D9488', // Crisp Teal
    secondaryLight: '#14B8A6',
    secondarySoft: '#F0FDFA',

    accent: '#8B5CF6', // Cool Purple
    accentSoft: '#F5F3FF',

    info: '#0284C7', // Sky
    infoSoft: '#E0F2FE',

    success: '#059669', // Emerald
    successSoft: '#ECFDF5',

    warning: '#D97706', // Warm Amber
    warningSoft: '#FFFBEB',

    danger: '#E11D48', // Rose
    dangerSoft: '#FFE4E6',

    background: '#F1F5F9', // Cool light slate
    surface: '#FFFFFF',
    surfaceSubtle: '#F8FAFC',
    surfaceHover: '#E2E8F0',

    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    textInverse: '#FFFFFF',

    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    borderFocus: '#2563EB',
    divider: '#F1F5F9',

    // Status Colors (Instant booking, no waiting for approval)
    status: {
      booked_scheduled: {
        label: 'Drop-Off Scheduled',
        color: '#2563EB',
        bg: '#EFF6FF',
        border: '#BFDBFE',
        icon: 'calendar-outline',
      },
      pending_approval: {
        label: 'Drop-Off Scheduled',
        color: '#2563EB',
        bg: '#EFF6FF',
        border: '#BFDBFE',
        icon: 'calendar-outline',
      },
      dropoff_scheduled: {
        label: 'Drop-Off Scheduled',
        color: '#2563EB',
        bg: '#EFF6FF',
        border: '#BFDBFE',
        icon: 'calendar-outline',
      },
      in_wash: {
        label: 'In Washing Machine',
        color: '#0284C7',
        bg: '#E0F2FE',
        border: '#BAE6FD',
        icon: 'water-outline',
      },
      drying_ironing: {
        label: 'Drying & Ironing',
        color: '#7C3AED',
        bg: '#F5F3FF',
        border: '#DDD6FE',
        icon: 'flash-outline',
      },
      ready_for_pickup: {
        label: 'Ready for Pickup',
        color: '#059669',
        bg: '#ECFDF5',
        border: '#A7F3D0',
        icon: 'gift-outline',
      },
      completed: {
        label: 'Collected / Delivered',
        color: '#334155',
        bg: '#F1F5F9',
        border: '#E2E8F0',
        icon: 'checkmark-done-circle-outline',
      },
      cancelled: {
        label: 'Cancelled',
        color: '#E11D48',
        bg: '#FFE4E6',
        border: '#FECDD3',
        icon: 'close-circle-outline',
      },
    },
  },
  typography: {
    fontFamily: 'System',
    sizes: {
      xs: 11,
      sm: 13,
      md: 15,
      lg: 17,
      xl: 20,
      xxl: 24,
      hero: 28,
    },
    weights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      heavy: '800',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  radius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#64748B',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#64748B',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#64748B',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 14,
      elevation: 8,
    },
  },
};

export default THEME;
