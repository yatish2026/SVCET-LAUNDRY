import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useLaundry } from '../../context/LaundryContext';

export const HistoryScreen = ({ onSelectBooking }) => {
  const { profile } = useAuth();
  const { bookings, refreshData } = useLaundry();

  const [timeframe, setTimeframe] = useState('ALL'); // 'ALL' | 'TODAY' | 'YESTERDAY' | 'MONTH' | 'CUSTOM'
  const [selectedCustomDate, setSelectedCustomDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'completed' | 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const studentName = (profile?.full_name || profile?.email?.split('@')[0] || '').trim().toLowerCase();
  const studentEmail = (profile?.email || '').trim().toLowerCase();
  const studentRollNo = (profile?.student_id || '').trim();

  // Strict student booking filter
  const studentBookings = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Unique User ID match
      if (b.user_id && profile?.id && b.user_id === profile.id) return true;
      // 2. Unique Student Email match
      if (b.student_email && studentEmail && b.student_email.toLowerCase() === studentEmail) return true;
      // 3. Exact Student Name match
      const bName = (b.student_name || '').trim().toLowerCase();
      if (studentName && bName && bName === studentName) return true;
      // 4. Roll Number match
      if (studentRollNo && studentRollNo !== 'SVCET-STD' && studentRollNo !== 'RVS-STD' && b.student_id === studentRollNo) return true;
      return false;
    });
  }, [bookings, profile, studentEmail, studentName, studentRollNo]);

  // Today & Yesterday Strings
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  // Timeframe and Status Filtering
  const filteredBookings = useMemo(() => {
    return studentBookings.filter((b) => {
      const bDate = b.created_at || '';

      // 1. Timeframe Filter
      if (timeframe === 'TODAY') {
        if (!bDate.startsWith(todayStr)) return false;
      } else if (timeframe === 'YESTERDAY') {
        if (!bDate.startsWith(yesterdayStr)) return false;
      } else if (timeframe === 'MONTH') {
        if (!bDate.startsWith(currentMonthStr)) return false;
      } else if (timeframe === 'CUSTOM') {
        if (!bDate.startsWith(selectedCustomDate)) return false;
      }

      // 2. Status Filter
      if (statusFilter === 'completed' && b.status !== 'completed') return false;
      if (statusFilter === 'active' && (b.status === 'completed' || b.status === 'cancelled')) return false;
      if (statusFilter === 'cancelled' && b.status !== 'cancelled') return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const tokenMatch = b.pickup_token?.toLowerCase().includes(q);
        const dateMatch = b.created_at?.toLowerCase().includes(q);
        const slotMatch = b.dropoff_slot_time?.toLowerCase().includes(q);
        const itemsMatch = Object.keys(b.items || {}).some((k) => k.toLowerCase().includes(q));
        return tokenMatch || dateMatch || slotMatch || itemsMatch;
      }

      return true;
    });
  }, [studentBookings, timeframe, selectedCustomDate, statusFilter, searchQuery, todayStr, yesterdayStr, currentMonthStr]);

  // Summary of filtered clothes
  const totalClothesInView = useMemo(() => {
    return filteredBookings.reduce((sum, b) => sum + (b.total_items || 0), 0);
  }, [filteredBookings]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return { label: 'Collected & Completed', color: '#15803D', bg: '#DCFCE7', icon: 'checkmark-circle' };
      case 'ready_for_pickup':
        return { label: 'Ready for Pickup', color: '#B45309', bg: '#FEF3C7', icon: 'sparkles' };
      case 'drying_ironing':
        return { label: 'Drying & Ironing', color: '#7E22CE', bg: '#F3E8FF', icon: 'shirt' };
      case 'in_wash':
        return { label: 'In Washing Machine', color: '#1D4ED8', bg: '#DBEAFE', icon: 'water' };
      case 'cancelled':
        return { label: 'Cancelled Request', color: '#991B1B', bg: '#FEE2E2', icon: 'close-circle' };
      default:
        return { label: 'Drop-off Scheduled', color: '#475569', bg: '#F1F5F9', icon: 'time-outline' };
    }
  };

  const formatSubmitDate = (isoString) => {
    if (!isoString) return 'Recent Drop';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wash History & Archive</Text>
        <Text style={styles.headerSub}>Filter laundry orders by date, month, or custom day</Text>
      </View>

      {/* 🔍 Search Bar */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by token (#LND-XXXX), date, or items..."
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
      </View>

      {/* 📅 Timeframe Filter Buttons */}
      <View style={styles.timeframeBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeframeScroll}>
          {[
            { id: 'ALL', label: `All (${studentBookings.length})`, icon: 'albums-outline' },
            { id: 'TODAY', label: 'Today', icon: 'today-outline' },
            { id: 'YESTERDAY', label: 'Yesterday', icon: 'arrow-back-outline' },
            { id: 'MONTH', label: 'This Month', icon: 'calendar-outline' },
            { id: 'CUSTOM', label: 'Pick Date 🗓️', icon: 'calendar' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.timeframeBtn, timeframe === tab.id && styles.timeframeBtnActive]}
              onPress={() => setTimeframe(tab.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={tab.icon}
                size={14}
                color={timeframe === tab.id ? '#FFF' : '#475569'}
              />
              <Text style={[styles.timeframeBtnText, timeframe === tab.id && styles.timeframeBtnTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Custom Date Input when Pick Date selected */}
        {timeframe === 'CUSTOM' && (
          <View style={styles.customDateRow}>
            <Text style={styles.customDateLabel}>Select Specific Date:</Text>
            <TextInput
              style={styles.customDateInput}
              value={selectedCustomDate}
              onChangeText={setSelectedCustomDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94A3B8"
            />
          </View>
        )}
      </View>

      {/* Status Filter Chips */}
      <View style={styles.statusChipsRow}>
        {[
          { key: 'all', label: 'All Statuses' },
          { key: 'active', label: 'In-Progress' },
          { key: 'completed', label: 'Completed' },
          { key: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.statusChip, statusFilter === tab.key && styles.statusChipActive]}
            onPress={() => setStatusFilter(tab.key)}
          >
            <Text style={[styles.statusChipText, statusFilter === tab.key && styles.statusChipTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Tag */}
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>
          Showing <Text style={{ fontWeight: '800', color: '#1E293B' }}>{filteredBookings.length}</Text> Orders •{' '}
          <Text style={{ fontWeight: '800', color: '#4338CA' }}>{totalClothesInView}</Text> Clothes
        </Text>
      </View>

      {/* Orders List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="calendar-outline" size={38} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No Laundry Orders Found</Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? `No orders matching "${searchQuery}".`
                : 'No laundry requests found for your selected date or timeframe.'}
            </Text>
            {(timeframe !== 'ALL' || statusFilter !== 'all' || searchQuery) && (
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setTimeframe('ALL');
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
              >
                <Text style={styles.resetBtnText}>View All Historical Orders</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredBookings.map((b) => {
            const badge = getStatusBadge(b.status);
            const itemsList = Object.entries(b.items || {})
              .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
              .join(' • ');

            return (
              <TouchableOpacity
                key={b.id}
                style={styles.historyCard}
                onPress={() => onSelectBooking && onSelectBooking(b.id)}
                activeOpacity={0.85}
              >
                {/* Card Top Row */}
                <View style={styles.cardTopRow}>
                  <View style={styles.tokenBox}>
                    <Text style={styles.tokenNum}>#{b.pickup_token}</Text>
                    <View style={styles.yearTag}>
                      <Text style={styles.yearTagText}>{b.academic_year || '1st Year'}</Text>
                    </View>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Ionicons name={badge.icon} size={13} color={badge.color} />
                    <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                {/* Submission Date & Time (Neat & Clear) */}
                <View style={styles.submittedRow}>
                  <Ionicons name="time-outline" size={14} color="#64748B" />
                  <Text style={styles.submittedText}>
                    Submitted: <Text style={{ fontWeight: '700', color: '#1E293B' }}>{formatSubmitDate(b.created_at)}</Text>
                  </Text>
                </View>

                {/* Clothes Count & Item Breakdown */}
                <View style={styles.clothesBox}>
                  <View style={styles.clothesNumBadge}>
                    <Ionicons name="shirt" size={14} color="#4338CA" />
                    <Text style={styles.clothesNumText}>{b.total_items} Clothes</Text>
                  </View>
                  <Text style={styles.itemsSummaryText} numberOfLines={1}>
                    {itemsList || 'Mixed Clothes Wash'}
                  </Text>
                </View>

                {/* Schedule / Dropoff Info */}
                <View style={styles.cardFooter}>
                  <Text style={styles.footerSlotText}>
                    📍 {b.hostel_block?.split(' ')[0]} • Rm {b.room_number}
                  </Text>

                  <View style={styles.viewDetailBtn}>
                    <Text style={styles.viewDetailBtnText}>View Details</Text>
                    <Ionicons name="chevron-forward" size={14} color="#4338CA" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  searchBarWrap: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#0F172A',
  },
  timeframeBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  timeframeScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  timeframeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  timeframeBtnActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  timeframeBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  timeframeBtnTextActive: {
    color: '#FFFFFF',
  },
  customDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  customDateLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  customDateInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    minWidth: 110,
  },
  statusChipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    gap: 8,
  },
  statusChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  statusChipTextActive: {
    color: '#FFFFFF',
  },
  summaryRow: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  summaryText: {
    fontSize: 11.5,
    color: '#64748B',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 4,
    gap: 12,
    paddingBottom: 40,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tokenBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tokenNum: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  yearTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  yearTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4338CA',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  submittedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  submittedText: {
    fontSize: 11.5,
    color: '#64748B',
  },
  clothesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  clothesNumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  clothesNumText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#4338CA',
  },
  itemsSummaryText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerSlotText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  viewDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#4338CA',
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  resetBtn: {
    marginTop: 14,
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
});

export default HistoryScreen;
