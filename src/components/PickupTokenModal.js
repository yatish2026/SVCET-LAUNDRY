import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../constants/theme';
import StatusBadge from './StatusBadge';
import QRCodeDisplay from './QRCodeDisplay';

export const PickupTokenModal = ({ visible, onClose, booking }) => {
  if (!booking) return null;

  const qrData = {
    token: booking.pickup_token,
    booking_id: booking.id,
    student_name: booking.student_name,
    student_id: booking.student_id,
    phone_number: booking.phone_number,
    total_items: booking.total_items,
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color={THEME.colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="qr-code" size={24} color="#4338CA" />
            </View>
            <Text style={styles.title}>Digital Pickup QR Pass</Text>
            <Text style={styles.subtitle}>Present this QR code to counter staff for quick collection</Text>
          </View>

          {/* Dynamic Scannable QR Box */}
          <View style={styles.qrContainer}>
            <QRCodeDisplay
              value={qrData}
              size={160}
              token={booking.pickup_token}
              studentName={booking.student_name}
              showTokenLabel={true}
            />
            <View style={{ marginTop: 8 }}>
              <StatusBadge status={booking.status} size="sm" />
            </View>
          </View>

          {/* Booking Summary */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Student:</Text>
              <Text style={styles.summaryValue}>{booking.student_name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Hostel / Room:</Text>
              <Text style={styles.summaryValue}>
                {booking.hostel_block?.split(' ')[0]} - Rm {booking.room_number}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Clothes Count:</Text>
              <Text style={styles.summaryValue}>{booking.total_items} items</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pickup Counter:</Text>
              <Text style={[styles.summaryValue, { color: THEME.colors.primary, fontWeight: '700' }]}>
                {booking.counter_number || 'Counter 1'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.doneBtnText}>Close Token</Text>
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
});

export default PickupTokenModal;
