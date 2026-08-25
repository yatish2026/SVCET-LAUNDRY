import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../constants/theme';
import { useLaundry } from '../../context/LaundryContext';
import { ACADEMIC_COURSES } from '../../constants/schedule';

export const REPORT_FILTER_SECTIONS = [
  { id: 'TIMEFRAME', label: 'Time Period', icon: 'calendar' },
  { id: 'COURSE', label: 'Course & Year', icon: 'school' },
  { id: 'STATUS', label: 'Order Status', icon: 'sync' },
];

export const STATUS_OPTIONS = [
  { id: 'ALL', label: 'All Statuses (Completed & Active)' },
  { id: 'completed', label: 'Completed / Delivered' },
  { id: 'ready_for_pickup', label: 'Ready for Pickup' },
  { id: 'in_wash', label: 'In Washing Machine' },
  { id: 'drying_ironing', label: 'Drying & Steam Press' },
  { id: 'pending_approval', label: 'Pending Intake' },
];

export const ReportsExportScreen = () => {
  const { bookings } = useLaundry();

  // Filter state
  const [timeframeMode, setTimeframeMode] = useState('ALL'); // 'ALL' | 'DAY' | 'MONTH'
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10)); // 'YYYY-MM-DD'
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7)); // 'YYYY-MM'
  const [selectedYear, setSelectedYear] = useState('ALL'); // 'ALL' | 'B.Tech 1st Year' ...
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showFilterPickerModal, setShowFilterPickerModal] = useState(false);
  const [activeFilterSection, setActiveFilterSection] = useState('TIMEFRAME');

  // Available months extracted from bookings
  const availableMonths = useMemo(() => {
    const set = new Set();
    const currentM = new Date().toISOString().slice(0, 7);
    set.add(currentM);
    bookings.forEach((b) => {
      if (b.created_at) {
        set.add(b.created_at.slice(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [bookings]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let cnt = 0;
    if (timeframeMode !== 'ALL') cnt++;
    if (selectedYear !== 'ALL') cnt++;
    if (selectedStatus !== 'ALL') cnt++;
    return cnt;
  }, [timeframeMode, selectedYear, selectedStatus]);

  const handleResetFilters = () => {
    setTimeframeMode('ALL');
    setSelectedYear('ALL');
    setSelectedStatus('ALL');
    setSearchQuery('');
  };

  // Filtered dataset
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const bDate = b.created_at || '';

      // 1. Timeframe Filter
      if (timeframeMode === 'DAY') {
        if (!bDate.startsWith(selectedDate)) return false;
      } else if (timeframeMode === 'MONTH') {
        if (!bDate.startsWith(selectedMonth)) return false;
      }

      // 2. Academic Year Filter
      if (selectedYear !== 'ALL') {
        const bYr = (b.academic_year || '').toLowerCase();
        const selYr = selectedYear.toLowerCase();
        if (!bYr.includes(selYr) && !selYr.includes(bYr)) return false;
      }

      // 3. Status Filter
      if (selectedStatus !== 'ALL' && b.status !== selectedStatus) {
        return false;
      }

      // 4. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = b.student_name?.toLowerCase().includes(q);
        const matchId = b.student_id?.toLowerCase().includes(q);
        const matchToken = b.pickup_token?.toLowerCase().includes(q);
        const matchPhone = b.phone_number?.includes(q);
        const matchRoom = String(b.room_number || '').toLowerCase().includes(q);
        const matchBlock = b.hostel_block?.toLowerCase().includes(q);

        return matchName || matchId || matchToken || matchPhone || matchRoom || matchBlock;
      }

      return true;
    });
  }, [bookings, timeframeMode, selectedDate, selectedMonth, selectedYear, selectedStatus, searchQuery]);

  // Summary Metrics
  const totalClothes = filteredBookings.reduce((sum, b) => sum + (b.total_items || 0), 0);
  const completedCount = filteredBookings.filter((b) => b.status === 'completed').length;
  const activeCount = filteredBookings.filter((b) => b.status !== 'completed' && b.status !== 'cancelled').length;

  const handleDownloadCSV = () => {
    try {
      if (filteredBookings.length === 0) {
        Alert.alert('No Data', 'No records match your selected report filters.');
        return;
      }

      const headers = [
        'Booking ID',
        'Token',
        'Date Created',
        'Student Name',
        'Roll No',
        'Academic Year',
        'Hostel Block',
        'Room No',
        'Phone Number',
        'Total Clothes',
        'Items Breakdown',
        'Current Status',
        'Dropoff Slot',
        'Pickup Slot',
        'Special Instructions',
      ];

      const rows = filteredBookings.map((b) => {
        const itemsList = Object.entries(b.items || {})
          .map(([k, v]) => `${k}:${v}`)
          .join('; ');

        return [
          `"${b.id || ''}"`,
          `#${b.pickup_token || ''}`,
          `"${b.created_at || ''}"`,
          `"${b.student_name || ''}"`,
          `"${b.student_id || ''}"`,
          `"${b.academic_year || ''}"`,
          `"${b.hostel_block || ''}"`,
          `"${b.room_number || ''}"`,
          `"${b.phone_number || ''}"`,
          b.total_items || 1,
          `"${itemsList}"`,
          `"${b.status || ''}"`,
          `"${b.dropoff_slot_time || ''}"`,
          `"${b.pickup_slot_time || ''}"`,
          `"${(b.special_instructions || '').replace(/"/g, '""')}"`,
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');

      let filename = `RVS_VASTRA_Master_Report_${new Date().toISOString().slice(0, 10)}.csv`;
      if (timeframeMode === 'DAY') {
        filename = `RVS_VASTRA_Daily_Report_${selectedDate}.csv`;
      } else if (timeframeMode === 'MONTH') {
        filename = `RVS_VASTRA_Monthly_Report_${selectedMonth}.csv`;
      }

      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 4000);
      } else {
        Alert.alert(
          'Export Successful',
          `Generated ${filteredBookings.length} laundry records for download (${filename}).`
        );
      }
    } catch (err) {
      Alert.alert('Export Error', 'Failed to generate CSV export file.');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Banner & Quick Download Action */}
      <View style={styles.headerCard}>
        <View style={styles.headerInfoRow}>
          <View style={styles.headerIconBox}>
            <Ionicons name="document-text" size={26} color="#059669" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>Official Laundry Reports</Text>
            <Text style={styles.headerSub}>Export daily, monthly, batch & student records</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.exportActionBtn}
          onPress={handleDownloadCSV}
          activeOpacity={0.85}
        >
          <Ionicons name="download" size={18} color="#FFF" />
          <Text style={styles.exportActionBtnText}>
            Export CSV ({filteredBookings.length} Records)
          </Text>
        </TouchableOpacity>

        {downloadSuccess && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.successBannerText}>CSV Report downloaded successfully!</Text>
          </View>
        )}
      </View>

      {/* 🔍 Search & Filter Action Bar */}
      <View style={styles.sectionCard}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by student, roll no, room..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
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
              color={activeFiltersCount > 0 ? '#FFF' : '#059669'}
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

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 || searchQuery ? (
          <View style={styles.activeFiltersBar}>
            <View style={styles.activeFilterPill}>
              <Text style={styles.activeFilterPillText} numberOfLines={1}>
                Filters: {timeframeMode !== 'ALL' ? timeframeMode : 'All Time'}
                {selectedYear !== 'ALL' ? ` • ${selectedYear}` : ''}
                {selectedStatus !== 'ALL' ? ` • ${selectedStatus}` : ''}
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

      {/* Summary Statistics Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{filteredBookings.length}</Text>
          <Text style={styles.statLabel}>Total Requests</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#4338CA' }]}>{totalClothes}</Text>
          <Text style={styles.statLabel}>Total Clothes</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#15803D' }]}>{completedCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#B45309' }]}>{activeCount}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
      </View>

      {/* Live Data Table Preview */}
      <View style={styles.sectionCard}>
        <View style={styles.previewHeaderRow}>
          <Text style={styles.sectionTitle}>
            👁️ Live Report Preview ({filteredBookings.length} Records)
          </Text>
          <TouchableOpacity
            style={styles.tableQuickExportBtn}
            onPress={handleDownloadCSV}
            activeOpacity={0.8}
          >
            <Ionicons name="download-outline" size={14} color="#059669" />
            <Text style={styles.tableQuickExportText}>Download CSV</Text>
          </TouchableOpacity>
        </View>

        {filteredBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={40} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No matching records found</Text>
            <Text style={styles.emptySub}>Adjust your filters to see data</Text>
          </View>
        ) : (
          <View style={styles.tableWrap}>
            {/* Table Header */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, { width: 60 }]}>Token</Text>
              <Text style={[styles.th, { flex: 1 }]}>Student</Text>
              <Text style={[styles.th, { width: 55, textAlign: 'center' }]}>Clothes</Text>
              <Text style={[styles.th, { width: 85, textAlign: 'right' }]}>Status</Text>
            </View>

            {/* Table Rows */}
            {filteredBookings.slice(0, 50).map((b, idx) => {
              const isCompleted = b.status === 'completed';

              return (
                <View key={b.id || idx} style={styles.tableRow}>
                  <Text style={[styles.tdToken, { width: 60 }]}>#{b.pickup_token}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tdName} numberOfLines={1}>
                      {b.student_name}
                    </Text>
                    <Text style={styles.tdMeta}>
                      {b.student_id} • {b.academic_year || '1st Year'}
                    </Text>
                  </View>
                  <Text style={[styles.tdCount, { width: 55 }]}>
                    {b.total_items || 1} pcs
                  </Text>
                  <View
                    style={[
                      styles.statusPill,
                      isCompleted ? styles.statusCompleted : styles.statusActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isCompleted ? styles.statusCompletedText : styles.statusActiveText,
                      ]}
                    >
                      {isCompleted ? 'Done' : 'Active'}
                    </Text>
                  </View>
                </View>
              );
            })}

            {filteredBookings.length > 50 && (
              <View style={styles.tableFooterHint}>
                <Text style={styles.tableFooterText}>
                  Showing first 50 of {filteredBookings.length} records. Download CSV for the complete report dataset.
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

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
                <Ionicons name="options" size={20} color="#059669" />
                <Text style={styles.filterModalTitle}>Filter Reports Data</Text>
              </View>
              <TouchableOpacity onPress={() => setShowFilterPickerModal(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* 🧭 Top Segmented Category Switcher Header */}
            <View style={styles.categorySwitcherBar}>
              {REPORT_FILTER_SECTIONS.map((sec) => {
                const isSecActive = activeFilterSection === sec.id;
                const hasSelection =
                  (sec.id === 'TIMEFRAME' && timeframeMode !== 'ALL') ||
                  (sec.id === 'COURSE' && selectedYear !== 'ALL') ||
                  (sec.id === 'STATUS' && selectedStatus !== 'ALL');

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
                      color={isSecActive ? '#059669' : '#64748B'}
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

            <ScrollView
              style={{ maxHeight: '68%' }}
              contentContainerStyle={{ padding: 18, gap: 12 }}
              showsVerticalScrollIndicator={true}
            >
              {/* Category 1: Timeframe Selection */}
              {activeFilterSection === 'TIMEFRAME' && (
                <View style={{ gap: 10 }}>
                  <View style={styles.filterOptionsGrid}>
                    {[
                      { id: 'ALL', label: 'All-Time Records' },
                      { id: 'DAY', label: 'Specific Day / Date' },
                      { id: 'MONTH', label: 'Monthly Summary' },
                    ].map((mode) => (
                      <TouchableOpacity
                        key={mode.id}
                        style={[
                          styles.filterOptionItem,
                          timeframeMode === mode.id && styles.filterOptionItemSelected,
                        ]}
                        onPress={() => setTimeframeMode(mode.id)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.filterOptionText,
                            timeframeMode === mode.id && styles.filterOptionTextSelected,
                          ]}
                        >
                          {mode.label}
                        </Text>
                        {timeframeMode === mode.id ? (
                          <Ionicons name="checkmark-circle" size={18} color="#059669" />
                        ) : null}
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Day Date input */}
                  {timeframeMode === 'DAY' && (
                    <View style={styles.dateInputBox}>
                      <Text style={styles.dateInputLabel}>Enter Date (YYYY-MM-DD):</Text>
                      <TextInput
                        style={styles.customDateInput}
                        value={selectedDate}
                        onChangeText={setSelectedDate}
                        placeholder="YYYY-MM-DD"
                      />
                    </View>
                  )}

                  {/* Month selector */}
                  {timeframeMode === 'MONTH' && (
                    <View style={{ gap: 8 }}>
                      <Text style={styles.dateInputLabel}>Choose Month:</Text>
                      <View style={styles.filterOptionsGrid}>
                        {availableMonths.map((m) => {
                          const dateObj = new Date(`${m}-01T00:00:00Z`);
                          const monthLabel = dateObj.toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric',
                            timeZone: 'UTC',
                          });
                          const isSelected = selectedMonth === m;

                          return (
                            <TouchableOpacity
                              key={m}
                              style={[
                                styles.filterOptionItem,
                                isSelected && styles.filterOptionItemSelected,
                              ]}
                              onPress={() => setSelectedMonth(m)}
                              activeOpacity={0.75}
                            >
                              <Text
                                style={[
                                  styles.filterOptionText,
                                  isSelected && styles.filterOptionTextSelected,
                                ]}
                              >
                                {monthLabel}
                              </Text>
                              {isSelected ? (
                                <Ionicons name="checkmark-circle" size={18} color="#059669" />
                              ) : null}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Category 2: Academic Course & Year */}
              {activeFilterSection === 'COURSE' && (
                <View style={styles.filterOptionsGrid}>
                  {['ALL', ...ACADEMIC_COURSES].map((yr) => {
                    const isSelected = selectedYear === yr;

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
                        {isSelected ? (
                          <Ionicons name="checkmark-circle" size={18} color="#059669" />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Category 3: Status Selection */}
              {activeFilterSection === 'STATUS' && (
                <View style={styles.filterOptionsGrid}>
                  {STATUS_OPTIONS.map((st) => {
                    const isSelected = selectedStatus === st.id;

                    return (
                      <TouchableOpacity
                        key={st.id}
                        style={[
                          styles.filterOptionItem,
                          isSelected && styles.filterOptionItemSelected,
                        ]}
                        onPress={() => setSelectedStatus(st.id)}
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
                        {isSelected ? (
                          <Ionicons name="checkmark-circle" size={18} color="#059669" />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 115,
    gap: 14,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 14,
    ...THEME.shadows.md,
  },
  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  exportActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 14,
    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.28)',
  },
  exportActionBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successBannerText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 12,
    ...THEME.shadows.sm,
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
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
  filterButtonActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  filterButtonText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#059669',
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
    color: '#059669',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  statNum: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  tableQuickExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  tableQuickExportText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  tableWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  th: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  tdToken: {
    fontSize: 11,
    fontWeight: '900',
    color: '#059669',
  },
  tdName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  tdMeta: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  tdCount: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    textAlign: 'center',
  },
  statusPill: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  statusCompleted: {
    backgroundColor: '#DCFCE7',
  },
  statusActive: {
    backgroundColor: '#FEF3C7',
  },
  statusPillText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  statusCompletedText: {
    color: '#15803D',
  },
  statusActiveText: {
    color: '#B45309',
  },
  tableFooterHint: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    alignItems: 'center',
  },
  tableFooterText: {
    fontSize: 10.5,
    color: '#64748B',
    textAlign: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 11.5,
    color: '#94A3B8',
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
    borderBottomColor: '#059669',
    backgroundColor: '#FFFFFF',
  },
  categorySwitcherText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  categorySwitcherTextActive: {
    color: '#059669',
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
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  filterOptionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  filterOptionTextSelected: {
    color: '#059669',
    fontWeight: '900',
  },
  dateInputBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  dateInputLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#334155',
  },
  customDateInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: '#0F172A',
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
    backgroundColor: '#059669',
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

export default ReportsExportScreen;
