import React, { useEffect, useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../constants/theme';
import StatusBadge from './StatusBadge';
import QRCodeDisplay from './QRCodeDisplay';
import { useLaundry } from '../context/LaundryContext';

export const PickupTokenModal = ({ visible, onClose, booking }) => {
  const { bookings, refreshData } = useLaundry();

  // Fast live-polling while modal is visible so staff scan immediately reflects
  useEffect(() => {
    if (!visible) return;
    refreshData();
    const interval = setInterval(refreshData, 2500);
    return () => clearInterval(interval);
  }, [visible, refreshData]);

  // Derive latest live booking from context
  const liveBooking = useMemo(() => {
    if (!booking) return null;
    const found = (bookings || []).find(
      (b) =>
        (booking.id && b.id && String(b.id) === String(booking.id)) ||
        (booking.pickup_token && b.pickup_token && String(b.pickup_token) === String(booking.pickup_token))
    );
    return found || booking;
  }, [bookings, booking]);

  if (!liveBooking) return null;

  const isCompleted = liveBooking.status === 'completed';

  const qrData = {
    token: liveBooking.pickup_token,
    booking_id: liveBooking.id,
    student_name: liveBooking.student_name,
    student_id: liveBooking.student_id,
    phone_number: liveBooking.phone_number,
    total_items: liveBooking.total_items,
    status: liveBooking.status,
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color={THEME.colors.textSecondary} />
          </TouchableOpacity>

          {isCompleted ? (
            /* 🎉 Live Completed Celebration State */
            <View style={styles.completedHeader}>
              <View style={styles.completedIconCircle}>
                <Ionicons name="checkmark-circle" size={38} color="#16A34A" />
              </View>
              <Text style={styles.completedTitle}>Order Completed! 🎉</Text>
              <Text style={styles.completedSubtitle}>
                Your laundry has been scanned, cleaned, and handed over at the counter.
              </Text>
            </View>
          ) : (
            /* 🏷️ Active Pickup Pass Header */
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Ionicons name="qr-code" size={24} color="#4338CA" />
              </View>
              <Text style={styles.title}>Digital Pickup QR Pass</Text>
              <Text style={styles.subtitle}>Present this QR code to counter staff for instant scanning & collection</Text>
            </View>
          )}

          {/* Dynamic Scannable QR Box / Completed Verification Card */}
          {isCompleted ? (
            <View style={styles.completedCardBox}>
              <View style={styles.completedBadgeWrap}>
                <Ionicons name="shield-checkmark" size={16} color="#15803D" />
                <Text style={styles.completedBadgeText}>VERIFIED & DELIVERED</Text>
              </View>
              <Text style={styles.completedTokenText}>Token #{liveBooking.pickup_token}</Text>
              <Text style={styles.completedItemsSub}>
                🧺 {liveBooking.total_items} items collected by {liveBooking.student_name}
              </Text>
            </View>
          ) : (
            <View style={styles.qrContainer}>
              <QRCodeDisplay
                value={qrData}
                size={160}
                token={liveBooking.pickup_token}
                studentName={liveBooking.student_name}
                showTokenLabel={true}
              />
              <View style={{ marginTop: 8 }}>
                <StatusBadge status={liveBooking.status} size="sm" />
              </View>
            </View>
          )}

          {/* Booking Summary */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Student:</Text>
              <Text style={styles.summaryValue}>{liveBooking.student_name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Hostel / Room:</Text>
              <Text style={styles.summaryValue}>
                {liveBooking.hostel_block?.split(' ')[0]} - Rm {liveBooking.room_number}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Clothes Count:</Text>
              <Text style={styles.summaryValue}>{liveBooking.total_items} items</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Status:</Text>
              <Text style={[styles.summaryValue, { color: isCompleted ? '#16A34A' : THEME.colors.primary, fontWeight: '700' }]}>
                {isCompleted ? 'Completed / Delivered' : liveBooking.counter_number || 'Counter 1'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.doneBtn, isCompleted && { backgroundColor: '#16A34A' }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.doneBtnText}>{isCompleted ? 'Done / All Set' : 'Close Token'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.xl,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    ...THEME.shadows.lg,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: THEME.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: THEME.typography.sizes.xl,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  subtitle: {
    fontSize: THEME.typography.sizes.xs,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 3,
  },
  tokenBox: {
    width: '100%',
    backgroundColor: THEME.colors.primarySoft,
    borderWidth: 2,
    borderColor: THEME.colors.primaryLight,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.lg,
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  tokenLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
    color: THEME.colors.primaryDark,
    marginBottom: 4,
  },
  tokenCode: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 2,
    color: THEME.colors.primaryDark,
  },
  qrSimulation: {
    padding: 8,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.md,
    marginVertical: 10,
  },
  summaryBox: {
    width: '100%',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: THEME.typography.sizes.xs,
    color: THEME.colors.textSecondary,
  },
  summaryValue: {
    fontSize: THEME.typography.sizes.xs,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  doneBtn: {
    width: '100%',
    backgroundColor: THEME.colors.primary,
    paddingVertical: 13,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
  },
  doneBtnText: {
    color: THEME.colors.textInverse,
    fontWeight: '700',
    fontSize: THEME.typography.sizes.md,
  },
  completedHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  completedIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#86EFAC',
  },
  completedTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#15803D',
  },
  completedSubtitle: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 10,
  },
  completedCardBox: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#BBF7D0',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  completedBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 8,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#15803D',
    letterSpacing: 0.8,
  },
  completedTokenText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#14532D',
  },
  completedItemsSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
    marginTop: 4,
  },
});

export default PickupTokenModal;
