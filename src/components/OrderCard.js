import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../constants/theme';
import StatusBadge from './StatusBadge';
import { getYearConfig } from '../constants/schedule';

export const OrderCard = ({
  booking,
  onPress,
  onAction,
  actionLabel,
  actionIcon,
  actionVariant = 'primary',
}) => {
  const isReady = booking.status === 'ready_for_pickup';
  const yearStr = booking.academic_year || '1st Year';
  const yearCfg = getYearConfig(yearStr);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Top Meta Row */}
      <View style={styles.topRow}>
        <View style={styles.tokenWrap}>
          <Text style={styles.tokenText}>#{booking.pickup_token || booking.id.slice(-6)}</Text>
          <View
            style={[
              styles.yearPill,
              { backgroundColor: yearCfg.badgeBg, borderColor: yearCfg.badgeBorder },
            ]}
          >
            <Text style={[styles.yearPillText, { color: yearCfg.badgeColor }]}>{yearStr}</Text>
          </View>
        </View>
        <StatusBadge status={booking.status} size="sm" />
      </View>

      {/* Student & Hostel Info */}
      <View style={styles.studentInfoBox}>
        <Text style={styles.studentName}>{booking.student_name}</Text>
        <Text style={styles.studentMeta}>
          {booking.hostel_block?.split(' ')[0]} • Rm {booking.room_number} • {booking.phone_number}
        </Text>
      </View>

      {/* Items & Schedule Timeline Pill */}
      <View style={styles.itemsRow}>
        <View style={styles.itemBadge}>
          <Ionicons name="shirt" size={14} color="#1D4ED8" />
          <Text style={styles.itemCountText}>{booking.total_items} Clothes</Text>
        </View>

        {booking.dropoff_slot_time ? (
          <View style={styles.slotBadge}>
            <Ionicons name="calendar-outline" size={13} color="#2563EB" />
            <Text style={styles.slotText} numberOfLines={1}>
              {booking.dropoff_slot_time.split('(')[0]}
            </Text>
          </View>
        ) : null}

        {booking.pickup_slot_time ? (
          <View style={[styles.slotBadge, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
            <Ionicons name="gift-outline" size={13} color="#059669" />
            <Text style={[styles.slotText, { color: '#065F46' }]} numberOfLines={1}>
              Collect: {booking.pickup_slot_time.split('(')[0]}
            </Text>
          </View>
        ) : null}
      </View>

      {booking.special_instructions ? (
        <View style={styles.notesWrap}>
          <Text style={styles.notesLabel}>Note: </Text>
          <Text style={styles.notesText} numberOfLines={1}>
            {booking.special_instructions}
          </Text>
        </View>
      ) : null}

      {/* Ready Alert */}
      {isReady && (
        <View style={styles.readyAlert}>
          <Ionicons name="sparkles" size={16} color="#059669" />
          <Text style={styles.readyAlertText}>
            Ready at {booking.counter_number || 'Counter 1'}! Tap for Token
          </Text>
        </View>
      )}

      {/* Action Footer */}
      {onAction && actionLabel && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              actionVariant === 'secondary' && styles.actionBtnSecondary,
              actionVariant === 'success' && styles.actionBtnSuccess,
            ]}
            onPress={onAction}
            activeOpacity={0.8}
          >
            {actionIcon && (
              <Ionicons
                name={actionIcon}
                size={15}
                color={actionVariant === 'secondary' ? THEME.colors.primaryDark : '#FFF'}
                style={{ marginRight: 6 }}
              />
            )}
            <Text
              style={[
                styles.actionBtnText,
                actionVariant === 'secondary' && styles.actionBtnTextSecondary,
              ]}
            >
              {actionLabel}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...THEME.shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tokenWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tokenText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  yearPill: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
  },
  yearPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  studentInfoBox: {
    marginBottom: 8,
  },
  studentName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  studentMeta: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 1,
  },
  itemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  itemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  itemCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
    marginLeft: 4,
  },
  slotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotText: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    marginLeft: 4,
  },
  notesWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: THEME.radius.xs,
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
  notesText: {
    fontSize: 10,
    color: THEME.colors.textSecondary,
    flex: 1,
  },
  readyAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: THEME.radius.sm,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  readyAlertText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
    marginLeft: 6,
  },
  footer: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    paddingVertical: 9,
    borderRadius: THEME.radius.md,
  },
  actionBtnSecondary: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  actionBtnSuccess: {
    backgroundColor: '#059669',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionBtnTextSecondary: {
    color: '#1D4ED8',
  },
});

export default OrderCard;
