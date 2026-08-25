import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../constants/theme';
import { useLaundry } from '../../context/LaundryContext';
import { ACADEMIC_COURSES } from '../../constants/schedule';
import StatusBadge from '../../components/StatusBadge';
import QRScannerModal from '../../components/QRScannerModal';

export const ORDER_FILTER_SECTIONS = [
  { id: 'STATUS', label: 'Order Status', icon: 'sync' },
  { id: 'COURSE', label: 'Course & Year', icon: 'school' },
  { id: 'HOSTEL', label: 'Hostel & Gender', icon: 'home' },
];

export const ORDER_STATUS_OPTIONS = [
  { id: 'ALL', label: 'All Orders (Full Lifecycle)' },
  { id: 'pending_approval', label: 'Pending Intake Approval' },
  { id: 'in_wash', label: 'In Washing Machine' },
  { id: 'drying_ironing', label: 'Drying & Steam Press' },
  { id: 'ready_for_pickup', label: 'Ready at Delivery Counter' },
  { id: 'completed', label: 'Delivered / Completed' },
  { id: 'cancelled', label: 'Cancelled / Declined' },
];

export const StudentSubmissionsScreen = ({ onSelectBooking }) => {
  const {
    bookings,
    advanceBookingStatus,
    refreshData,
  } = useLaundry();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedYearFilter, setSelectedYearFilter] = useState('ALL');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState('ALL');
  const [showFilterPickerModal, setShowFilterPickerModal] = useState(false);
  const [activeFilterSection, setActiveFilterSection] = useState('STATUS');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [previewPhotoUri, setPreviewPhotoUri] = useState(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let cnt = 0;
    if (selectedStatusFilter !== 'ALL') cnt++;
    if (selectedYearFilter !== 'ALL') cnt++;
    if (selectedGenderFilter !== 'ALL') cnt++;
    return cnt;
  }, [selectedStatusFilter, selectedYearFilter, selectedGenderFilter]);

  const handleResetFilters = () => {
    setSelectedStatusFilter('ALL');
    setSelectedYearFilter('ALL');
    setSelectedGenderFilter('ALL');
    setSearchQuery('');
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        b.student_name?.toLowerCase().includes(q) ||
        b.pickup_token?.toLowerCase().includes(q) ||
        b.student_id?.toLowerCase().includes(q) ||
        b.room_number?.toLowerCase().includes(q) ||
        b.academic_year?.toLowerCase().includes(q) ||
        b.hostel_block?.toLowerCase().includes(q);

      // 2. Status filter
      const matchesStatus =
        selectedStatusFilter === 'ALL' || b.status === selectedStatusFilter;

      // 3. Year filter
      let matchesYear = true;
      if (selectedYearFilter !== 'ALL') {
        const bYr = (b.academic_year || '').toLowerCase();
        const selYr = selectedYearFilter.toLowerCase();
        matchesYear = bYr.includes(selYr) || selYr.includes(bYr);
      }

      // 4. Gender filter
      let matchesGender = true;
      if (selectedGenderFilter !== 'ALL') {
        const isGirl =
          b.gender === 'female' ||
          (b.hostel_block &&
            (b.hostel_block.toLowerCase().includes('girl') ||
              b.hostel_block.toLowerCase().includes('women') ||
              b.hostel_block.toLowerCase().includes('kaveri')));
        if (selectedGenderFilter === 'female' && !isGirl) matchesGender = false;
        if (selectedGenderFilter === 'male' && isGirl) matchesGender = false;
      }

      return matchesQuery && matchesStatus && matchesYear && matchesGender;
    });
  }, [bookings, searchQuery, selectedStatusFilter, selectedYearFilter, selectedGenderFilter]);

  const getNextStageLabel = (status) => {
    switch (status) {
      case 'dropoff_scheduled':
      case 'pending_approval':
        return { label: 'Start Washing', next: 'in_wash', icon: 'water-outline', color: '#1D4ED8' };
      case 'in_wash':
        return { label: 'Move to Dryer', next: 'drying_ironing', icon: 'sync-outline', color: '#7C3AED' };
      case 'drying_ironing':
        return { label: 'Mark Ready & Notify', next: 'ready_for_pickup', icon: 'checkmark-done-circle-outline', color: '#059669' };
      case 'ready_for_pickup':
        return { label: 'Mark Delivered', next: 'completed', icon: 'gift-outline', color: '#475569' };
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* 🔍 Search Bar & Filter Header */}
      <View style={styles.headerArea}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search student, #LND, room..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ marginRight: 6 }}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}

            {/* Quick Scan QR Trigger Button */}
            <TouchableOpacity
              style={styles.headerScanBtn}
              onPress={() => setShowQRScanner(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="qr-code" size={15} color="#FFF" />
              <Text style={styles.headerScanBtnText}>Scan</Text>
            </TouchableOpacity>
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
              color={activeFiltersCount > 0 ? '#FFF' : '#4338CA'}
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

        {/* Active Filters Summary Bar */}
        {activeFiltersCount > 0 || searchQuery ? (
          <View style={styles.activeFiltersBar}>
            <View style={styles.activeFilterPill}>
              <Text style={styles.activeFilterPillText} numberOfLines={1}>
                Filtered: {selectedStatusFilter !== 'ALL' ? selectedStatusFilter : 'All Orders'}
                {selectedYearFilter !== 'ALL' ? ` • ${selectedYearFilter}` : ''}
                {selectedGenderFilter !== 'ALL' ? ` • ${selectedGenderFilter === 'female' ? 'Girls' : 'Boys'}` : ''}
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

      {/* Orders List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.listStatsHeader}>
          <Text style={styles.listStatsCount}>
            Showing {filteredBookings.length} of {bookings.length} Orders
          </Text>
          <Text style={styles.listStatsHint}>Tap an order to advance wash stage</Text>
        </View>

        {filteredBookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="shirt-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptySub}>
              {searchQuery || activeFiltersCount > 0
                ? 'No student laundry submissions match your filter settings.'
                : 'No student laundry submissions recorded yet.'}
            </Text>
            {activeFiltersCount > 0 && (
              <TouchableOpacity
                style={styles.emptyResetBtn}
                onPress={handleResetFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyResetBtnText}>Reset All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredBookings.map((b) => {
            const nextAction = getNextStageLabel(b.status);
            const itemsList = Object.entries(b.items || {})
              .map(([k, v]) => `${k}: ${v}`)
              .join(' • ');

            return (
              <TouchableOpacity
                key={b.id}
                style={styles.orderCard}
                onPress={() => onSelectBooking && onSelectBooking(b)}
                activeOpacity={0.85}
              >
                {/* Header: Token, Student Info & Status Badge */}
                <View style={styles.orderCardHeader}>
                  <View style={styles.tokenPill}>
                    <Text style={styles.tokenText}>#{b.pickup_token}</Text>
                  </View>

                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.studentName} numberOfLines={1}>
                      {b.student_name}
                    </Text>
                    <Text style={styles.studentMeta}>
                      {b.student_id} • {b.academic_year || '1st Year'}
                    </Text>
                  </View>

                  <StatusBadge status={b.status} />
                </View>

                {/* Meta details */}
                <View style={styles.cardDetailsRow}>
                  <View style={styles.detailItem}>
                    <Ionicons name="business-outline" size={13} color="#64748B" />
                    <Text style={styles.detailText}>
                      {b.hostel_block || 'Hostel'} Rm {b.room_number || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="shirt-outline" size={13} color="#4338CA" />
                    <Text style={[styles.detailText, { fontWeight: '800', color: '#4338CA' }]}>
                      {b.total_items || 1} Clothes
                    </Text>
                  </View>
                </View>

                {/* Items preview */}
                <View style={styles.itemsBox}>
                  <Text style={styles.itemsText} numberOfLines={2}>
                    {itemsList || 'Regular wash load'}
                  </Text>
                </View>

                {/* Special Instructions Note */}
                {b.special_instructions ? (
                  <View style={styles.instructionsBox}>
                    <Text style={styles.instructionsText}>
                      💬 {b.special_instructions}
                    </Text>
                  </View>
                ) : null}

                {/* Next Stage Action Button */}
                {nextAction && (
                  <TouchableOpacity
                    style={[styles.nextStageBtn, { backgroundColor: nextAction.color }]}
                    onPress={async () => {
                      try {
                        await advanceBookingStatus(b.id, nextAction.next);
                      } catch (e) {
                        console.error('Advance error:', e);
                      }
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name={nextAction.icon} size={15} color="#FFF" />
                    <Text style={styles.nextStageBtnText}>{nextAction.label}</Text>
                  </TouchableOpacity>
                )}
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
                <Ionicons name="options" size={20} color="#4338CA" />
                <Text style={styles.filterModalTitle}>Filter Laundry Orders</Text>
              </View>
              <TouchableOpacity onPress={() => setShowFilterPickerModal(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* 🧭 Top Segmented Category Switcher Header */}
            <View style={styles.categorySwitcherBar}>
              {ORDER_FILTER_SECTIONS.map((sec) => {
                const isSecActive = activeFilterSection === sec.id;
                const hasSelection =
                  (sec.id === 'STATUS' && selectedStatusFilter !== 'ALL') ||
                  (sec.id === 'COURSE' && selectedYearFilter !== 'ALL') ||
                  (sec.id === 'HOSTEL' && selectedGenderFilter !== 'ALL');

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
                      color={isSecActive ? '#4338CA' : '#64748B'}
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
              {/* Category 1: Order Status */}
              {activeFilterSection === 'STATUS' && (
                <View style={styles.filterOptionsGrid}>
                  {ORDER_STATUS_OPTIONS.map((st) => {
                    const isSelected = selectedStatusFilter === st.id;
                    const count = st.id === 'ALL'
                      ? bookings.length
                      : bookings.filter((b) => b.status === st.id).length;

                    return (
                      <TouchableOpacity
                        key={st.id}
                        style={[
                          styles.filterOptionItem,
                          isSelected && styles.filterOptionItemSelected,
                        ]}
                        onPress={() => setSelectedStatusFilter(st.id)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.filterOptionText,
                            isSelected && styles.filterOptionTextSelected,
                          ]}
                        >
                          {st.label}
                        </Text>
                        <View
                          style={[
                            styles.countBadgePill,
                            isSelected && { backgroundColor: '#4338CA' },
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

              {/* Category 2: Course & Year */}
              {activeFilterSection === 'COURSE' && (
                <View style={styles.filterOptionsGrid}>
                  {['ALL', ...ACADEMIC_COURSES].map((yr) => {
                    const isSelected = selectedYearFilter === yr;
                    const count = yr === 'ALL'
                      ? bookings.length
                      : bookings.filter((b) => (b.academic_year || '').toLowerCase().includes(yr.toLowerCase())).length;

                    return (
                      <TouchableOpacity
                        key={yr}
                        style={[
                          styles.filterOptionItem,
                          isSelected && styles.filterOptionItemSelected,
                        ]}
                        onPress={() => setSelectedYearFilter(yr)}
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
                            isSelected && { backgroundColor: '#4338CA' },
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

              {/* Category 3: Hostel & Gender */}
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
                        selectedGenderFilter === g.id && styles.filterOptionItemSelected,
                      ]}
                      onPress={() => setSelectedGenderFilter(g.id)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          selectedGenderFilter === g.id && styles.filterOptionTextSelected,
                        ]}
                      >
                        {g.label}
                      </Text>
                      {selectedGenderFilter === g.id ? (
                        <Ionicons name="checkmark-circle" size={18} color="#4338CA" />
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
                  Apply Filters ({filteredBookings.length} Results)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* QR Scanner Modal */}
      <QRScannerModal
        visible={showQRScanner}
        onClose={() => setShowQRScanner(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerArea: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
  headerScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4338CA',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  headerScanBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
  },
  filterButtonActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  filterButtonText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#4338CA',
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
    color: '#4338CA',
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
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 110,
  },
  listStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  listStatsCount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  listStatsHint: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '600',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  orderCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenPill: {
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
    color: '#4338CA',
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
  cardDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  itemsBox: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemsText: {
    fontSize: 11,
    color: '#64748B',
  },
  instructionsBox: {
    backgroundColor: '#FFFBEB',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  instructionsText: {
    fontSize: 10.5,
    color: '#B45309',
    fontWeight: '600',
  },
  nextStageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 2,
  },
  nextStageBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
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
    color: '#4338CA',
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
    borderBottomColor: '#4338CA',
    backgroundColor: '#FFFFFF',
  },
  categorySwitcherText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  categorySwitcherTextActive: {
    color: '#4338CA',
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
    backgroundColor: '#EEF2FF',
    borderColor: '#4338CA',
  },
  filterOptionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  filterOptionTextSelected: {
    color: '#4338CA',
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
    backgroundColor: '#4338CA',
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

export default StudentSubmissionsScreen;
