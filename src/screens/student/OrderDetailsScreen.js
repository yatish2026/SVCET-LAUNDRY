import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../constants/theme';
import { useLaundry } from '../../context/LaundryContext';
import { CLOTHES_CATEGORIES } from '../../constants/categories';
import StatusBadge from '../../components/StatusBadge';
import StepTracker from '../../components/StepTracker';
import PickupTokenModal from '../../components/PickupTokenModal';
import QRCodeDisplay from '../../components/QRCodeDisplay';

export const OrderDetailsScreen = ({ bookingId, onBack }) => {
  const { bookings, cancelBooking } = useLaundry();
  const [tokenModalVisible, setTokenModalVisible] = useState(false);
  const [previewPhotoUri, setPreviewPhotoUri] = useState(null);

  const booking = bookings.find((b) => b.id === bookingId);

  if (!booking) {
    return (
      <View style={styles.notFoundContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={THEME.colors.textMuted} />
        <Text style={styles.notFoundText}>Booking not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Find human-readable names for item IDs in items object
  const getItemName = (itemId) => {
    for (const cat of CLOTHES_CATEGORIES) {
      const match = cat.items.find((i) => i.id === itemId);
      if (match) return match.name;
    }
    return itemId.replace('_', ' ');
  };

  const canCancel =
    booking.status === 'pending_approval' || booking.status === 'dropoff_scheduled';

  const handleCancel = () => {
    const executeCancel = async () => {
      try {
        await cancelBooking(booking.id);
        if (Platform.OS === 'web') {
          window.alert('Your laundry booking request has been cancelled.');
        } else {
          Alert.alert('Request Cancelled', 'Your laundry booking request has been cancelled.');
        }
        if (onBack) onBack();
      } catch (err) {
        console.error('Cancel booking error:', err);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to cancel this laundry booking request?')) {
        executeCancel();
      }
    } else {
      Alert.alert(
        'Cancel Laundry Request?',
        'Are you sure you want to cancel this laundry booking request?',
        [
          { text: 'No, Keep It', style: 'cancel' },
          {
            text: 'Yes, Cancel',
            style: 'destructive',
            onPress: executeCancel,
          },
        ]
      );
    }
  };

  const isReady = booking.status === 'ready_for_pickup';

  const qrPayload = {
    token: booking.pickup_token,
    booking_id: booking.id,
    student_name: booking.student_name,
    student_id: booking.student_id,
    phone_number: booking.phone_number,
    total_items: booking.total_items,
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.headerTitle}>Order #{booking.pickup_token || booking.id.slice(-6)}</Text>
            {booking.academic_year && (
              <View style={styles.yearHeaderBadge}>
                <Text style={styles.yearHeaderBadgeText}>{booking.academic_year}</Text>
              </View>
            )}
          </View>
          <Text style={styles.headerSub}>
            Created on {new Date(booking.created_at).toLocaleDateString()}
          </Text>
        </View>
        <StatusBadge status={booking.status} size="sm" />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 🎫 Live Digital QR Pass Card */}
        <View style={styles.qrPassCard}>
          <View style={styles.qrPassHeader}>
            <View style={styles.qrPassIconWrap}>
              <Ionicons name="qr-code" size={20} color="#4338CA" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.qrPassTitle}>Digital Pickup QR Pass</Text>
              <Text style={styles.qrPassSub}>Scan at counter for clothes handover</Text>
            </View>
          </View>

          <QRCodeDisplay
            value={qrPayload}
            size={150}
            token={booking.pickup_token}
            studentName={booking.student_name}
            showTokenLabel={true}
          />
        </View>
        {/* Ready for Pickup Card Callout */}
        {isReady && (
          <View style={styles.readyCard}>
            <View style={styles.readyCardTop}>
              <Ionicons name="gift" size={24} color="#FFF" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.readyCardTitle}>Your Clean Clothes are Ready!</Text>
                <Text style={styles.readyCardSub}>
                  Collect from {booking.counter_number || 'Counter 1'}.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.readyCardBtn}
              onPress={() => setTokenModalVisible(true)}
            >
              <Ionicons name="qr-code-outline" size={18} color={THEME.colors.secondary} />
              <Text style={styles.readyCardBtnText}>Show Pickup Token</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Order Status & Schedule Summary */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={styles.cardTitle}>Wash Schedule</Text>
            <StatusBadge status={booking.status} size="sm" />
          </View>

          <View style={styles.scheduleRowGrid}>
            <View style={styles.scheduleCol}>
              <Text style={styles.scheduleColLabel}>DROP-OFF</Text>
              <Text style={styles.scheduleColVal}>{booking.dropoff_slot_time?.split('(')[0]}</Text>
            </View>
            <View style={styles.scheduleDivider} />
            <View style={styles.scheduleCol}>
              <Text style={[styles.scheduleColLabel, { color: '#059669' }]}>PICKUP (+2 DAYS)</Text>
              <Text style={[styles.scheduleColVal, { color: '#059669' }]}>
                {booking.pickup_slot_time?.split('(')[0]}
              </Text>
            </View>
          </View>
        </View>

        {/* Slot & Location Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Drop-off & Pickup Schedule</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="calendar-outline" size={18} color={THEME.colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Drop-Off Time Slot</Text>
              <Text style={styles.infoValue}>{booking.dropoff_slot_time || 'To be assigned'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="location-outline" size={18} color={THEME.colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Laundry Desk & Counter</Text>
              <Text style={styles.infoValue}>{booking.counter_number || 'Central Desk - Counter 1'}</Text>
            </View>
          </View>

          {booking.pickup_slot_time && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <Ionicons name="time-outline" size={18} color={THEME.colors.secondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Pickup Window</Text>
                <Text style={[styles.infoValue, { color: THEME.colors.secondary, fontWeight: '700' }]}>
                  {booking.pickup_slot_time}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Itemized Clothes Breakdown */}
        <View style={styles.card}>
          <View style={styles.breakdownHeader}>
            <Text style={styles.cardTitle}>Item Breakdown</Text>
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>{booking.total_items} Total Items</Text>
            </View>
          </View>

          <View style={styles.itemsGrid}>
            {Object.entries(booking.items || {}).map(([itemId, count]) => (
              <View key={itemId} style={styles.itemRow}>
                <View style={styles.itemRowLeft}>
                  <View style={styles.itemDot} />
                  <Text style={styles.itemName}>{getItemName(itemId)}</Text>
                </View>
                <Text style={styles.itemCountBadge}>x{count}</Text>
              </View>
            ))}
          </View>

          {booking.special_instructions ? (
            <View style={styles.instructionsBox}>
              <Text style={styles.instructionsLabel}>Special Instructions:</Text>
              <Text style={styles.instructionsText}>{booking.special_instructions}</Text>
            </View>
          ) : null}
        </View>

        {/* 📸 Uploaded Clothes Photos Verification Card */}
        <View style={styles.card}>
          <View style={styles.breakdownHeader}>
            <Text style={styles.cardTitle}>Uploaded Clothes Photos</Text>
            {(() => {
              const rawPhotos = booking.photos || [];
              const photosList = Array.isArray(rawPhotos)
                ? rawPhotos
                : typeof rawPhotos === 'string'
                ? JSON.parse(rawPhotos || '[]')
                : [];
              return (
                <View style={styles.totalBadge}>
                  <Text style={styles.totalBadgeText}>
                    {photosList.length} {photosList.length === 1 ? 'Photo' : 'Photos'}
                  </Text>
                </View>
              );
            })()}
          </View>

          {(() => {
            const rawPhotos = booking.photos || [];
            const photosList = Array.isArray(rawPhotos)
              ? rawPhotos
              : typeof rawPhotos === 'string'
              ? JSON.parse(rawPhotos || '[]')
              : [];

            if (photosList.length === 0) {
              return (
                <View style={styles.noPhotosBox}>
                  <Ionicons name="images-outline" size={24} color="#94A3B8" />
                  <Text style={styles.noPhotosText}>No photos attached with this request.</Text>
                </View>
              );
            }

            return (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photosScrollContainer}
              >
                {photosList.map((photoUri, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.photoThumbWrap}
                    onPress={() => setPreviewPhotoUri(photoUri)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: photoUri }} style={styles.photoThumb} resizeMode="cover" />
                    <View style={styles.photoIndexBadge}>
                      <Text style={styles.photoIndexText}>#{idx + 1}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            );
          })()}
        </View>

        {/* Student Identification */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Student Identification</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Name:</Text>
            <Text style={styles.metaVal}>{booking.student_name}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Hostel & Room:</Text>
            <Text style={styles.metaVal}>
              {booking.hostel_block} • Rm {booking.room_number}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Phone:</Text>
            <Text style={styles.metaVal}>{booking.phone_number}</Text>
          </View>
        </View>

        {/* Actions: Show Token or Cancel */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.tokenActionBtn}
            onPress={() => setTokenModalVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="qr-code-outline" size={20} color="#FFF" />
            <Text style={styles.tokenActionBtnText}>View Digital Pickup Token</Text>
          </TouchableOpacity>

          {canCancel && (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={16} color={THEME.colors.accent} />
              <Text style={styles.cancelBtnText}>Cancel Laundry Request</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <PickupTokenModal
        visible={tokenModalVisible}
        booking={booking}
        onClose={() => setTokenModalVisible(false)}
      />

      {/* 🖼️ Full-Screen Photo Zoom Modal */}
      <Modal
        visible={!!previewPhotoUri}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewPhotoUri(null)}
      >
        <View style={styles.photoModalOverlay}>
          <View style={styles.photoModalCard}>
            <View style={styles.photoModalHeader}>
              <Text style={styles.photoModalTitle}>Clothes Photo Preview</Text>
              <TouchableOpacity
                style={styles.photoModalCloseBtn}
                onPress={() => setPreviewPhotoUri(null)}
              >
                <Ionicons name="close" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>
            {previewPhotoUri && (
              <Image
                source={{ uri: previewPhotoUri }}
                style={styles.photoModalImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
  },
  yearHeaderBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  yearHeaderBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  headerTitle: {
    fontSize: THEME.typography.sizes.md,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  headerSub: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: THEME.spacing.lg,
    paddingBottom: 40,
  },
  qrPassCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    ...THEME.shadows.md,
  },
  qrPassHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  qrPassIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPassTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  qrPassSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  readyCard: {
    backgroundColor: THEME.colors.secondary,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    ...THEME.shadows.md,
  },
  readyCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readyCardTitle: {
    fontSize: THEME.typography.sizes.md,
    fontWeight: '800',
    color: '#FFF',
  },
  readyCardSub: {
    fontSize: 12,
    color: '#CCFBF1',
    marginTop: 2,
  },
  readyCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: THEME.radius.md,
    paddingVertical: 10,
    marginTop: 12,
  },
  readyCardBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.secondary,
    marginLeft: 6,
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.sm,
  },
  cardTitle: {
    fontSize: THEME.typography.sizes.sm,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  scheduleRowGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scheduleCol: {
    flex: 1,
  },
  scheduleColLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  scheduleColVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1D4ED8',
    marginTop: 2,
  },
  scheduleDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  statusDescriptionBox: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surfaceSubtle,
    padding: THEME.spacing.md,
    borderRadius: THEME.radius.md,
    marginTop: 6,
  },
  statusDescriptionText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.divider,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 1,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalBadge: {
    backgroundColor: THEME.colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radius.sm,
  },
  totalBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.primaryDark,
  },
  itemsGrid: {
    marginTop: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.divider,
  },
  itemRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.primary,
    marginRight: 8,
  },
  itemName: {
    fontSize: 13,
    color: THEME.colors.textPrimary,
    fontWeight: '500',
  },
  itemCountBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.primaryDark,
  },
  instructionsBox: {
    backgroundColor: THEME.colors.surfaceSubtle,
    padding: THEME.spacing.md,
    borderRadius: THEME.radius.md,
    marginTop: 10,
  },
  instructionsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  instructionsText: {
    fontSize: 12,
    color: THEME.colors.textPrimary,
    marginTop: 2,
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  metaLabel: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  actionsContainer: {
    marginTop: 8,
  },
  tokenActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.primary,
    paddingVertical: 14,
    borderRadius: THEME.radius.lg,
    marginBottom: 10,
    ...THEME.shadows.md,
  },
  tokenActionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 8,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.accentSoft,
  },
  cancelBtnText: {
    color: THEME.colors.accent,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginVertical: 12,
  },
  backBtn: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: THEME.radius.md,
  },
  backBtnText: {
    color: '#FFF',
    fontWeight: '700',
  },
  photosScrollContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
  },
  photoThumbWrap: {
    width: 90,
    height: 90,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  photoIndexBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  photoIndexText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  noPhotosBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  noPhotosText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  photoModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    overflow: 'hidden',
    padding: 16,
  },
  photoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  photoModalTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  photoModalCloseBtn: {
    padding: 4,
  },
  photoModalImage: {
    width: '100%',
    height: 380,
    borderRadius: 16,
    backgroundColor: '#0F172A',
  },
});

export default OrderDetailsScreen;
