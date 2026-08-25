import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../constants/theme';

export const AdminCalendarAnalyticsModal = ({ visible, onClose, bookings = [] }) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDateStr, setSelectedDateStr] = useState(today.toISOString().slice(0, 10)); // 'YYYY-MM-DD'
  const [filterMode, setFilterMode] = useState('DAY'); // 'DAY' | 'WEEK' | 'MONTH' | 'CUSTOM'
  const [customStartDate, setCustomStartDate] = useState(
    new Date(today.getTime() - 7 * 86400000).toISOString().slice(0, 10)
  );
  const [customEndDate, setCustomEndDate] = useState(today.toISOString().slice(0, 10));
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Group bookings by date string 'YYYY-MM-DD'
  const bookingsByDate = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      if (!b.created_at) return;
      const dStr = b.created_at.slice(0, 10);
      if (!map[dStr]) {
        map[dStr] = {
          orders: [],
          totalClothes: 0,
          completed: 0,
          active: 0,
          pending: 0,
        };
      }
      map[dStr].orders.push(b);
      map[dStr].totalClothes += Number(b.total_items) || 1;
      if (b.status === 'completed') {
        map[dStr].completed++;
      } else if (b.status === 'pending_approval' || b.status === 'dropoff_scheduled') {
        map[dStr].pending++;
      } else if (b.status !== 'cancelled') {
        map[dStr].active++;
      }
    });
    return map;
  }, [bookings]);

  // Generate calendar days for current month
  const calendarGrid = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sun
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = [];

    // Blank padding days
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ blank: true, key: `blank_${i}` });
    }

    // Actual calendar days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
      const dayData = bookingsByDate[dateStr];

      days.push({
        day: d,
        dateStr,
        count: dayData ? dayData.orders.length : 0,
        clothes: dayData ? dayData.totalClothes : 0,
        isToday: dateStr === today.toISOString().slice(0, 10),
        isSelected: dateStr === selectedDateStr && filterMode === 'DAY',
        data: dayData,
        key: dateStr,
      });
    }

    return days;
  }, [currentYear, currentMonth, bookingsByDate, selectedDateStr, filterMode]);

  // Compute Filtered Bookings for the selected mode
  const filteredAnalytics = useMemo(() => {
    let result = [];
    const now = new Date();

    if (filterMode === 'DAY') {
      result = bookings.filter((b) => (b.created_at || '').slice(0, 10) === selectedDateStr);
    } else if (filterMode === 'WEEK') {
      const currentDay = now.getDay();
      const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      result = bookings.filter((b) => {
        if (!b.created_at) return false;
        const bDate = new Date(b.created_at);
        return bDate >= monday && bDate <= sunday;
      });
    } else if (filterMode === 'MONTH') {
      const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      result = bookings.filter((b) => (b.created_at || '').startsWith(prefix));
    } else if (filterMode === 'CUSTOM') {
      result = bookings.filter((b) => {
        const d = (b.created_at || '').slice(0, 10);
        return d >= customStartDate && d <= customEndDate;
      });
    }

    if (statusFilter !== 'ALL') {
      result = result.filter((b) => b.status === statusFilter);
    }

    // Compute metrics
    const totalOrders = result.length;
    const totalClothes = result.reduce((sum, b) => sum + (Number(b.total_items) || 1), 0);
    const completed = result.filter((b) => b.status === 'completed').length;
    const inWash = result.filter((b) => b.status === 'in_wash' || b.status === 'drying_ironing').length;
    const readyPickup = result.filter((b) => b.status === 'ready_for_pickup').length;
    const pendingIntake = result.filter(
      (b) => b.status === 'pending_approval' || b.status === 'dropoff_scheduled'
    ).length;

    // Unique students in this timeframe
    const uniqueStudents = new Set(
      result.map((b) => b.student_id || b.student_name || b.student_email)
    ).size;

    return {
      orders: result,
      totalOrders,
      totalClothes,
      completed,
      inWash,
      readyPickup,
      pendingIntake,
      uniqueStudents,
    };
  }, [
    bookings,
    filterMode,
    selectedDateStr,
    currentYear,
    currentMonth,
    customStartDate,
    customEndDate,
    statusFilter,
  ]);

  const monthName = new Date(currentYear, currentMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return { label: 'Delivered', bg: '#DCFCE7', text: '#15803D' };
      case 'ready_for_pickup':
        return { label: 'Ready at Desk', bg: '#FEF3C7', text: '#B45309' };
      case 'in_wash':
        return { label: 'In Washing', bg: '#DBEAFE', text: '#1E40AF' };
      case 'drying_ironing':
        return { label: 'Drying / Iron', bg: '#F3E8FF', text: '#6B21A8' };
      default:
        return { label: 'Pending Intake', bg: '#F1F5F9', text: '#475569' };
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.headerTag}>
                <Ionicons name="calendar" size={13} color="#4338CA" />
                <Text style={styles.headerTagText}>STAFF ANALYTICS</Text>
              </View>
              <Text style={styles.headerTitle}>Calendar & Daily Wash Logs</Text>
              <Text style={styles.headerSub}>
                Track daily intake, weekly trends, and per-date laundry load
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={28} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Timeframe Filter Mode Switcher */}
            <View style={styles.timeframeTabsRow}>
              {[
                { id: 'DAY', label: 'Single Day', icon: 'today-outline' },
                { id: 'WEEK', label: 'This Week', icon: 'stats-chart-outline' },
                { id: 'MONTH', label: 'Full Month', icon: 'calendar-outline' },
                { id: 'CUSTOM', label: 'Date Range', icon: 'funnel-outline' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.timeframeTab, filterMode === tab.id && styles.timeframeTabActive]}
                  onPress={() => setFilterMode(tab.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={tab.icon}
                    size={14}
                    color={filterMode === tab.id ? '#4338CA' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.timeframeTabText,
                      filterMode === tab.id && styles.timeframeTabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Date Range Picker Inputs */}
            {filterMode === 'CUSTOM' && (
              <View style={styles.customRangeCard}>
                <Text style={styles.customRangeTitle}>Select Custom Range (YYYY-MM-DD):</Text>
                <View style={styles.customRangeInputsRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>From Date:</Text>
                    <TextInput
                      style={styles.dateInput}
                      value={customStartDate}
                      onChangeText={setCustomStartDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <Ionicons name="arrow-forward" size={16} color="#64748B" style={{ marginTop: 18 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>To Date:</Text>
                    <TextInput
                      style={styles.dateInput}
                      value={customEndDate}
                      onChangeText={setCustomEndDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>
              </View>
            )}

            {/* 2. Interactive Calendar Month Grid */}
            <View style={styles.calendarCard}>
              {/* Month Header Navigation */}
              <View style={styles.calendarMonthHeader}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn}>
                  <Ionicons name="chevron-back" size={20} color="#0F172A" />
                </TouchableOpacity>

                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.monthHeaderTitle}>{monthName}</Text>
                  <Text style={styles.monthHeaderSub}>
                    {filterMode === 'DAY'
                      ? `Selected: ${selectedDateStr}`
                      : filterMode === 'MONTH'
                      ? 'Viewing Full Month'
                      : filterMode === 'WEEK'
                      ? 'Viewing Current Week'
                      : 'Viewing Custom Range'}
                  </Text>
                </View>

                <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn}>
                  <Ionicons name="chevron-forward" size={20} color="#0F172A" />
                </TouchableOpacity>
              </View>

              {/* Day of Week Headers */}
              <View style={styles.weekDaysRow}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((wd, i) => (
                  <Text key={wd} style={[styles.weekDayText, (i === 0 || i === 6) && { color: '#94A3B8' }]}>
                    {wd}
                  </Text>
                ))}
              </View>

              {/* Days Matrix */}
              <View style={styles.daysGrid}>
                {calendarGrid.map((item) => {
                  if (item.blank) {
                    return <View key={item.key} style={styles.blankDayCell} />;
                  }

                  const hasOrders = item.count > 0;

                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.dayCell,
                        item.isToday && styles.dayCellToday,
                        item.isSelected && styles.dayCellSelected,
                        hasOrders && styles.dayCellHasOrders,
                      ]}
                      onPress={() => {
                        setSelectedDateStr(item.dateStr);
                        setFilterMode('DAY');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayNumberText,
                          item.isToday && styles.dayNumberToday,
                          item.isSelected && styles.dayNumberSelected,
                        ]}
                      >
                        {item.day}
                      </Text>

                      {hasOrders ? (
                        <View style={styles.orderDotWrap}>
                          <View
                            style={[
                              styles.orderBadgePill,
                              item.isSelected && { backgroundColor: '#FFFFFF' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.orderBadgePillText,
                                item.isSelected && { color: '#4338CA' },
                              ]}
                            >
                              {item.count}
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.emptyDot} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3. Analytics Metric Cards */}
            <View style={styles.analyticsStatsGrid}>
              <View style={[styles.statBox, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
                <View style={styles.statBoxTop}>
                  <Ionicons name="bag-check" size={18} color="#4338CA" />
                  <Text style={[styles.statBoxNum, { color: '#4338CA' }]}>
                    {filteredAnalytics.totalOrders}
                  </Text>
                </View>
                <Text style={styles.statBoxLabel}>Total Bags Received</Text>
                <Text style={styles.statBoxSub}>
                  {filteredAnalytics.uniqueStudents} unique students
                </Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                <View style={styles.statBoxTop}>
                  <Ionicons name="shirt" size={18} color="#15803D" />
                  <Text style={[styles.statBoxNum, { color: '#15803D' }]}>
                    {filteredAnalytics.totalClothes}
                  </Text>
                </View>
                <Text style={styles.statBoxLabel}>Total Clothes Load</Text>
                <Text style={styles.statBoxSub}>
                  avg {(filteredAnalytics.totalClothes / (filteredAnalytics.totalOrders || 1)).toFixed(1)} / bag
                </Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                <View style={styles.statBoxTop}>
                  <Ionicons name="checkmark-done" size={18} color="#B45309" />
                  <Text style={[styles.statBoxNum, { color: '#B45309' }]}>
                    {filteredAnalytics.completed}
                  </Text>
                </View>
                <Text style={styles.statBoxLabel}>Delivered & Done</Text>
                <Text style={styles.statBoxSub}>
                  {filteredAnalytics.readyPickup} bags ready at counter
                </Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: '#FDF2F8', borderColor: '#FBCFE8' }]}>
                <View style={styles.statBoxTop}>
                  <Ionicons name="water" size={18} color="#BE185D" />
                  <Text style={[styles.statBoxNum, { color: '#BE185D' }]}>
                    {filteredAnalytics.inWash + filteredAnalytics.pendingIntake}
                  </Text>
                </View>
                <Text style={styles.statBoxLabel}>In Washing / Intake</Text>
                <Text style={styles.statBoxSub}>
                  {filteredAnalytics.inWash} washing • {filteredAnalytics.pendingIntake} pending
                </Text>
              </View>
            </View>

            {/* 4. Filter by Status Tabs */}
            <View style={styles.statusChipsRow}>
              {[
                { id: 'ALL', label: 'All Orders' },
                { id: 'pending_approval', label: 'Pending Intake' },
                { id: 'in_wash', label: 'In Washing' },
                { id: 'ready_for_pickup', label: 'Ready for Pickup' },
                { id: 'completed', label: 'Delivered' },
              ].map((st) => (
                <TouchableOpacity
                  key={st.id}
                  style={[styles.statusChip, statusFilter === st.id && styles.statusChipActive]}
                  onPress={() => setStatusFilter(st.id)}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      statusFilter === st.id && styles.statusChipTextActive,
                    ]}
                  >
                    {st.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 5. List of Orders for Selected Timeframe */}
            <View style={styles.ordersSection}>
              <View style={styles.ordersSectionHeader}>
                <Text style={styles.ordersSectionTitle}>
                  📋 Orders in Timeframe ({filteredAnalytics.orders.length})
                </Text>
              </View>

              {filteredAnalytics.orders.length === 0 ? (
                <View style={styles.emptyOrdersCard}>
                  <Ionicons name="calendar-outline" size={32} color="#94A3B8" />
                  <Text style={styles.emptyOrdersTitle}>No Laundry Orders</Text>
                  <Text style={styles.emptyOrdersSub}>
                    No student submissions recorded for this date or filter selection.
                  </Text>
                </View>
              ) : (
                filteredAnalytics.orders.map((b) => {
                  const statusInfo = getStatusBadge(b.status);
                  const itemsList = Object.entries(b.items || {})
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(' • ');

                  return (
                    <View key={b.id} style={styles.orderCard}>
                      <View style={styles.orderCardTop}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.studentName}>{b.student_name || 'Student'}</Text>
                            <View style={styles.tokenPill}>
                              <Text style={styles.tokenPillText}>#{b.pickup_token}</Text>
                            </View>
                          </View>
                          <Text style={styles.studentSub}>
                            {b.academic_year || 'Year'} • Room {b.room_number || 'N/A'} (
                            {b.hostel_block || 'Hostel'}) • {b.student_id || ''}
                          </Text>
                        </View>

                        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                          <Text style={[styles.statusBadgeText, { color: statusInfo.text }]}>
                            {statusInfo.label}
                          </Text>
                        </View>
                      </View>

                      {/* Items Row */}
                      <View style={styles.orderItemsRow}>
                        <Ionicons name="shirt-outline" size={14} color="#64748B" />
                        <Text style={styles.itemsCountText}>{b.total_items || 1} Clothes:</Text>
                        <Text style={styles.itemsDetailText} numberOfLines={1}>
                          {itemsList || 'Regular wash load'}
                        </Text>
                      </View>

                      {/* Date & Time footer */}
                      <View style={styles.orderFooterRow}>
                        <Text style={styles.orderDateText}>
                          🕒 {new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                          {new Date(b.created_at).toLocaleDateString()}
                        </Text>
                        {b.phone_number ? (
                          <Text style={styles.phoneText}>📞 {b.phone_number}</Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '92%',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EEF2FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  headerTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4338CA',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  timeframeTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  timeframeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 5,
  },
  timeframeTabActive: {
    backgroundColor: '#FFFFFF',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    elevation: 2,
  },
  timeframeTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  timeframeTabTextActive: {
    color: '#4338CA',
    fontWeight: '800',
  },
  customRangeCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customRangeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  customRangeInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  dateInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12.5,
    color: '#0F172A',
    fontWeight: '700',
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
    elevation: 2,
  },
  calendarMonthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  monthNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  monthHeaderSub: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#4338CA',
    marginTop: 2,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
  },
  weekDayText: {
    width: '14%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  blankDayCell: {
    width: '14.28%',
    height: 48,
  },
  dayCell: {
    width: '14.28%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginVertical: 2,
  },
  dayCellToday: {
    backgroundColor: '#EEF2FF',
  },
  dayCellSelected: {
    backgroundColor: '#4338CA',
    boxShadow: '0 4px 10px rgba(67, 56, 202, 0.35)',
    elevation: 3,
  },
  dayCellHasOrders: {
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  dayNumberText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  dayNumberToday: {
    color: '#4338CA',
    fontWeight: '900',
  },
  dayNumberSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  orderDotWrap: {
    marginTop: 2,
  },
  orderBadgePill: {
    backgroundColor: '#4338CA',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
  },
  orderBadgePillText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  emptyDot: {
    height: 6,
  },
  analyticsStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    width: '48.5%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
  },
  statBoxTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statBoxNum: {
    fontSize: 20,
    fontWeight: '900',
  },
  statBoxLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
  },
  statBoxSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  statusChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusChipActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  statusChipTextActive: {
    color: '#FFFFFF',
  },
  ordersSection: {
    gap: 10,
  },
  ordersSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ordersSectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  emptyOrdersCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyOrdersTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
    marginTop: 8,
  },
  emptyOrdersSub: {
    fontSize: 11.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 3,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
    gap: 8,
  },
  orderCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  studentName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  studentSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  tokenPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  tokenPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#4338CA',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  orderItemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    gap: 6,
  },
  itemsCountText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#334155',
  },
  itemsDetailText: {
    flex: 1,
    fontSize: 11,
    color: '#64748B',
  },
  orderFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderDateText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  phoneText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0284C7',
  },
});

export default AdminCalendarAnalyticsModal;
