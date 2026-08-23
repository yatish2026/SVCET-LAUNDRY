import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../constants/theme';
import { useLaundry } from '../../context/LaundryContext';
import ImagePreviewModal from '../../components/ImagePreviewModal';

export const ApprovalsScreen = ({ onSelectBooking }) => {
  const {
    bookings,
    advanceBookingStatus,
    refreshData,
  } = useLaundry();

  const [refreshing, setRefreshing] = useState(false);
  const [previewPhotoUri, setPreviewPhotoUri] = useState(null);
  const [processingAll, setProcessingAll] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  // Filter only pending approval bookings
  const pendingBookings = bookings.filter(
    (b) => b.status === 'pending_approval' || b.status === 'dropoff_scheduled'
  );

  const handleApprove = async (bookingId, studentName) => {
    try {
      await advanceBookingStatus(bookingId, 'in_wash');
    } catch (e) {
      console.error('Approve error:', e);
    }
  };

  const handleReject = async (bookingId, studentName) => {
    try {
      await advanceBookingStatus(bookingId, 'cancelled');
    } catch (e) {
      console.error('Reject error:', e);
    }
  };

  const handleAcceptAll = async () => {
    if (pendingBookings.length === 0 || processingAll) return;

    try {
      setProcessingAll(true);
      // Approve all in parallel on single click
      await Promise.all(
        pendingBookings.map((b) => advanceBookingStatus(b.id, 'in_wash'))
      );
    } catch (e) {
      console.error('Bulk approve error:', e);
    } finally {
      setProcessingAll(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Banner with Accept All Requests */}
      <View style={styles.topBanner}>
        <View style={styles.bannerInfo}>
          <Text style={styles.bannerTitle}>Pending Approvals</Text>
          <Text style={styles.bannerSub}>
            {pendingBookings.length} {pendingBookings.length === 1 ? 'request' : 'requests'} awaiting review
          </Text>
        </View>

        {pendingBookings.length > 0 && (
          <TouchableOpacity
            style={styles.acceptAllBtn}
            onPress={handleAcceptAll}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-done" size={16} color="#FFF" />
            <Text style={styles.acceptAllBtnText}>Accept All ({pendingBookings.length})</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.listArea}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {pendingBookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="checkmark-circle-outline" size={42} color="#059669" />
            </View>
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptySub}>
              There are no pending student laundry requests to approve right now.
            </Text>
          </View>
        ) : (
          pendingBookings.map((b) => {
            const rawPhotos = b.photos || [];
            const photosList = Array.isArray(rawPhotos)
              ? rawPhotos
              : typeof rawPhotos === 'string'
              ? JSON.parse(rawPhotos || '[]')
              : [];

            const itemsObj = typeof b.items === 'object' ? b.items : {};
            const itemsEntries = Object.entries(itemsObj || {});

            return (
              <View key={b.id} style={styles.approvalCard}>
                {/* Header Row */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.studentName}>{b.student_name}</Text>
                      <View style={styles.yearTag}>
                        <Text style={styles.yearTagText}>{b.academic_year || '1st Year'}</Text>
                      </View>
                    </View>
                    <Text style={styles.studentMeta}>
                      ID: {b.student_id || 'N/A'} • {b.hostel_block?.split(' ')[0]} (Rm {b.room_number})
                    </Text>
                  </View>

                  <View style={styles.tokenPill}>
                    <Text style={styles.tokenPillText}>#{b.pickup_token}</Text>
                  </View>
                </View>

                {/* Clothes Count & Summary */}
                <View style={styles.clothesSummaryRow}>
                  <View style={styles.clothesCountBox}>
                    <Text style={styles.clothesCountNum}>{b.total_items}</Text>
                    <Text style={styles.clothesCountLabel}>Total Clothes</Text>
                  </View>

                  <View style={styles.itemsPillsWrap}>
                    {itemsEntries.map(([k, v]) => (
                      <View key={k} style={styles.itemMiniPill}>
                        <Text style={styles.itemMiniPillText}>
                          {k.replace(/_/g, ' ')}: <Text style={{ fontWeight: '800' }}>{v}</Text>
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* 📸 Attached Photos Gallery Section */}
                <View style={styles.photosSection}>
                  <Text style={styles.photosSectionTitle}>
                    📸 Attached Clothes Photos ({photosList.length})
                  </Text>

                  {photosList.length === 0 ? (
                    <Text style={styles.noPhotosText}>No photos uploaded</Text>
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.photosScroll}
                    >
                      {photosList.map((photoUri, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.photoThumbWrap}
                          onPress={() => setPreviewPhotoUri(photoUri)}
                          activeOpacity={0.8}
                        >
                          <Image source={{ uri: photoUri }} style={styles.photoThumb} />
                          <View style={styles.zoomBadge}>
                            <Ionicons name="search" size={10} color="#FFF" />
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* Action Buttons: Accept & Reject */}
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleReject(b.id, b.student_name)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close-circle-outline" size={16} color="#E11D48" />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleApprove(b.id, b.student_name)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#FFF" />
                    <Text style={styles.acceptBtnText}>Accept & Approve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Image Zoom Preview Modal */}
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
    backgroundColor: '#F8FAFC',
  },
  topBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  bannerInfo: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  bannerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  acceptAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
    ...THEME.shadows.sm,
  },
  acceptAllBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  listArea: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 50,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 24,
    ...THEME.shadows.sm,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  approvalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...THEME.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  yearTag: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  yearTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  studentMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  tokenPill: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  tokenPillText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1E40AF',
  },
  clothesSummaryRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  clothesCountBox: {
    alignItems: 'center',
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  clothesCountNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1D4ED8',
  },
  clothesCountLabel: {
    fontSize: 8,
    color: '#64748B',
    fontWeight: '600',
  },
  itemsPillsWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  itemMiniPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemMiniPillText: {
    fontSize: 9,
    color: '#334155',
    textTransform: 'capitalize',
  },
  photosSection: {
    marginBottom: 12,
  },
  photosSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 6,
  },
  noPhotosText: {
    fontSize: 10,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  photosScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  photoThumbWrap: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  zoomBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F2',
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FECDD3',
    gap: 4,
  },
  rejectBtnText: {
    color: '#E11D48',
    fontSize: 12,
    fontWeight: '800',
  },
  acceptBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
    ...THEME.shadows.sm,
  },
  acceptBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
});

export default ApprovalsScreen;
