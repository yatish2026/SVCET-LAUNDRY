import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
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
  const { bookings, grandTotalClothes, yearWiseStats } = useLaundry();
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const filteredBookings = bookings.filter(
    (b) => selectedYear === 'ALL' || b.academic_year === selectedYear
  );

  const totalClothesInView = filteredBookings.reduce(
    (sum, b) => sum + (b.total_items || 0),
    0
  );

  const handleDownloadCSV = () => {
    try {
      const headers = [
        'Token',
        'Student Name',
        'Roll No',
        'Academic Year',
        'Hostel Block',
        'Room No',
        'Phone',
        'Total Clothes',
        'Items Breakdown',
        'Status',
        'Dropoff Day',
        'Pickup Day',
      ];

      const rows = filteredBookings.map((b) => {
        const itemsList = Object.entries(b.items || {})
          .map(([k, v]) => `${k}:${v}`)
          .join('; ');

        return [
          `#${b.pickup_token}`,
          `"${b.student_name || ''}"`,
          `"${b.student_id || ''}"`,
          `"${b.academic_year || ''}"`,
          `"${b.hostel_block || ''}"`,
          `"${b.room_number || ''}"`,
          `"${b.phone_number || ''}"`,
          b.total_items,
          `"${itemsList}"`,
          b.status,
          `"${b.dropoff_slot_time || ''}"`,
          `"${b.pickup_slot_time || ''}"`,
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');

      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute(
          'download',
          `SVCET_Laundry_Report_${selectedYear.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);

      Alert.alert(
        'Report Exported! 📥',
        `Successfully exported data for ${filteredBookings.length} students (${totalClothesInView} total clothes).`
      );
    } catch (e) {
      Alert.alert('Export Error', 'Unable to export report.');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 📥 Download Hero Card */}
      <View style={styles.downloadHero}>
        <View style={styles.heroTop}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="document-text" size={24} color="#FFF" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.heroTitle}>Student Clothes Master Report</Text>
            <Text style={styles.heroSub}>
              Export complete student register, room numbers, and item totals
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={handleDownloadCSV}
          activeOpacity={0.85}
        >
          <Ionicons name="cloud-download-outline" size={20} color="#1E40AF" />
          <Text style={styles.downloadBtnText}>
            Download Student Report (.CSV)
          </Text>
        </TouchableOpacity>

        {downloadSuccess && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.successBannerText}>
              Report downloaded successfully!
            </Text>
          </View>
        )}
      </View>

      {/* 📊 Summary Counters */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{filteredBookings.length}</Text>
          <Text style={styles.statLabel}>Students Listed</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: '#1D4ED8' }]}>{totalClothesInView}</Text>
          <Text style={styles.statLabel}>Total Clothes</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: '#059669' }]}>{grandTotalClothes}</Text>
          <Text style={styles.statLabel}>Campus Grand Total</Text>
        </View>
      </View>

      {/* Year Filter Tabs */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Filter by Academic Year:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {['ALL', ...ACADEMIC_YEARS].map((yr) => {
            const isSelected = selectedYear === yr;
            return (
              <TouchableOpacity
                key={yr}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setSelectedYear(yr)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {yr}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 📋 Master Student Table List */}
      <Text style={styles.tableHeaderTitle}>
        STUDENT LAUNDRY REGISTER ({filteredBookings.length})
      </Text>

      {filteredBookings.length === 0 ? (
        <View style={styles.emptyTable}>
          <Text style={styles.emptyTableText}>No student records found</Text>
        </View>
      ) : (
        <View style={styles.tableContainer}>
          {filteredBookings.map((b, index) => {
            const items = Object.entries(b.items || {});
            return (
              <View
                key={b.id}
                style={[
                  styles.tableRow,
                  index % 2 === 1 && styles.tableRowAlt,
                ]}
              >
                <View style={styles.tableRowHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.tableStudentName}>{b.student_name}</Text>
                      <View style={styles.tableYearTag}>
                        <Text style={styles.tableYearTagText}>
                          {b.academic_year || '1st Year'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.tableStudentSub}>
                      ID: {b.student_id || 'N/A'} • {b.hostel_block?.split(' ')[0]} (Rm {b.room_number})
                    </Text>
                  </View>

                  <View style={styles.tableClothesCount}>
                    <Text style={styles.tableClothesNum}>{b.total_items}</Text>
                    <Text style={styles.tableClothesLabel}>clothes</Text>
                  </View>
                </View>

                {/* Items Summary Pill */}
                <View style={styles.tableItemsPills}>
                  {items.map(([k, v]) => (
                    <View key={k} style={styles.itemMiniPill}>
                      <Text style={styles.itemMiniPillText}>
                        {k.replace(/_/g, ' ')}: <Text style={{ fontWeight: '800' }}>{v}</Text>
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      )}
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
    paddingBottom: 50,
  },
  downloadHero: {
    backgroundColor: '#065F46',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    ...THEME.shadows.md,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
  },
  heroSub: {
    fontSize: 11,
    color: '#A7F3D0',
    marginTop: 2,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    ...THEME.shadows.sm,
  },
  downloadBtnText: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '800',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    paddingVertical: 6,
    marginTop: 10,
    gap: 6,
  },
  successBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  filterScroll: {
    gap: 6,
  },
  filterChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#065F46',
    borderColor: '#065F46',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
  tableHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tableRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  tableRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tableStudentName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  tableYearTag: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  tableYearTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  tableStudentSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  tableClothesCount: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  tableClothesNum: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1D4ED8',
  },
  tableClothesLabel: {
    fontSize: 8,
    color: '#64748B',
  },
  tableItemsPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
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
  emptyTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  emptyTableText: {
    fontSize: 12,
    color: '#64748B',
  },
});

export default ReportsExportScreen;
