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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../constants/theme';
import { useLaundry } from '../../context/LaundryContext';
import { ACADEMIC_YEARS } from '../../constants/schedule';

export const ReportsExportScreen = () => {
  const { bookings } = useLaundry();

  // Filter state
  const [timeframeMode, setTimeframeMode] = useState('ALL'); // 'ALL' | 'DAY' | 'MONTH'
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10)); // 'YYYY-MM-DD'
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7)); // 'YYYY-MM'
  const [selectedYear, setSelectedYear] = useState('ALL'); // 'ALL' | '1st Year' ...
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // 'ALL' | 'completed' | 'in_wash' ...
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

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
      if (selectedYear !== 'ALL' && b.academic_year !== selectedYear) {
        return false;
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
      }

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);

      Alert.alert(
        'Report Exported! 📥',
        `Generated ${filename} with ${filteredBookings.length} records (${totalClothes} clothes total).`
      );
    } catch (e) {
      console.error('Export error:', e);
      Alert.alert('Export Error', 'Failed to generate report file.');
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'completed':
        return { bg: '#DCFCE7', text: '#15803D', label: 'Completed' };
      case 'ready_for_pickup':
        return { bg: '#FEF3C7', text: '#B45309', label: 'Ready for Pickup' };
      case 'in_wash':
        return { bg: '#DBEAFE', text: '#1E40AF', label: 'In Washing' };
      case 'drying_ironing':
        return { bg: '#F3E8FF', text: '#6B21A8', label: 'Drying & Iron' };
      case 'pending_approval':
      case 'dropoff_scheduled':
        return { bg: '#F1F5F9', text: '#475569', label: 'Pending Intake' };
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelled' };
      default:
        return { bg: '#F1F5F9', text: '#475569', label: status };
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>📊 Reports & Data Export</Text>
          <Text style={styles.headerSub}>Export day-wise, month-wise, and complete archive laundry logs</Text>
        </View>

        <TouchableOpacity
          style={[styles.downloadBtn, downloadSuccess && styles.downloadBtnSuccess]}
          onPress={handleDownloadCSV}
          activeOpacity={0.85}
        >
          <Ionicons
            name={downloadSuccess ? 'checkmark-circle' : 'download-outline'}
            size={19}
            color="#FFF"
          />
          <Text style={styles.downloadBtnText}>
            {downloadSuccess ? 'Report Exported Successfully!' : 'Download CSV Report'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 1. Timeframe Selection Bar */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>📅 1. Select Report Timeframe</Text>
        <View style={styles.timeframeTabs}>
          {[
            { id: 'ALL', label: 'Complete Archive', icon: 'albums-outline' },
            { id: 'DAY', label: 'Day-Wise', icon: 'today-outline' },
            { id: 'MONTH', label: 'Month-Wise', icon: 'calendar-outline' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.timeframeTab, timeframeMode === tab.id && styles.timeframeTabActive]}
              onPress={() => setTimeframeMode(tab.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={timeframeMode === tab.id ? '#4338CA' : '#64748B'}
              />
              <Text style={[styles.timeframeTabText, timeframeMode === tab.id && styles.timeframeTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Day-Wise Date Chooser */}
        {timeframeMode === 'DAY' && (
          <View style={styles.pickerSubRow}>
            <Text style={styles.pickerLabel}>Pick Date:</Text>
            <View style={styles.quickDatesRow}>
              <TouchableOpacity
                style={[styles.quickDateBtn, selectedDate === new Date().toISOString().slice(0, 10) && styles.quickDateBtnActive]}
                onPress={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
              >
                <Text style={[styles.quickDateText, selectedDate === new Date().toISOString().slice(0, 10) && styles.quickDateTextActive]}>
                  Today
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickDateBtn, selectedDate === new Date(Date.now() - 86400000).toISOString().slice(0, 10) && styles.quickDateBtnActive]}
                onPress={() => setSelectedDate(new Date(Date.now() - 86400000).toISOString().slice(0, 10))}
              >
                <Text style={[styles.quickDateText, selectedDate === new Date(Date.now() - 86400000).toISOString().slice(0, 10) && styles.quickDateTextActive]}>
                  Yesterday
                </Text>
              </TouchableOpacity>

              <TextInput
                style={styles.customDateInput}
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>
        )}

        {/* Month-Wise Month Chooser */}
        {timeframeMode === 'MONTH' && (
          <View style={styles.pickerSubRow}>
            <Text style={styles.pickerLabel}>Select Month:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {availableMonths.map((m) => {
                const dateObj = new Date(`${m}-01T00:00:00Z`);
                const monthLabel = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
                const isSelected = selectedMonth === m;

                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.quickDateBtn, isSelected && styles.quickDateBtnActive]}
                    onPress={() => setSelectedMonth(m)}
                  >
                    <Text style={[styles.quickDateText, isSelected && styles.quickDateTextActive]}>
                      {monthLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* 2. Secondary Filter Chips (Academic Year & Status) */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>🎓 2. Filter by Academic Year & Status</Text>

        {/* Academic Year Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
          {['ALL', ...ACADEMIC_YEARS].map((yr) => (
            <TouchableOpacity
              key={yr}
              style={[styles.filterChip, selectedYear === yr && styles.filterChipActive]}
              onPress={() => setSelectedYear(yr)}
            >
              <Text style={[styles.filterChipText, selectedYear === yr && styles.filterChipTextActive]}>
                {yr === 'ALL' ? 'All Years' : yr}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Status Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filterChipsRow, { marginTop: 8 }]}>
          {[
            { id: 'ALL', label: 'All Statuses' },
            { id: 'completed', label: 'Completed' },
            { id: 'ready_for_pickup', label: 'Ready for Pickup' },
            { id: 'in_wash', label: 'In Washing' },
            { id: 'pending_approval', label: 'Pending Intake' },
          ].map((st) => (
            <TouchableOpacity
              key={st.id}
              style={[styles.filterChip, selectedStatus === st.id && styles.filterChipActiveIndigo]}
              onPress={() => setSelectedStatus(st.id)}
            >
              <Text style={[styles.filterChipText, selectedStatus === st.id && styles.filterChipTextActive]}>
                {st.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 3. Summary Statistics Cards */}
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

      {/* 4. Live Data Table Preview */}
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

        {/* In-Report Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search within report (student name, roll no, token, room)..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {filteredBookings.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="document-text-outline" size={36} color="#94A3B8" />
            <Text style={styles.emptyBoxTitle}>No Records Found</Text>
            <Text style={styles.emptyBoxSub}>No laundry requests match your active filters.</Text>
          </View>
        ) : (
          <View style={styles.tableList}>
            {filteredBookings.map((b, idx) => {
              const badge = getStatusBadgeColor(b.status);
              const itemsList = Object.entries(b.items || {})
                .map(([k, v]) => `${k}: ${v}`)
                .join(', ');

              return (
                <View key={b.id || idx} style={styles.tableRow}>
                  <View style={styles.rowTop}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.rowName}>{b.student_name || 'Student'}</Text>
                        <Text style={styles.rowRoll}>({b.student_id || 'ID: N/A'})</Text>
                      </View>
                      <Text style={styles.rowMeta}>
                        {b.academic_year} • {b.hostel_block} (Rm {b.room_number})
                      </Text>
                    </View>

                    <View style={styles.rowRight}>
                      <Text style={styles.rowToken}>#{b.pickup_token}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                          {badge.label}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.rowBottom}>
                    <Text style={styles.rowClothesCount}>
                      🧺 <Text style={{ fontWeight: '800' }}>{b.total_items}</Text> Clothes: {itemsList || 'Mixed Wash'}
                    </Text>
                    <Text style={styles.rowDate}>
                      {b.created_at ? b.created_at.slice(0, 10) : ''}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
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
    gap: 14,
    paddingBottom: 115,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
    elevation: 2,
  },
  headerTextWrap: {
    width: '100%',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
    fontWeight: '600',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 8,
    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.28)',
    elevation: 3,
  },
  downloadBtnSuccess: {
    backgroundColor: '#15803D',
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
  },
  timeframeTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  timeframeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  timeframeTabActive: {
    backgroundColor: '#FFFFFF',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  timeframeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  timeframeTabTextActive: {
    color: '#4338CA',
  },
  pickerSubRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  quickDatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickDateBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickDateBtnActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  quickDateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  quickDateTextActive: {
    color: '#4338CA',
  },
  customDateInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    minWidth: 110,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterChipActiveIndigo: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tableQuickExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  tableQuickExportText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#059669',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#0F172A',
  },
  tableList: {
    gap: 10,
  },
  tableRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rowName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  rowRoll: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  rowMeta: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  rowToken: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEF2FF',
  },
  rowClothesCount: {
    fontSize: 11.5,
    color: '#334155',
    flex: 1,
  },
  rowDate: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyBoxTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 8,
  },
  emptyBoxSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});

export default ReportsExportScreen;
