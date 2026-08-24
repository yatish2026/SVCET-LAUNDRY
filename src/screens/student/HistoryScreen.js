import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useLaundry } from '../../context/LaundryContext';
import OrderCard from '../../components/OrderCard';

export const HistoryScreen = ({ onSelectBooking }) => {
  const { profile } = useAuth();
  const { bookings } = useLaundry();
  const [filter, setFilter] = useState('all'); // 'all' | 'completed' | 'active'
  const [searchQuery, setSearchQuery] = useState('');

  const studentName = (profile?.full_name || profile?.email?.split('@')[0] || '').trim().toLowerCase();
  const studentEmail = (profile?.email || '').trim().toLowerCase();
  const studentRollNo = (profile?.student_id || '').trim();

  const studentBookings = bookings.filter((b) => {
    // 1. Unique User ID match
    if (b.user_id && profile?.id && b.user_id === profile.id) return true;
    // 2. Unique Email match
    if (b.student_email && studentEmail && b.student_email.toLowerCase() === studentEmail) return true;
    // 3. Exact Student Name match
    const bName = (b.student_name || '').trim().toLowerCase();
    if (studentName && bName && (bName === studentName || bName.includes(studentName) || studentName.includes(bName))) {
      return true;
    }
    // 4. Roll Number match (if customized)
    if (studentRollNo && studentRollNo !== 'SVCET-STD' && b.student_id === studentRollNo) {
      return true;
    }
    return false;
  });

  const filteredBookings = studentBookings.filter((b) => {
    // Filter status
    if (filter === 'completed' && b.status !== 'completed') return false;
    if (filter === 'active' && (b.status === 'completed' || b.status === 'cancelled')) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const tokenMatch = b.pickup_token?.toLowerCase().includes(q);
      const slotMatch = b.dropoff_slot_time?.toLowerCase().includes(q);
      return tokenMatch || slotMatch;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wash History & Archive</Text>
        <Text style={styles.headerSub}>View all your past and active laundry requests</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={THEME.colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by token (e.g. LND-3942)..."
          placeholderTextColor={THEME.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={THEME.colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {[
          { key: 'all', label: 'All Orders' },
          { key: 'active', label: 'In-Progress' },
          { key: 'completed', label: 'Completed' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, filter === tab.key && styles.tabBtnActive]}
            onPress={() => setFilter(tab.key)}
          >
            <Text style={[styles.tabText, filter === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="file-tray-outline" size={42} color={THEME.colors.textMuted} />
            <Text style={styles.emptyTitle}>No matching laundry records</Text>
            <Text style={styles.emptySub}>
              {searchQuery ? 'Try searching for a different token' : 'No records in this category'}
            </Text>
          </View>
        ) : (
          filteredBookings.map((bkg) => (
            <OrderCard
              key={bkg.id}
              booking={bkg}
              onPress={() => onSelectBooking(bkg.id)}
              actionLabel="View Details"
              actionIcon="chevron-forward"
              actionVariant="secondary"
              onAction={() => onSelectBooking(bkg.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
  },
  headerTitle: {
    fontSize: THEME.typography.sizes.lg,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  headerSub: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    marginHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    height: 42,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    gap: 8,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: THEME.radius.full,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  tabBtnActive: {
    backgroundColor: THEME.colors.primaryDark,
    borderColor: THEME.colors.primaryDark,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
});

export default HistoryScreen;
