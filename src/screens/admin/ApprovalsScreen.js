import React, { useState, useMemo } from 'react';
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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../constants/theme';
import { useLaundry } from '../../context/LaundryContext';
import { ACADEMIC_COURSES } from '../../constants/schedule';
import ImagePreviewModal from '../../components/ImagePreviewModal';

export const APPROVAL_FILTER_SECTIONS = [
  { id: 'COURSE', label: 'Course & Year', icon: 'school' },
  { id: 'HOSTEL', label: 'Hostel & Gender', icon: 'home' },
  { id: 'VOLUME', label: 'Clothes Volume', icon: 'shirt' },
];

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
  const [selectedGender, setSelectedGender] = useState('ALL'); // 'ALL' | 'male' | 'female'
  const [selectedVolume, setSelectedVolume] = useState('ALL'); // 'ALL' | 'STANDARD' | 'HEAVY'
  const [showFilterPickerModal, setShowFilterPickerModal] = useState(false);
  const [activeFilterSection, setActiveFilterSection] = useState('COURSE');

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  // Filter only pending approval bookings
  const pendingBookings = useMemo(() => {
    return bookings.filter(
      (b) => b.status === 'pending_approval' || b.status === 'dropoff_scheduled'
    );
  }, [bookings]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let cnt = 0;
    if (selectedYear !== 'ALL') cnt++;
    if (selectedGender !== 'ALL') cnt++;
    if (selectedVolume !== 'ALL') cnt++;
    return cnt;
  }, [selectedYear, selectedGender, selectedVolume]);

  const handleResetFilters = () => {
    setSelectedYear('ALL');
    setSelectedGender('ALL');
    setSelectedVolume('ALL');
    setSearchQuery('');
  };

  // Apply search query and multi-facet filters
  const filteredApprovals = useMemo(() => {
    return pendingBookings.filter((b) => {
      // 1. Year Filter
      if (selectedYear !== 'ALL') {
        const bYr = (b.academic_year || '').toLowerCase();
        const selYr = selectedYear.toLowerCase();
        if (!bYr.includes(selYr) && !selYr.includes(bYr)) return false;
      }

      // 2. Gender / Hostel Filter
      if (selectedGender !== 'ALL') {
        const isGirl =
          b.gender === 'female' ||
          (b.hostel_block &&
            (b.hostel_block.toLowerCase().includes('girl') ||
              b.hostel_block.toLowerCase().includes('women') ||
              b.hostel_block.toLowerCase().includes('kaveri')));
        if (selectedGender === 'female' && !isGirl) return false;
        if (selectedGender === 'male' && isGirl) return false;
      }

      // 3. Clothes Volume Filter
      if (selectedVolume === 'STANDARD' && (b.total_items || 1) > 6) return false;
      if (selectedVolume === 'HEAVY' && (b.total_items || 1) <= 6) return false;

      // 4. Search Query
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
  }, [pendingBookings, selectedYear, selectedGender, selectedVolume, searchQuery]);

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
          <Text style={styles.bannerTitle}>Pending Intake Approvals</Text>
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

      {/* 🔍 Search & Modern Filter Bar */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by student, roll no, #LND, room..."
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

          {/* ⚙️ Modern Filter Button */}
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFiltersCount > 0 && styles.filterButtonActive,
            ]}
            onPress={() => setShowFilterPickerModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={activeFiltersCount > 0 ? '#FFF' : '#2563EB'}
            />
            <Text
              style={[
                styles.filterButtonText,
                activeFiltersCount > 0 && styles.filterButtonTextActive,
              ]}
            >
              Filter
            </Text>
            {activeFiltersCount > 0 ? (
              <View style={styles.filterBadgeCircle}>
                <Text style={styles.filterBadgeCircleText}>{activeFiltersCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {/* Active Filter Chips Bar */}
        {activeFiltersCount > 0 || searchQuery ? (
          <View style={styles.activeFiltersBar}>
            <View style={styles.activeFilterPill}>
              <Text style={styles.activeFilterPillText} numberOfLines={1}>
                Filtered: {selectedYear !== 'ALL' ? selectedYear : 'All Courses'}
                {selectedGender !== 'ALL' ? ` • ${selectedGender === 'female' ? 'Girls Hostel' : 'Boys Hostel'}` : ''}
                {selectedVolume !== 'ALL' ? ` • ${selectedVolume}` : ''}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleResetFilters}
              style={styles.clearFiltersBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={14} color="#DC2626" />
              <Text style={styles.clearFiltersBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>
        ) : null}
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
                ? 'No pending laundry drop-offs match your search or filter.'
                : 'No pending student laundry drop-offs awaiting intake approval right now.'}
            </Text>
            {activeFiltersCount > 0 && (
              <TouchableOpacity
                style={styles.emptyResetBtn}
                onPress={handleResetFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyResetBtnText}>Reset Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredApprovals.map((b) => {
            const itemsList = Object.entries(b.items || {})
              .map(([k, v]) => `${k}: ${v}`)
              .join(' • ');

            return (
              <TouchableOpacity
                key={b.id}
                style={styles.requestCard}
                onPress={() => onSelectBooking && onSelectBooking(b)}
                activeOpacity={0.9}
              >
                {/* Card Top: Token & Student Info */}
                <View style={styles.cardHeader}>
                  <View style={styles.tokenBox}>
                    <Text style={styles.tokenText}>#{b.pickup_token}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.studentName}>{b.student_name}</Text>
                    <Text style={styles.studentMeta}>
                      {b.student_id} • {b.academic_year || '1st Year'}
                    </Text>
                  </View>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>Pending Intake</Text>
                  </View>
                </View>

                {/* Location & Contact Meta */}
                <View style={styles.metaRow}>
                  <View style={styles.metaCol}>
                    <Ionicons name="business-outline" size={13} color="#64748B" />
                    <Text style={styles.metaColText}>
                      {b.hostel_block || 'Hostel'} Rm {b.room_number || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Ionicons name="call-outline" size={13} color="#64748B" />
                    <Text style={styles.metaColText}>{b.phone_number || 'No Phone'}</Text>
                  </View>
                </View>

                {/* Clothes Count & Item Breakdown */}
                <View style={styles.clothesSummaryBox}>
                  <View style={styles.clothesHeaderRow}>
                    <Ionicons name="shirt-outline" size={15} color="#2563EB" />
                    <Text style={styles.clothesCountText}>
                      Total Clothes: {b.total_items || 1}
                    </Text>
                  </View>
                  <Text style={styles.itemsBreakdownText} numberOfLines={2}>
                    {itemsList || 'Regular mix clothes'}
                  </Text>
                </View>

                {/* Special Instructions Note */}
                {b.special_instructions ? (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesText}>💬 {b.special_instructions}</Text>
                  </View>
                ) : null}

                {/* Photos Thumbnail Preview */}
                {Array.isArray(b.photos) && b.photos.length > 0 && (
                  <View style={styles.photosRow}>
                    {b.photos.map((uri, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => setPreviewPhotoUri(uri)}
                        activeOpacity={0.8}
                      >
                        <Image source={{ uri }} style={styles.thumbnailImg} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Approve / Reject Buttons */}
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleReject(b.id, b.student_name)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                    <Text style={styles.rejectBtnText}>Decline</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleApprove(b.id, b.student_name)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#FFF" />
                    <Text style={styles.approveBtnText}>Accept & Wash</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* 🎛️ Filter Bottom Sheet Modal with Top Segmented Switcher */}
      <Modal
        visible={showFilterPickerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterPickerModal(false)}
      >
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalSheet}>
            {/* Modal Header */}
            <View style={styles.filterModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="options" size={20} color="#2563EB" />
                <Text style={styles.filterModalTitle}>Filter Pending Approvals</Text>
              </View>
              <TouchableOpacity onPress={() => setShowFilterPickerModal(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* 🧭 Top Segmented Category Switcher Header */}
            <View style={styles.categorySwitcherBar}>
              {APPROVAL_FILTER_SECTIONS.map((sec) => {
                const isSecActive = activeFilterSection === sec.id;
                const hasSelection =
                  (sec.id === 'COURSE' && selectedYear !== 'ALL') ||
                  (sec.id === 'HOSTEL' && selectedGender !== 'ALL') ||
                  (sec.id === 'VOLUME' && selectedVolume !== 'ALL');

                return (
                  <TouchableOpacity
                    key={sec.id}
                    style={[
                      styles.categorySwitcherTab,
                      isSecActive && styles.categorySwitcherTabActive,
                    ]}
                    onPress={() => setActiveFilterSection(sec.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={sec.icon}
                      size={14}
                      color={isSecActive ? '#2563EB' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.categorySwitcherText,
                        isSecActive && styles.categorySwitcherTextActive,
                      ]}
                    >
                      {sec.label}
                    </Text>
                    {hasSelection ? <View style={styles.tabSelectionDot} /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Options List for Active Category */}
            <ScrollView
              style={{ maxHeight: '68%' }}
              contentContainerStyle={{ padding: 18, gap: 10 }}
              showsVerticalScrollIndicator={true}
            >
              {/* Category 1: Course & Year */}
              {activeFilterSection === 'COURSE' && (
                <View style={styles.filterOptionsGrid}>
                  {['ALL', ...ACADEMIC_COURSES].map((yr) => {
                    const isSelected = selectedYear === yr;
                    const count = yr === 'ALL'
                      ? pendingBookings.length
                      : pendingBookings.filter((b) => (b.academic_year || '').toLowerCase().includes(yr.toLowerCase())).length;

                    return (
                      <TouchableOpacity
                        key={yr}
                        style={[
                          styles.filterOptionItem,
                          isSelected && styles.filterOptionItemSelected,
                        ]}
                        onPress={() => setSelectedYear(yr)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.filterOptionText,
                            isSelected && styles.filterOptionTextSelected,
                          ]}
                        >
                          {yr === 'ALL' ? 'All Academic Courses' : yr}
                        </Text>
                        <View
                          style={[
                            styles.countBadgePill,
                            isSelected && { backgroundColor: '#2563EB' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.countBadgePillText,
                              isSelected && { color: '#FFF' },
                            ]}
                          >
                            {count}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Category 2: Hostel & Gender */}
              {activeFilterSection === 'HOSTEL' && (
                <View style={styles.filterOptionsGrid}>
                  {[
                    { id: 'ALL', label: 'All Hostels & Blocks' },
                    { id: 'male', label: '👦 Boys Hostel Blocks' },
                    { id: 'female', label: '👧 Girls Hostel (Kaveri / Meenakshi)' },
                  ].map((g) => (
                    <TouchableOpacity
                      key={g.id}
                      style={[
                        styles.filterOptionItem,
                        selectedGender === g.id && styles.filterOptionItemSelected,
                      ]}
                      onPress={() => setSelectedGender(g.id)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          selectedGender === g.id && styles.filterOptionTextSelected,
                        ]}
                      >
                        {g.label}
                      </Text>
                      {selectedGender === g.id ? (
                        <Ionicons name="checkmark-circle" size={18} color="#2563EB" />
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Category 3: Volume */}
              {activeFilterSection === 'VOLUME' && (
                <View style={styles.filterOptionsGrid}>
                  {[
                    { id: 'ALL', label: 'All Bag Sizes' },
                    { id: 'STANDARD', label: '🧺 Standard Bags (1 - 6 Clothes)' },
                    { id: 'HEAVY', label: '🔥 Heavy Bags (7+ Clothes)' },
                  ].map((vol) => (
                    <TouchableOpacity
                      key={vol.id}
                      style={[
                        styles.filterOptionItem,
                        selectedVolume === vol.id && styles.filterOptionItemSelected,
                      ]}
                      onPress={() => setSelectedVolume(vol.id)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          selectedVolume === vol.id && styles.filterOptionTextSelected,
                        ]}
                      >
                        {vol.label}
                      </Text>
                      {selectedVolume === vol.id ? (
                        <Ionicons name="checkmark-circle" size={18} color="#2563EB" />
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Bottom Footer Actions */}
            <View style={styles.filterModalFooter}>
              <TouchableOpacity
                style={styles.modalResetBtn}
                onPress={handleResetFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.modalResetBtnText}>Reset All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={() => setShowFilterPickerModal(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.modalApplyBtnText}>
                  Apply Filters ({filteredApprovals.length} Results)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        visible={!!previewPhotoUri}
        photoUri={previewPhotoUri}
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  bannerInfo: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '900',
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
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
  },
  acceptAllBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  searchBarWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  clearBtn: {
    padding: 2,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  filterButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterButtonText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#2563EB',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  filterBadgeCircle: {
    backgroundColor: '#FFFFFF',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeCircleText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#2563EB',
  },
  activeFiltersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeFilterPill: {
    flex: 1,
    marginRight: 8,
  },
  activeFilterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  clearFiltersBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  listArea: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 110,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenBox: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  tokenText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#2563EB',
  },
  studentName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  studentMeta: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 14,
  },
  metaCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaColText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  clothesSummaryBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  clothesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clothesCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  itemsBreakdownText: {
    fontSize: 11,
    color: '#64748B',
  },
  notesBox: {
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  notesText: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '600',
  },
  photosRow: {
    flexDirection: 'row',
    gap: 8,
  },
  thumbnailImg: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 10,
    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
  },
  approveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  emptyResetBtn: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginTop: 14,
  },
  emptyResetBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },

  /* 🎛️ Filter Bottom Sheet Modal Styles */
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  filterModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterModalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  categorySwitcherBar: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  categorySwitcherTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
    position: 'relative',
  },
  categorySwitcherTabActive: {
    borderBottomColor: '#2563EB',
    backgroundColor: '#FFFFFF',
  },
  categorySwitcherText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  categorySwitcherTextActive: {
    color: '#2563EB',
    fontWeight: '900',
  },
  tabSelectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#15803D',
    position: 'absolute',
    top: 6,
    right: 8,
  },
  filterOptionsGrid: {
    gap: 6,
  },
  filterOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  filterOptionItemSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  filterOptionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  filterOptionTextSelected: {
    color: '#2563EB',
    fontWeight: '900',
  },
  countBadgePill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  filterModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  modalResetBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
  },
  modalResetBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  modalApplyBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});

export default ApprovalsScreen;
