import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useLaundry } from '../context/LaundryContext';
import StatusBadge from './StatusBadge';

const { width } = Dimensions.get('window');

export const StudentAnalyticsModal = ({ visible, onClose, onSelectBooking }) => {
  const { profile } = useAuth();
  const { bookings, refreshData } = useLaundry();

  const [timeframe, setTimeframe] = useState('ALL'); // 'ALL' | 'MONTH' | 'DAY' | 'YEAR'
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString());
  const [refreshing, setRefreshing] = useState(false);

  // Student specific identifiers
  const studentEmail = (profile?.email || '').trim().toLowerCase();
  const studentRollNo = (profile?.student_id || '').trim().toLowerCase();
  const cleanStudentPhone = (profile?.phone_number || '').replace(/[^0-9]/g, '');
  const studentName = profile?.full_name || profile?.email?.split('@')[0] || 'Student';

  // Strict isolation of student bookings
  const studentBookings = useMemo(() => {
    return (bookings || []).filter((b) => {
      if (b.user_id && profile?.id && b.user_id === profile.id) return true;
      if (b.student_email && studentEmail && b.student_email.toLowerCase().trim() === studentEmail) return true;
      const bRoll = (b.student_id || '').trim().toLowerCase();
      if (studentRollNo && bRoll && studentRollNo !== 'svcet-std' && studentRollNo !== 'rvs-std' && bRoll === studentRollNo) {
        return true;
      }
      const bPhone = (b.phone_number || '').replace(/[^0-9]/g, '');
      if (cleanStudentPhone && bPhone && cleanStudentPhone.length >= 10 && bPhone.length >= 10) {
        if (cleanStudentPhone.slice(-10) === bPhone.slice(-10)) return true;
      }
      return false;
    });
  }, [bookings, profile, studentEmail, studentRollNo, cleanStudentPhone]);

  // Extract all available months from user's booking history
  const availableMonths = useMemo(() => {
    const set = new Set();
    const currentM = new Date().toISOString().slice(0, 7);
    set.add(currentM);
    studentBookings.forEach((b) => {
      if (b.created_at) set.add(b.created_at.slice(0, 7));
    });
    return Array.from(set).sort().reverse();
  }, [studentBookings]);

  // Filter bookings based on selected timeframe
  const filteredBookings = useMemo(() => {
    return studentBookings.filter((b) => {
      const bDate = b.created_at || '';
      if (timeframe === 'ALL') return true;
      if (timeframe === 'MONTH') return bDate.startsWith(selectedMonth);
      if (timeframe === 'DAY') return bDate.startsWith(selectedDate);
      if (timeframe === 'YEAR') return bDate.startsWith(selectedYear);
      return true;
    });
  }, [studentBookings, timeframe, selectedMonth, selectedDate, selectedYear]);

  // Calculate comprehensive stats
  const stats = useMemo(() => {
    let totalItems = 0;
    let completedCount = 0;
    let inProgressCount = 0;
    let pendingCount = 0;
    const categoryTotals = {
      shirts: 0,
      pants: 0,
      innerwear: 0,
      bedding: 0,
      traditional: 0,
      other: 0,
    };

    filteredBookings.forEach((b) => {
      totalItems += parseInt(b.total_items || 0, 10);
      if (b.status === 'completed') completedCount += 1;
      else if (b.status === 'pending_approval') pendingCount += 1;
      else inProgressCount += 1;

      // Extract item categories
      let itemsObj = b.items;
      if (typeof itemsObj === 'string') {
        try {
          itemsObj = JSON.parse(itemsObj);
        } catch (e) {
          itemsObj = {};
        }
      }

      if (itemsObj && typeof itemsObj === 'object') {
        Object.entries(itemsObj).forEach(([key, count]) => {
          const qty = parseInt(count, 10) || 0;
          const k = key.toLowerCase();
          if (k.includes('shirt') || k.includes('tshirt') || k.includes('top')) categoryTotals.shirts += qty;
          else if (k.includes('pant') || k.includes('jean') || k.includes('trouser') || k.includes('short')) categoryTotals.pants += qty;
          else if (k.includes('inner') || k.includes('under') || k.includes('brief') || k.includes('vest')) categoryTotals.innerwear += qty;
          else if (k.includes('bed') || k.includes('sheet') || k.includes('towel') || k.includes('pillow') || k.includes('blanket')) categoryTotals.bedding += qty;
          else if (k.includes('kurta') || k.includes('saree') || k.includes('traditional') || k.includes('ethnic')) categoryTotals.traditional += qty;
          else categoryTotals.other += qty;
        });
      }
    });

    const categorySum = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

    return {
      totalBatches: filteredBookings.length,
      totalItems,
      completedCount,
      inProgressCount,
      pendingCount,
      categoryTotals,
      categorySum,
    };
  }, [filteredBookings]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const getTimeframeLabel = () => {
    if (timeframe === 'ALL') return 'All-Time Total History';
    if (timeframe === 'MONTH') {
      const d = new Date(`${selectedMonth}-01T00:00:00Z`);
      return `Month: ${d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}`;
    }
    if (timeframe === 'DAY') return `Date: ${selectedDate}`;
    return `Year: ${selectedYear}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>📊 Laundry Wash Analytics</Text>
            <Text style={styles.headerSubtitle}>
              {studentName} • Roll ID: {studentRollNo || 'Student'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn} activeOpacity={0.7}>
            <Ionicons name="sync-outline" size={20} color={refreshing ? '#4338CA' : '#64748B'} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Timeframe Filter Switcher */}
          <View style={styles.filterCard}>
            <Text style={styles.filterLabel}>SELECT TIMEFRAME</Text>
            <View style={styles.timeframeTabs}>
              {[
                { id: 'ALL', label: 'All-Time', icon: 'stats-chart-outline' },
                { id: 'MONTH', label: 'Monthly', icon: 'calendar-outline' },
                { id: 'DAY', label: 'Daily', icon: 'today-outline' },
                { id: 'YEAR', label: 'Yearly', icon: 'time-outline' },
              ].map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.tabBtn, timeframe === t.id && styles.tabBtnActive]}
                  onPress={() => setTimeframe(t.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={t.icon}
                    size={14}
                    color={timeframe === t.id ? '#FFF' : '#64748B'}
                  />
                  <Text style={[styles.tabBtnText, timeframe === t.id && styles.tabBtnTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sub-Filters for Month / Day / Year */}
            {timeframe === 'MONTH' && (
              <View style={styles.subFilterRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {availableMonths.map((m) => {
                    const d = new Date(`${m}-01T00:00:00Z`);
                    const monthStr = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
                    const isSel = selectedMonth === m;
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[styles.chip, isSel && styles.chipActive]}
                        onPress={() => setSelectedMonth(m)}
                      >
                        <Text style={[styles.chipText, isSel && styles.chipTextActive]}>{monthStr}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {timeframe === 'DAY' && (
              <View style={styles.subFilterRow}>
                <TouchableOpacity
                  style={[styles.chip, selectedDate === new Date().toISOString().slice(0, 10) && styles.chipActive]}
                  onPress={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
                >
                  <Text style={[styles.chipText, selectedDate === new Date().toISOString().slice(0, 10) && styles.chipTextActive]}>
                    Today
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, selectedDate === new Date(Date.now() - 86400000).toISOString().slice(0, 10) && styles.chipActive]}
                  onPress={() => setSelectedDate(new Date(Date.now() - 86400000).toISOString().slice(0, 10))}
                >
                  <Text style={[styles.chipText, selectedDate === new Date(Date.now() - 86400000).toISOString().slice(0, 10) && styles.chipTextActive]}>
                    Yesterday
                  </Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.dateInput}
                  value={selectedDate}
                  onChangeText={setSelectedDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            )}

            {timeframe === 'YEAR' && (
              <View style={styles.subFilterRow}>
                {['2026', '2025', '2024'].map((yr) => (
                  <TouchableOpacity
                    key={yr}
                    style={[styles.chip, selectedYear === yr && styles.chipActive]}
                    onPress={() => setSelectedYear(yr)}
                  >
                    <Text style={[styles.chipText, selectedYear === yr && styles.chipTextActive]}>
                      Year {yr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Active Timeframe Banner */}
          <View style={styles.summaryBanner}>
            <Ionicons name="information-circle" size={16} color="#4338CA" />
            <Text style={styles.summaryBannerText}>{getTimeframeLabel()}</Text>
          </View>

          {/* 🌟 4 Primary Metric Stat Cards */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { borderLeftColor: '#4338CA' }]}>
              <View style={[styles.statIconBox, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="shirt-outline" size={20} color="#4338CA" />
              </View>
              <Text style={styles.statValue}>{stats.totalItems}</Text>
              <Text style={styles.statLabel}>Clothes Washed</Text>
              <Text style={styles.statSub}>{stats.totalBatches} total drop-off batches</Text>
            </View>

            <View style={[styles.statCard, { borderLeftColor: '#16A34A' }]}>
              <View style={[styles.statIconBox, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="checkmark-done-circle-outline" size={20} color="#16A34A" />
              </View>
              <Text style={styles.statValue}>{stats.completedCount}</Text>
              <Text style={styles.statLabel}>Completed</Text>
              <Text style={styles.statSub}>Ready & delivered</Text>
            </View>

            <View style={[styles.statCard, { borderLeftColor: '#D97706' }]}>
              <View style={[styles.statIconBox, { backgroundColor: '#FFFBEB' }]}>
                <Ionicons name="sync-outline" size={20} color="#D97706" />
              </View>
              <Text style={styles.statValue}>{stats.inProgressCount}</Text>
              <Text style={styles.statLabel}>In Wash / Drying</Text>
              <Text style={styles.statSub}>Being processed</Text>
            </View>

            <View style={[styles.statCard, { borderLeftColor: '#6366F1' }]}>
              <View style={[styles.statIconBox, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="time-outline" size={20} color="#6366F1" />
              </View>
              <Text style={styles.statValue}>{stats.pendingCount}</Text>
              <Text style={styles.statLabel}>Pending Intake</Text>
              <Text style={styles.statSub}>Awaiting counter drop-off</Text>
            </View>
          </View>

          {/* 👕 Category-Wise Breakdown Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>👔 Clothes Category Breakdown</Text>
              <Text style={styles.sectionBadge}>{stats.totalItems} Items</Text>
            </View>

            {stats.totalItems > 0 ? (
              <View style={styles.categoryList}>
                {[
                  { label: 'Shirts & Tops', count: stats.categoryTotals.shirts, color: '#4338CA', icon: 'shirt-outline' },
                  { label: 'Pants & Trousers', count: stats.categoryTotals.pants, color: '#0284C7', icon: 'browsers-outline' },
                  { label: 'Innerwear & Essentials', count: stats.categoryTotals.innerwear, color: '#7C3AED', icon: 'body-outline' },
                  { label: 'Bedsheets & Towels', count: stats.categoryTotals.bedding, color: '#059669', icon: 'bed-outline' },
                  { label: 'Traditional / Formals', count: stats.categoryTotals.traditional, color: '#D97706', icon: 'sparkles-outline' },
                  { label: 'Other Garments', count: stats.categoryTotals.other, color: '#64748B', icon: 'ellipsis-horizontal-circle-outline' },
                ].map((cat, idx) => {
                  const percentage = stats.totalItems > 0 ? Math.round((cat.count / stats.totalItems) * 100) : 0;
                  return (
                    <View key={idx} style={styles.catRow}>
                      <View style={styles.catHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name={cat.icon} size={15} color={cat.color} style={{ marginRight: 6 }} />
                          <Text style={styles.catName}>{cat.label}</Text>
                        </View>
                        <Text style={styles.catCount}>
                          {cat.count} <Text style={styles.catPercent}>({percentage}%)</Text>
                        </Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { width: `${Math.max(percentage, cat.count > 0 ? 5 : 0)}%`, backgroundColor: cat.color },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="basket-outline" size={40} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Laundry Data in Selection</Text>
                <Text style={styles.emptySub}>No drop-offs recorded for the chosen timeframe.</Text>
              </View>
            )}
          </View>

          {/* 📋 Associated Drop-off Batches */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>📦 Batch Orders in Timeframe</Text>
              <Text style={styles.sectionBadge}>{filteredBookings.length} Orders</Text>
            </View>

            {filteredBookings.length > 0 ? (
              filteredBookings.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={styles.batchItem}
                  onPress={() => {
                    onClose();
                    if (onSelectBooking) onSelectBooking(b.id);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.batchLeft}>
                    <View style={styles.tokenBadge}>
                      <Text style={styles.tokenText}>#{b.pickup_token || 'LND'}</Text>
                    </View>
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.batchDate}>{b.created_at ? b.created_at.slice(0, 16).replace('T', ' ') : 'Recent'}</Text>
                      <Text style={styles.batchMeta}>
                        {b.total_items || 1} Clothes • {b.counter_number || 'Counter 1'}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <StatusBadge status={b.status} />
                    <Ionicons name="chevron-forward" size={16} color="#94A3B8" style={{ marginTop: 4 }} />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="calendar-clear-outline" size={36} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Orders for this Selection</Text>
                <Text style={styles.emptySub}>Select 'All-Time' to see your complete laundry activity.</Text>
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 52 : 40,
    paddingBottom: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...THEME.shadows.sm,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...THEME.shadows.sm,
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 2,
  },
  timeframeTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 3,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 11,
    gap: 4,
  },
  tabBtnActive: {
    backgroundColor: '#4338CA',
    ...THEME.shadows.xs,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  subFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  chip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  chipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4338CA',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#4338CA',
    fontWeight: '900',
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 11,
    color: '#0F172A',
  },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
    gap: 6,
  },
  summaryBannerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4338CA',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    width: (width - 42) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    ...THEME.shadows.sm,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginTop: 2,
  },
  statSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...THEME.shadows.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  sectionBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4338CA',
    backgroundColor: '#EEF2FF',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  categoryList: {
    gap: 10,
  },
  catRow: {
    gap: 4,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  catCount: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
  },
  catPercent: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  batchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  batchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenBadge: {
    backgroundColor: '#4338CA',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  tokenText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
  },
  batchDate: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  batchMeta: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },
});

export default StudentAnalyticsModal;
