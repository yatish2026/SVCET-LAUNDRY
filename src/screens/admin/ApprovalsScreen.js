import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../constants/theme';
import { useLaundry } from '../../context/LaundryContext';
import { ACADEMIC_YEARS } from '../../constants/schedule';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('ALL');

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  // Filter only pending approval bookings
  const pendingBookings = bookings.filter(
    (b) => b.status === 'pending_approval' || b.status === 'dropoff_scheduled'
  );

  // Apply search query and academic year filters
  const filteredApprovals = pendingBookings.filter((b) => {
    // 1. Year Filter
    if (selectedYear !== 'ALL' && b.academic_year !== selectedYear) {
      return false;
    }

    // 2. Search Query (matches name, roll ID, token, phone, block, room)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = b.student_name?.toLowerCase().includes(q);
      const matchId = b.student_id?.toLowerCase().includes(q);
      const matchToken = b.pickup_token?.toLowerCase().includes(q);
      const matchPhone = b.phone_number?.includes(q);
      const matchBlock = b.hostel_block?.toLowerCase().includes(q);
      const matchRoom = String(b.room_number || '').toLowerCase().includes(q);

      return matchName || matchId || matchToken || matchPhone || matchBlock || matchRoom;
    }

    return true;
  });

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
    const listToApprove = filteredApprovals;
    if (listToApprove.length === 0 || processingAll) return;

    try {
      setProcessingAll(true);
      await Promise.all(
        listToApprove.map((b) => advanceBookingStatus(b.id, 'in_wash'))
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
            {filteredApprovals.length} of {pendingBookings.length} {pendingBookings.length === 1 ? 'request' : 'requests'} shown
          </Text>
        </View>

        {filteredApprovals.length > 0 && (
          <TouchableOpacity
            style={styles.acceptAllBtn}
            onPress={handleAcceptAll}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-done" size={16} color="#FFF" />
            <Text style={styles.acceptAllBtnText}>Accept ({filteredApprovals.length})</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 🔍 Search Bar Component */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by student name, roll no, token (#LND), room..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Academic Year Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.yearChipsScroll}
        >
          {['ALL', ...ACADEMIC_YEARS].map((yr) => {
            const isSelected = selectedYear === yr;
            const count = yr === 'ALL'
              ? pendingBookings.length
              : pendingBookings.filter((b) => b.academic_year === yr).length;

            return (
              <TouchableOpacity
                key={yr}
                style={[styles.yearChip, isSelected && styles.yearChipActive]}
                onPress={() => setSelectedYear(yr)}
                activeOpacity={0.8}
              >
                <Text style={[styles.yearChipText, isSelected && styles.yearChipTextActive]}>
                  {yr === 'ALL' ? 'All Years' : yr} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.listArea}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredApprovals.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name={searchQuery ? 'search-outline' : 'checkmark-circle-outline'} size={42} color={searchQuery ? '#64748B' : '#059669'} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No Matching Requests' : 'All Caught Up!'}
            </Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? `No pending approvals found matching "${searchQuery}". Try clearing your search.`
                : 'There are no pending student laundry requests to approve right now.'}
            </Text>
            {searchQuery ? (
              <TouchableOpacity
                style={styles.resetSearchBtn}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedYear('ALL');
                }}
              >
                <Text style={styles.resetSearchBtnText}>Reset Search & Filters</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          filteredApprovals.map((b) => {
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
                      Roll ID: <Text style={{ fontWeight: '700', color: '#1E293B' }}>{b.student_id || 'N/A'}</Text> • {b.hostel_block?.split(' ')[0]} (Rm {b.room_number})
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
                          <Image
                            source={{ uri: photoUri }}
                            style={styles.photoThumb}
                            resizeMode="cover"
                          />
                          <View style={styles.photoIndexBadge}>
                            <Text style={styles.photoIndexBadgeText}>#{idx + 1}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* Drop-off / Scheduled Info */}
                <View style={styles.slotInfoRow}>
                  <Ionicons name="time-outline" size={14} color="#64748B" />
                  <Text style={styles.slotInfoText}>
                    Slot: {b.dropoff_slot_time || 'Regular Schedule'} • Phone: {b.phone_number || 'N/A'}
                  </Text>
                </View>

                {/* Action Buttons: Accept & Wash vs Reject */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleReject(b.id, b.student_name)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleApprove(b.id, b.student_name)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#FFF" />
                    <Text style={styles.approveBtnText}>Accept & Start Wash</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Full-Screen Image Preview Modal */}
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  bannerInfo: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  bannerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  acceptAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  acceptAllBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  searchBarWrap: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
    marginTop: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  clearBtn: {
    padding: 4,
  },
  yearChipsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 10,
  },
  yearChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  yearChipActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  yearChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  yearChipTextActive: {
    color: '#FFFFFF',
  },
  listArea: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  resetSearchBtn: {
    marginTop: 16,
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  resetSearchBtnText: {
    color: '#4338CA',
    fontSize: 12.5,
    fontWeight: '700',
  },
  approvalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  yearTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  yearTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#4338CA',
  },
  studentMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  tokenPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tokenPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  clothesSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  clothesCountBox: {
    alignItems: 'center',
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    minWidth: 70,
  },
  clothesCountNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#4338CA',
  },
  clothesCountLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  itemsPillsWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  itemMiniPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  itemMiniPillText: {
    fontSize: 11,
    color: '#334155',
  },
  photosSection: {
    marginBottom: 10,
  },
  photosSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  photosScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  photoThumbWrap: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  photoIndexBadge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  photoIndexBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
  },
  noPhotosText: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  slotInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  slotInfoText: {
    fontSize: 11.5,
    color: '#64748B',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  rejectBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4338CA',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default ApprovalsScreen;
