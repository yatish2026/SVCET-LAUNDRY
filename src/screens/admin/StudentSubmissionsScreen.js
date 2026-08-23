import React, { useState } from 'react';
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
import { useLaundry } from '../../context/LaundryContext';
import { ACADEMIC_YEARS } from '../../constants/schedule';
import StatusBadge from '../../components/StatusBadge';

export const StudentSubmissionsScreen = ({ onSelectBooking }) => {
  const {
    bookings,
    advanceBookingStatus,
    refreshData,
  } = useLaundry();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState('ALL');

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const filteredBookings = bookings.filter((b) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      b.student_name?.toLowerCase().includes(q) ||
      b.pickup_token?.toLowerCase().includes(q) ||
      b.student_id?.toLowerCase().includes(q) ||
      b.room_number?.toLowerCase().includes(q) ||
      b.academic_year?.toLowerCase().includes(q);

    const matchesYear =
      selectedYearFilter === 'ALL' || b.academic_year === selectedYearFilter;

    return matchesQuery && matchesYear;
  });

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
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search student, token #LND, room..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Year Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabs}
        >
          {['ALL', ...ACADEMIC_YEARS].map((tab) => {
            const isSelected = selectedYearFilter === tab;
            const count =
              tab === 'ALL'
                ? bookings.length
                : bookings.filter((b) => b.academic_year === tab).length;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabChip, isSelected && styles.tabChipActive]}
                onPress={() => setSelectedYearFilter(tab)}
              >
                <Text
                  style={[
                    styles.tabChipText,
                    isSelected && styles.tabChipTextActive,
                  ]}
                >
                  {tab} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.listStatsHeader}>
          <Text style={styles.listStatsTitle}>
            {filteredBookings.length} {filteredBookings.length === 1 ? 'Submission' : 'Submissions'} Found
          </Text>
        </View>

        {filteredBookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="folder-open-outline" size={36} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Submissions Found</Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? `No orders matching "${searchQuery}" in ${selectedYearFilter}`
                : `No student submissions for ${selectedYearFilter} yet`}
            </Text>
          </View>
        ) : (
          filteredBookings.map((b) => {
            const nextAction = getNextStageLabel(b.status);
            return (
              <View key={b.id} style={styles.orderCard}>
                <TouchableOpacity
                  onPress={() => onSelectBooking(b.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.orderCardTop}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.nameRow}>
                        <Text style={styles.studentName}>{b.student_name}</Text>
                        <View style={styles.yearPill}>
                          <Text style={styles.yearPillText}>
                            {b.academic_year || '1st Year'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.studentDetails}>
                        {b.hostel_block?.split(' ')[0]} • Rm {b.room_number} • {b.phone_number}
                      </Text>
                    </View>

                    <StatusBadge status={b.status} size="sm" />
                  </View>

                  <View style={styles.orderCardMeta}>
                    <View style={styles.tokenPill}>
                      <Text style={styles.tokenPillText}>#{b.pickup_token}</Text>
                    </View>
                    <Text style={styles.clothesTotalTag}>
                      👕 <Text style={{ fontWeight: '800' }}>{b.total_items}</Text> Clothes
                    </Text>
                    <Text style={styles.pickupDateTag}>
                      Collect: {b.pickup_slot_time?.split('(')[0]}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Clean Checklist Button */}
                <TouchableOpacity
                  style={styles.checklistActionBtn}
                  onPress={() => onSelectBooking(b.id)}
                  activeOpacity={0.85}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="checkbox-outline" size={16} color="#1D4ED8" />
                    <Text style={styles.checklistActionBtnText}>View Clothes Checklist & Photos</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#1D4ED8" />
                </TouchableOpacity>
              </View>
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
  headerArea: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
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
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  filterTabs: {
    gap: 8,
    paddingVertical: 2,
  },
  tabChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabChipActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  tabChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  tabChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 50,
  },
  listStatsHeader: {
    marginBottom: 10,
  },
  listStatsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...THEME.shadows.sm,
  },
  orderCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  yearPill: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  yearPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  studentDetails: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  orderCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    gap: 10,
  },
  tokenPill: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  tokenPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E40AF',
  },
  clothesTotalTag: {
    fontSize: 11,
    color: '#0F172A',
  },
  pickupDateTag: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '700',
    marginLeft: 'auto',
  },
  checklistActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  checklistActionBtnText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '800',
  },
});

export default StudentSubmissionsScreen;
