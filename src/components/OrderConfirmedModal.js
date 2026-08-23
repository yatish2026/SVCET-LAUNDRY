import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../constants/theme';

export const OrderConfirmedModal = ({ visible, booking, onClose }) => {
  if (!booking) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Success Check Icon */}
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-circle" size={48} color="#059669" />
          </View>

          <Text style={styles.title}>Order Confirmed! 🎉</Text>
          <Text style={styles.subtitle}>
            Your laundry request has been registered in the system.
          </Text>

          {/* Token Callout */}
          <View style={styles.tokenBox}>
            <Text style={styles.tokenLabel}>YOUR PICKUP TOKEN</Text>
            <Text style={styles.tokenNumber}>#{booking.pickup_token}</Text>
          </View>

          {/* Schedule Breakdown */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <Ionicons name="calendar-outline" size={16} color="#1D4ED8" />
                <Text style={styles.infoLabel}>Drop-Off Day:</Text>
              </View>
              <Text style={styles.infoVal}>{booking.dropoff_slot_time?.split('(')[0]}</Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <Ionicons name="gift-outline" size={16} color="#059669" />
                <Text style={styles.infoLabel}>Pickup Date:</Text>
              </View>
              <Text style={[styles.infoVal, { color: '#059669', fontWeight: '800' }]}>
                {booking.pickup_slot_time?.split('(')[0]}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <Ionicons name="shirt-outline" size={16} color="#1D4ED8" />
                <Text style={styles.infoLabel}>Total Clothes:</Text>
              </View>
              <Text style={styles.infoVal}>{booking.total_items} items</Text>
            </View>
          </View>

          {/* Action Button: Back to Home */}
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>Return to Home</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFF" style={{ marginLeft: 6 }} />
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.radius.xl,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    ...THEME.shadows.lg,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  tokenBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: THEME.radius.md,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 14,
  },
  tokenLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  tokenNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E40AF',
    marginTop: 2,
    letterSpacing: 1,
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: THEME.radius.md,
    padding: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginLeft: 6,
  },
  infoVal: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    borderRadius: THEME.radius.lg,
    paddingVertical: 12,
    width: '100%',
    ...THEME.shadows.sm,
  },
  doneBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default OrderConfirmedModal;
