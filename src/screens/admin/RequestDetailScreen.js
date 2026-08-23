import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../constants/theme';
import { useLaundry } from '../../context/LaundryContext';
import { CLOTHES_CATEGORIES } from '../../constants/categories';
import { getYearConfig } from '../../constants/schedule';
import StatusBadge from '../../components/StatusBadge';
import StepTracker from '../../components/StepTracker';
import ImagePreviewModal from '../../components/ImagePreviewModal';

export const RequestDetailScreen = ({ bookingId, onBack }) => {
  const { bookings, updateOrderStatus } = useLaundry();

  const booking = bookings.find((b) => b.id === bookingId);
  const [selectedCounter, setSelectedCounter] = useState('Counter 1');
  const [verifiedItems, setVerifiedItems] = useState({});
  const [previewPhotoUri, setPreviewPhotoUri] = useState(null);

  if (!booking) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Request not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const yearStr = booking.academic_year || '1st Year';
  const yearCfg = getYearConfig(yearStr);

  const getItemName = (itemId) => {
    for (const cat of CLOTHES_CATEGORIES) {
      const match = cat.items.find((i) => i.id === itemId);
      if (match) return match.name;
    }
    return itemId.replace('_', ' ');
  };

  const toggleVerifyItem = (itemId) => {
    setVerifiedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleAdvanceStatus = async (nextStatus) => {
    if (nextStatus === 'ready_for_pickup') {
      await updateOrderStatus(booking.id, 'ready_for_pickup', {
        counter: selectedCounter,
      });
      Alert.alert(
        'Pickup Alert Sent! ✨',
        `${booking.student_name} was notified that laundry is clean & ready for pickup at ${selectedCounter} with Token #${booking.pickup_token}.`
      );
    } else {
      await updateOrderStatus(booking.id, nextStatus, { counter: selectedCounter });
    }
  };

  const isScheduled =
    booking.status === 'dropoff_scheduled' || booking.status === 'pending_approval';
  const isWashing = booking.status === 'in_wash';
  const isDrying = booking.status === 'drying_ironing';
  const isReady = booking.status === 'ready_for_pickup';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.headerTitle}>Order #{booking.pickup_token}</Text>
            <View
              style={[
                styles.yearPill,
                { backgroundColor: yearCfg.badgeBg, borderColor: yearCfg.badgeBorder },
              ]}
            >
              <Text style={[styles.yearPillText, { color: yearCfg.badgeColor }]}>{yearStr}</Text>
            </View>
          </View>
          <Text style={styles.headerSub}>{booking.student_name} • {booking.hostel_block?.split(' ')[0]}</Text>
        </View>
        <StatusBadge status={booking.status} size="sm" />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Year-Based Schedule Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Year Schedule & Timing</Text>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleBlock}>
              <Text style={styles.scheduleBlockLabel}>ACADEMIC YEAR</Text>
              <Text style={[styles.scheduleBlockVal, { color: yearCfg.badgeColor }]}>{yearStr}</Text>
            </View>
            <View style={styles.scheduleBlock}>
              <Text style={styles.scheduleBlockLabel}>DROP-OFF DAY</Text>
              <Text style={styles.scheduleBlockVal}>{yearCfg.dropoffDay}</Text>
            </View>
            <View style={styles.scheduleBlock}>
              <Text style={styles.scheduleBlockLabel}>COLLECTION PICKUP</Text>
              <Text style={[styles.scheduleBlockVal, { color: '#059669' }]}>
                {yearCfg.pickupDay} (+2 days)
              </Text>
            </View>
          </View>
        </View>

        {/* Student Identity Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Student Identification</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Student Name:</Text>
            <Text style={styles.metaVal}>{booking.student_name}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Student ID / Roll No:</Text>
            <Text style={styles.metaVal}>{booking.student_id || 'N/A'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Hostel & Room:</Text>
            <Text style={styles.metaVal}>
              {booking.hostel_block} • Room {booking.room_number}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Contact Mobile:</Text>
            <Text style={styles.metaVal}>{booking.phone_number}</Text>
          </View>
        </View>

        {/* Physical Clothes Verification Checklist */}
        <View style={styles.card}>
          <View style={styles.itemsHeader}>
            <Text style={styles.cardTitle}>Intake Clothes Checklist</Text>
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>{booking.total_items} Items Total</Text>
            </View>
          </View>
          <Text style={styles.checklistNote}>
            Tap items below to verify pieces as the student hands over the bag:
          </Text>

          <View style={styles.checklistWrap}>
            {Object.entries(booking.items || {}).map(([itemId, count]) => {
              const isChecked = !!verifiedItems[itemId];
              return (
                <TouchableOpacity
                  key={itemId}
                  style={[styles.checklistItem, isChecked && styles.checklistItemChecked]}
                  onPress={() => toggleVerifyItem(itemId)}
                  activeOpacity={0.8}
                >
                  <View style={styles.checkLeft}>
                    <Ionicons
                      name={isChecked ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={isChecked ? '#059669' : THEME.colors.textMuted}
                    />
                    <Text
                      style={[styles.checkItemName, isChecked && styles.checkItemNameChecked]}
                    >
                      {getItemName(itemId)}
                    </Text>
                  </View>
                  <Text style={styles.checkItemCount}>x{count} pcs</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {booking.special_instructions ? (
            <View style={styles.instructionsBox}>
              <Text style={styles.instructionsLabel}>Student Notes:</Text>
              <Text style={styles.instructionsText}>{booking.special_instructions}</Text>
            </View>
          ) : null}
        </View>

        {/* 📸 Clothes Photo Verification Gallery */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Uploaded Clothes Photos</Text>
          {(() => {
            const rawPhotos = booking.photos || [];
            const photosList = Array.isArray(rawPhotos)
              ? rawPhotos
              : typeof rawPhotos === 'string'
              ? JSON.parse(rawPhotos || '[]')
              : [];

            if (photosList.length === 0) {
              return <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>No photos attached with this request.</Text>;
            }

            return (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ flexDirection: 'row', gap: 8, marginTop: 8 }}
              >
                {photosList.map((photoUri, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 12,
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: '#CBD5E1',
                    }}
                    onPress={() => setPreviewPhotoUri(photoUri)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            );
          })()}
        </View>

        {/* Counter Selection */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Collection Desk / Counter</Text>
          <View style={styles.counterRow}>
            {['Counter 1 (Boys)', 'Counter 2 (Girls)', 'Express Counter'].map((cnt) => (
              <TouchableOpacity
                key={cnt}
                style={[
                  styles.counterChip,
                  selectedCounter === cnt && styles.counterChipActive,
                ]}
                onPress={() => setSelectedCounter(cnt)}
              >
                <Text
                  style={[
                    styles.counterChipText,
                    selectedCounter === cnt && styles.counterChipTextActive,
                  ]}
                >
                  {cnt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Wash Operations & Stage Transitions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Laundry Operations</Text>
          <View style={styles.opsGrid}>
            <TouchableOpacity
              style={[styles.opBtn, isWashing && styles.opBtnActive]}
              onPress={() => handleAdvanceStatus('in_wash')}
            >
              <Ionicons name="water" size={18} color="#0284C7" />
              <Text style={styles.opBtnText}>1. In Wash</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.opBtn, isDrying && styles.opBtnActive]}
              onPress={() => handleAdvanceStatus('drying_ironing')}
            >
              <Ionicons name="flash" size={18} color="#7C3AED" />
              <Text style={styles.opBtnText}>2. Dryer & Iron</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.opBtn, isReady && styles.opBtnActive]}
              onPress={() => handleAdvanceStatus('ready_for_pickup')}
            >
              <Ionicons name="gift" size={18} color="#059669" />
              <Text style={styles.opBtnText}>3. Ready Pickup</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.opBtn, booking.status === 'completed' && styles.opBtnActive]}
              onPress={() => handleAdvanceStatus('completed')}
            >
              <Ionicons name="checkmark-done-circle" size={18} color="#1D4ED8" />
              <Text style={styles.opBtnText}>4. Delivered</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        visible={!!previewPhotoUri}
        imageUri={previewPhotoUri}
        onClose={() => setPreviewPhotoUri(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 16,
    color: THEME.colors.textSecondary,
    marginBottom: 10,
  },
  backBtn: {
    padding: 10,
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.radius.md,
  },
  backBtnText: {
    color: '#FFF',
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  yearPill: {
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
  },
  yearPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: THEME.spacing.md,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...THEME.shadows.sm,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 10,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: THEME.radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scheduleBlock: {
    flex: 1,
  },
  scheduleBlockLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: THEME.colors.textMuted,
  },
  scheduleBlockVal: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  metaLabel: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  metaVal: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  totalBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  checklistNote: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginBottom: 10,
  },
  checklistWrap: {
    gap: 6,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checklistItemChecked: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  checkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkItemName: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginLeft: 8,
  },
  checkItemNameChecked: {
    color: '#065F46',
    fontWeight: '700',
  },
  checkItemCount: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  instructionsBox: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  instructionsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  instructionsText: {
    fontSize: 11,
    color: '#78350F',
    marginTop: 2,
  },
  counterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  counterChip: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  counterChipActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  counterChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  counterChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  opsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  opBtn: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: THEME.radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  opBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  opBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginLeft: 6,
  },
});

export default RequestDetailScreen;
