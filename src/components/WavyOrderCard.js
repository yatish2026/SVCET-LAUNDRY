import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

const HORIZONTAL_WAVE_PATHS = {
  1: 'M 22 4 C 80 0, 190 8, 280 2 C 325 -1, 356 8, 356 24 C 356 46, 352 64, 356 76 C 356 90, 325 94, 280 92 C 190 96, 80 88, 22 92 C 4 94, 4 80, 4 64 C 4 46, 8 24, 4 16 C 4 6, 12 4, 22 4 Z',
  2: 'M 18 6 C 90 10, 180 2, 270 6 C 320 8, 356 4, 356 20 C 356 44, 350 62, 356 74 C 356 88, 310 92, 260 90 C 170 86, 90 94, 20 90 C 4 88, 6 72, 4 52 C 2 32, 6 18, 4 12 C 4 4, 10 5, 18 6 Z',
};

const getStatusTheme = (status) => {
  switch (status) {
    case 'completed':
      return {
        bg: '#EBF8F1',
        border: '#A5E4C2',
        badgeBg: '#DCFCE7',
        badgeColor: '#15803D',
        icon: 'checkmark-circle',
        badgeText: 'Collected & Completed',
      };
    case 'ready_for_pickup':
      return {
        bg: '#FEF4E8',
        border: '#FCD4AB',
        badgeBg: '#FEF3C7',
        badgeColor: '#B45309',
        icon: 'sparkles',
        badgeText: 'Ready for Pickup',
      };
    case 'drying_ironing':
      return {
        bg: '#F5EEFC',
        border: '#DCBEF7',
        badgeBg: '#F3E8FF',
        badgeColor: '#7E22CE',
        icon: 'shirt',
        badgeText: 'Drying & Ironing',
      };
    case 'in_wash':
      return {
        bg: '#ECF6FC',
        border: '#B6E0F9',
        badgeBg: '#DBEAFE',
        badgeColor: '#1D4ED8',
        icon: 'water',
        badgeText: 'In Washing Machine',
      };
    case 'cancelled':
      return {
        bg: '#FEF1F2',
        border: '#FEC3CB',
        badgeBg: '#FEE2E2',
        badgeColor: '#991B1B',
        icon: 'close-circle',
        badgeText: 'Cancelled',
      };
    default:
      return {
        bg: '#F1F7F9',
        border: '#C0DEE8',
        badgeBg: '#E2E8F0',
        badgeColor: '#475569',
        icon: 'time-outline',
        badgeText: 'Pending Intake',
      };
  }
};

export const WavyOrderCard = ({
  token,
  status,
  totalItems = 1,
  academicYear,
  studentName,
  onPress,
  variantIndex = 0,
}) => {
  const statusTheme = getStatusTheme(status);
  const variant = (variantIndex % 2) + 1;
  const pathD = HORIZONTAL_WAVE_PATHS[variant];

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* 🌊 SVG Layer behind with pointerEvents="none" */}
      <View style={styles.svgLayer} pointerEvents="none">
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 360 95"
          preserveAspectRatio="none"
        >
          <Path
            d={pathD}
            fill={statusTheme.bg}
            stroke={statusTheme.border}
            strokeWidth="1.8"
          />
        </Svg>
      </View>

      {/* 📝 Content Layer with high zIndex & elevation for Android */}
      <View style={styles.cardContent}>
        {/* Top Row: Order ID + Status Badge */}
        <View style={styles.topRow}>
          <View style={styles.idGroup}>
            <Text style={styles.tokenText}>#{token}</Text>
            {academicYear ? (
              <View style={styles.yearBadge}>
                <Text style={styles.yearBadgeText}>{academicYear}</Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusTheme.badgeBg }]}>
            <Ionicons name={statusTheme.icon} size={13} color={statusTheme.badgeColor} />
            <Text style={[styles.statusBadgeText, { color: statusTheme.badgeColor }]}>
              {statusTheme.badgeText}
            </Text>
          </View>
        </View>

        {/* Bottom Row: Total Clothes + More Details Button */}
        <View style={styles.bottomRow}>
          <View style={styles.clothesGroup}>
            <Ionicons name="shirt-outline" size={15} color="#0F4C5C" />
            <Text style={styles.clothesCountText}>{totalItems} Clothes</Text>
            {studentName ? (
              <Text style={styles.studentNameText} numberOfLines={1}>
                • {studentName}
              </Text>
            ) : null}
          </View>

          <View style={styles.moreDetailsBtn}>
            <Text style={styles.moreDetailsText}>More Details</Text>
            <Ionicons name="chevron-forward" size={13} color="#0F4C5C" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    height: 96,
    position: 'relative',
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#0F4C5C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 4px 12px rgba(15, 76, 92, 0.05)',
      },
    }),
  },
  svgLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    elevation: 1,
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
    justifyContent: 'space-between',
    zIndex: 10,
    elevation: 8,
    backgroundColor: 'transparent',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 11,
    elevation: 9,
  },
  idGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  tokenText: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#0F4C5C',
    letterSpacing: -0.2,
  },
  yearBadge: {
    backgroundColor: 'rgba(15, 76, 92, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  yearBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F4C5C',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    zIndex: 11,
    elevation: 9,
  },
  clothesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    marginRight: 8,
  },
  clothesCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F4C5C',
  },
  studentNameText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    flex: 1,
  },
  moreDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 4.5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(15, 76, 92, 0.15)',
    gap: 2,
  },
  moreDetailsText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F4C5C',
  },
});

export default WavyOrderCard;
