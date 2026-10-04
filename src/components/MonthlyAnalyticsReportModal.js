import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Share,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../constants/theme';
import { useLaundry } from '../context/LaundryContext';

export const MonthlyAnalyticsReportModal = ({ visible, onClose }) => {
  const { bookings } = useLaundry();

  // Extract all available months from bookings
  const availableMonths = useMemo(() => {
    const set = new Set();
    const currentM = new Date().toISOString().slice(0, 7);
    set.add(currentM);
    (bookings || []).forEach((b) => {
      if (b.created_at) {
        set.add(b.created_at.slice(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [bookings]);

  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

  // Compute metrics for the selected month
  const monthData = useMemo(() => {
    const list = (bookings || []).filter((b) => (b.created_at || '').startsWith(selectedMonth));

    let totalClothes = 0;
    let completedCount = 0;
    let inProgressCount = 0;
    const uniqueStudents = new Set();
    const categoryCounts = {
      shirts: 0,
      pants: 0,
      innerwear: 0,
      bedding: 0,
      traditional: 0,
      other: 0,
    };
    const hostelDistribution = {};

    list.forEach((b) => {
      const items = parseInt(b.total_items || 0, 10);
      totalClothes += items;

      const studentKey = b.student_id || b.student_name || b.student_email || 'student';
      uniqueStudents.add(studentKey);

      if (b.status === 'completed') {
        completedCount += 1;
      } else {
        inProgressCount += 1;
      }

      const hBlock = b.hostel_block || 'Main Hostel';
      hostelDistribution[hBlock] = (hostelDistribution[hBlock] || 0) + items;

      let itemsObj = b.items;
      if (typeof itemsObj === 'string') {
        try {
          itemsObj = JSON.parse(itemsObj);
        } catch {
          itemsObj = {};
        }
      }
      if (itemsObj && typeof itemsObj === 'object') {
        Object.entries(itemsObj).forEach(([catKey, qty]) => {
          const q = parseInt(qty || 0, 10);
          const k = catKey.toLowerCase();
          if (k.includes('shirt') || k.includes('tshirt') || k.includes('top')) categoryCounts.shirts += q;
          else if (k.includes('pant') || k.includes('jean') || k.includes('trouser') || k.includes('short')) categoryCounts.pants += q;
          else if (k.includes('inner') || k.includes('under') || k.includes('vest')) categoryCounts.innerwear += q;
          else if (k.includes('bed') || k.includes('sheet') || k.includes('towel') || k.includes('blanket')) categoryCounts.bedding += q;
          else if (k.includes('kurta') || k.includes('saree') || k.includes('traditional')) categoryCounts.traditional += q;
          else categoryCounts.other += q;
        });
      }
    });

    const monthDateObj = new Date(`${selectedMonth}-01T00:00:00Z`);
    const monthName = monthDateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

    return {
      monthName,
      records: list,
      totalOrders: list.length,
      totalClothes,
      studentCount: uniqueStudents.size,
      completedCount,
      inProgressCount,
      completionRate: list.length > 0 ? Math.round((completedCount / list.length) * 100) : 100,
      categoryCounts,
      hostelDistribution,
    };
  }, [bookings, selectedMonth]);

  // Share or Export Formatted Summary Document
  const handleShareReport = async () => {
    try {
      const summaryText = `📄 RVS UNIVERSITY - LAUNDRY PERFORMANCE REPORT
Month: ${monthData.monthName}
---------------------------------------------
📊 SUMMARY METRICS:
• Total Clothes Washed: ${monthData.totalClothes} items
• Total Student Beneficiaries: ${monthData.studentCount} students
• Total Laundry Orders: ${monthData.totalOrders} batches
• Completed Orders: ${monthData.completedCount} (${monthData.completionRate}%)
• In Progress Orders: ${monthData.inProgressCount}

🧺 CATEGORY BREAKDOWN:
• Shirts / Tops: ${monthData.categoryCounts.shirts}
• Pants / Trousers: ${monthData.categoryCounts.pants}
• Innerwear: ${monthData.categoryCounts.innerwear}
• Bedding & Towels: ${monthData.categoryCounts.bedding}
• Traditional & Formals: ${monthData.categoryCounts.traditional}

Generated via VASTRA Hostel Laundry System on ${new Date().toLocaleString()}`;

      if (Platform.OS === 'web') {
        const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `VASTRA_Monthly_Report_${selectedMonth}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        Alert.alert('Report Exported', 'Saved to your device downloads folder.');
      } else {
        await Share.share({
          title: `VASTRA Laundry Report - ${monthData.monthName}`,
          message: summaryText,
        });
      }
    } catch (err) {
      Alert.alert('Share Error', 'Could not open system share dialog.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.pdfIconCircle}>
                <Ionicons name="document-text" size={20} color="#4338CA" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Monthly Laundry Analysis</Text>
                <Text style={styles.headerSub}>Official Campus Wash Report</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Month Selector Carousel */}
          <View style={styles.monthSelectorWrap}>
            <Text style={styles.selectorLabel}>SELECT REPORTING MONTH:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthPillsRow}>
              {availableMonths.map((m) => {
                const d = new Date(`${m}-01T00:00:00Z`);
                const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
                const isSelected = selectedMonth === m;

                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.monthPill, isSelected && styles.monthPillActive]}
                    onPress={() => setSelectedMonth(m)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="calendar"
                      size={13}
                      color={isSelected ? '#FFFFFF' : '#4338CA'}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.monthPillText, isSelected && styles.monthPillTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Document Content */}
          <ScrollView style={styles.docScroll} showsVerticalScrollIndicator={false}>
            {/* Printable A4 Styled Document Card */}
            <View style={styles.a4DocCard}>
              {/* University Letterhead */}
              <View style={styles.letterheadWrap}>
                <Text style={styles.univName}>RVS UNIVERSITY • SVCET CAMPUS</Text>
                <Text style={styles.docTitle}>CENTRAL LAUNDRY SERVICE REPORT</Text>
                <View style={styles.docMetaBadge}>
                  <Text style={styles.docMetaText}>PERIOD: {monthData.monthName.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.docDivider} />

              {/* 4 Core Metric Tiles */}
              <View style={styles.metricsGrid}>
                <View style={[styles.metricTile, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
                  <Text style={[styles.metricNumber, { color: '#4338CA' }]}>{monthData.totalClothes}</Text>
                  <Text style={styles.metricLabel}>Total Clothes Washed</Text>
                </View>

                <View style={[styles.metricTile, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                  <Text style={[styles.metricNumber, { color: '#15803D' }]}>{monthData.studentCount}</Text>
                  <Text style={styles.metricLabel}>Students Benefited</Text>
                </View>

                <View style={[styles.metricTile, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                  <Text style={[styles.metricNumber, { color: '#D97706' }]}>{monthData.completedCount}</Text>
                  <Text style={styles.metricLabel}>Orders Completed</Text>
                </View>

                <View style={[styles.metricTile, { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }]}>
                  <Text style={[styles.metricNumber, { color: '#334155' }]}>{monthData.completionRate}%</Text>
                  <Text style={styles.metricLabel}>Success Rate</Text>
                </View>
              </View>

              {/* Category Breakdown Section */}
              <Text style={styles.subSectionTitle}>🧺 Clothes Category Breakdown</Text>
              <View style={styles.breakdownCard}>
                {[
                  { label: 'Shirts & Tops', count: monthData.categoryCounts.shirts, color: '#4338CA' },
                  { label: 'Pants & Trousers', count: monthData.categoryCounts.pants, color: '#059669' },
                  { label: 'Innerwear Items', count: monthData.categoryCounts.innerwear, color: '#D97706' },
                  { label: 'Bedding & Towels', count: monthData.categoryCounts.bedding, color: '#7C3AED' },
                  { label: 'Traditional / Formals', count: monthData.categoryCounts.traditional, color: '#DB2777' },
                ].map((item, idx) => {
                  const pct = monthData.totalClothes > 0 ? Math.round((item.count / monthData.totalClothes) * 100) : 0;
                  return (
                    <View key={idx} style={styles.categoryRow}>
                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryName}>{item.label}</Text>
                        <Text style={styles.categoryCount}>
                          {item.count} pcs <Text style={{ color: '#94A3B8' }}>({pct}%)</Text>
                        </Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: item.color }]} />
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Hostel Distribution Section */}
              <Text style={styles.subSectionTitle}>🏢 Hostel Block Distribution</Text>
              <View style={styles.hostelGrid}>
                {Object.entries(monthData.hostelDistribution).map(([block, count], idx) => (
                  <View key={idx} style={styles.hostelChip}>
                    <Text style={styles.hostelChipName} numberOfLines={1}>
                      {block}
                    </Text>
                    <Text style={styles.hostelChipCount}>{count} clothes</Text>
                  </View>
                ))}
              </View>

              {/* Recent Orders in this Month */}
              <Text style={styles.subSectionTitle}>
                📋 Student Intake Records ({monthData.records.length})
              </Text>
              {monthData.records.length === 0 ? (
                <View style={styles.emptyDocBox}>
                  <Ionicons name="folder-open-outline" size={32} color="#94A3B8" />
                  <Text style={styles.emptyDocText}>No laundry drop-offs recorded for {monthData.monthName}.</Text>
                </View>
              ) : (
                <View style={styles.auditTable}>
                  {monthData.records.slice(0, 15).map((b, idx) => (
                    <View key={b.id || idx} style={styles.auditRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.auditStudentName}>{b.student_name || 'Student'}</Text>
                        <Text style={styles.auditSub}>
                          {b.student_id ? `Roll: ${b.student_id} • ` : ''}Token #{b.pickup_token}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.auditItems}>{b.total_items} items</Text>
                        <Text style={[styles.auditStatus, { color: b.status === 'completed' ? '#15803D' : '#D97706' }]}>
                          {b.status === 'completed' ? 'Completed' : 'In Wash'}
                        </Text>
                      </View>
                    </View>
                  ))}
                  {monthData.records.length > 15 && (
                    <Text style={styles.moreRecordsSub}>
                      + {monthData.records.length - 15} more student intake records in this month
                    </Text>
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footerBar}>
            <TouchableOpacity style={styles.shareActionBtn} onPress={handleShareReport} activeOpacity={0.85}>
              <Ionicons name="share-social" size={18} color="#FFFFFF" />
              <Text style={styles.shareActionBtnText}>Share / Save Report Document</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '92%',
    paddingTop: 16,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pdfIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#64748B',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthSelectorWrap: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  selectorLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  monthPillsRow: {
    gap: 8,
  },
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthPillActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  monthPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  monthPillTextActive: {
    color: '#FFFFFF',
  },
  docScroll: {
    flex: 1,
    padding: 16,
  },
  a4DocCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  letterheadWrap: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  univName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4338CA',
    letterSpacing: 1.2,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  docMetaBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  docMetaText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4338CA',
    letterSpacing: 0.5,
  },
  docDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  metricTile: {
    flex: 1,
    minWidth: '46%',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 22,
    fontWeight: '900',
  },
  metricLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  subSectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 10,
    marginBottom: 8,
  },
  breakdownCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  categoryRow: {
    marginBottom: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  categoryName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  categoryCount: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  hostelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  hostelChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  hostelChipName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
  hostelChipCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  auditTable: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  auditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  auditStudentName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  auditSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  auditItems: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#4338CA',
  },
  auditStatus: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  moreRecordsSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    paddingTop: 8,
  },
  emptyDocBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyDocText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
  },
  footerBar: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  shareActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4338CA',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  shareActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default MonthlyAnalyticsReportModal;
