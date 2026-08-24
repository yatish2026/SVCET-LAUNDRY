import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../constants/theme';
import { getStudentSchedule, getYearConfig, ACADEMIC_YEARS } from '../../constants/schedule';
import { useAuth } from '../../context/AuthContext';
import { useLaundry } from '../../context/LaundryContext';
import StepTracker from '../../components/StepTracker';
import PickupTokenModal from '../../components/PickupTokenModal';

export const StudentHomeScreen = ({
  onNavigateToNewBooking,
  onSelectBooking,
  onNavigateToHistory,
  onNavigateToProfile,
}) => {
  const { profile } = useAuth();
  const { bookings, refreshData } = useLaundry();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTokenBooking, setSelectedTokenBooking] = useState(null);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [rulesModalVisible, setRulesModalVisible] = useState(false);

  const studentName = profile?.full_name || profile?.email?.split('@')[0] || 'Student';
  const studentPhone = profile?.phone_number || '';
  const studentYear = profile?.academic_year || '1st Year B.Tech';
  const yearConfig = useMemo(() => getStudentSchedule(profile), [profile]);

  // Current Date formatting
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const studentEmail = (profile?.email || '').trim().toLowerCase();
  const studentRollNo = (profile?.student_id || '').trim();
  const cleanStudentName = studentName.trim().toLowerCase();

  const studentBookings = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Unique User ID match
      if (b.user_id && profile?.id && b.user_id === profile.id) return true;
      // 2. Unique Email match
      if (b.student_email && studentEmail && b.student_email.toLowerCase() === studentEmail) return true;
      // 3. Exact Student Name match (STRICT equality, NO substring match)
      const bName = (b.student_name || '').trim().toLowerCase();
      if (cleanStudentName && bName && bName === cleanStudentName) {
        return true;
      }
      // 4. Roll Number match (if valid and not default placeholder)
      if (studentRollNo && studentRollNo !== 'SVCET-STD' && studentRollNo !== 'RVS-STD' && b.student_id === studentRollNo) {
        return true;
      }
      return false;
    });
  }, [bookings, profile, studentEmail, cleanStudentName, studentRollNo]);

  const activeBookings = studentBookings.filter(
    (b) => b.status !== 'completed' && b.status !== 'cancelled'
  );

  const readyBookings = studentBookings.filter((b) => b.status === 'ready_for_pickup');
  const completedBookings = studentBookings.filter((b) => b.status === 'completed');
  const primaryActive = activeBookings[0];

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { label: 'Collected & Done', color: '#16A34A', bg: '#DCFCE7' };
      case 'ready_for_pickup':
        return { label: 'Ready for Pickup', color: '#D97706', bg: '#FEF3C7' };
      case 'drying_ironing':
        return { label: 'Drying & Ironing', color: '#7C3AED', bg: '#F3E8FF' };
      case 'in_wash':
        return { label: 'In Washing Machine', color: '#2563EB', bg: '#DBEAFE' };
      case 'dropoff_scheduled':
      case 'pending_approval':
        return { label: 'Drop-off Pending', color: '#475569', bg: '#F1F5F9' };
      default:
        return { label: status, color: '#475569', bg: '#F1F5F9' };
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* 🌟 Top Greeting Card */}
      <View style={styles.greetingCard}>
        <View style={styles.greetingTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingName}>Hi {studentName},</Text>
            <Text style={styles.greetingSub}>
              {studentYear} • {dateString}
            </Text>
          </View>
          <View style={styles.weatherBadge}>
            <Text style={styles.weatherIcon}>⛅</Text>
            <View style={{ marginLeft: 4 }}>
              <Text style={styles.weatherTemp}>32° C</Text>
              <Text style={styles.weatherSub}>Campus</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <TouchableOpacity
          style={styles.viewScheduleRow}
          onPress={() => setScheduleModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.viewScheduleText}>
            {yearConfig.category}: Drop {yearConfig.dropoffDay} → Collect {yearConfig.pickupDay}
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#0284C7" />
        </TouchableOpacity>
      </View>

      {/* 📌 ESSENTIALS SECTION (2x2 Grid of Curated Cards) */}
      <Text style={styles.sectionHeader}>ESSENTIALS</Text>

      <View style={styles.essentialsGrid}>
        {/* Card 1: Active Laundry (Warm Sunset Coral) */}
        <TouchableOpacity
          style={[styles.pastelCard, styles.pastelSunset]}
          onPress={() => {
            if (primaryActive) {
              onSelectBooking(primaryActive.id);
            } else {
              setScheduleModalVisible(true);
            }
          }}
          activeOpacity={0.85}
        >
          <View style={[styles.iconBox, { backgroundColor: '#EA580C' }]}>
            <Ionicons name="water" size={20} color="#FFF" />
          </View>

          <Text style={styles.cardMainTitle}>Active Laundry</Text>

          <View style={styles.cardMetricRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardMetricLabel}>Status</Text>
              <Text style={[styles.cardMetricVal, { color: '#9A3412' }]} numberOfLines={1}>
                {primaryActive ? getStatusInfo(primaryActive.status).label : 'No Active Bag'}
              </Text>
            </View>
            <Ionicons name="sync-outline" size={16} color="#EA580C" />
          </View>

          <Text style={styles.cardFooterSub} numberOfLines={1}>
            {primaryActive
              ? `Token #${primaryActive.pickup_token} • ${primaryActive.total_items} clothes`
              : `Next Slot: ${yearConfig.dropoffDay}`}
          </Text>
        </TouchableOpacity>

        {/* Card 2: Wash History (Fresh Matcha Emerald) */}
        <TouchableOpacity
          style={[styles.pastelCard, styles.pastelMatcha]}
          onPress={() => {
            if (onNavigateToHistory) {
              onNavigateToHistory();
            } else if (studentBookings.length > 0) {
              onSelectBooking(studentBookings[0].id);
            } else {
              setScheduleModalVisible(true);
            }
          }}
          activeOpacity={0.85}
        >
          <View style={[styles.iconBox, { backgroundColor: '#16A34A' }]}>
            <Ionicons name="time" size={20} color="#FFF" />
          </View>

          <Text style={styles.cardMainTitle}>Wash History</Text>

          <View style={styles.cardMetricRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardMetricLabel}>Total Washes</Text>
              <Text style={[styles.cardMetricVal, { color: '#166534' }]}>
                {completedBookings.length} Completed
              </Text>
            </View>
            <Ionicons name="receipt-outline" size={16} color="#16A34A" />
          </View>

          <Text style={styles.cardFooterSub}>
            {studentBookings.length} total wash requests
          </Text>
        </TouchableOpacity>

        {/* Card 3: Book Laundry Slot (Royal Iris Violet) */}
        <TouchableOpacity
          style={[styles.pastelCard, styles.pastelViolet]}
          onPress={onNavigateToNewBooking}
          activeOpacity={0.85}
        >
          <View style={[styles.iconBox, { backgroundColor: '#7C3AED' }]}>
            <Ionicons name="bag-add" size={20} color="#FFF" />
          </View>

          <Text style={styles.cardMainTitle}>Book Slot</Text>

          <View style={styles.cardMetricRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardMetricLabel}>Capacity</Text>
              <Text style={[styles.cardMetricVal, { color: '#5B21B6' }]}>Unlimited Wash</Text>
            </View>
            <Ionicons name="add-circle" size={18} color="#7C3AED" />
          </View>

          <Text style={styles.cardFooterSub}>
            Drop: {yearConfig.dropoffDay} • Pick: {yearConfig.pickupDay}
          </Text>
        </TouchableOpacity>

        {/* Card 4: Pickup Tokens (Sky Blue / Aqua) */}
        <TouchableOpacity
          style={[styles.pastelCard, styles.pastelSky]}
          onPress={() => {
            if (readyBookings.length > 0) {
              setSelectedTokenBooking(readyBookings[0]);
            } else if (studentBookings.length > 0) {
              setSelectedTokenBooking(studentBookings[0]);
            } else {
              setScheduleModalVisible(true);
            }
          }}
          activeOpacity={0.85}
        >
          <View style={[styles.iconBox, { backgroundColor: '#0284C7' }]}>
            <Ionicons name="qr-code" size={20} color="#FFF" />
          </View>

          <Text style={styles.cardMainTitle}>Pickup Tokens</Text>

          <View style={styles.cardMetricRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardMetricLabel}>Pass Token</Text>
              <Text style={styles.cardMetricVal} numberOfLines={1}>
                {primaryActive ? `#${primaryActive.pickup_token}` : 'Ready at Desk'}
              </Text>
            </View>
            <Ionicons name="shield-checkmark-outline" size={16} color="#0E7490" />
          </View>

          <Text style={styles.cardFooterSub}>
            {readyBookings.length > 0 ? '✨ 1 Bag Ready!' : 'Present at counter'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 🛠️ TOOLS SECTION */}
      <Text style={styles.sectionHeader}>TOOLS & GUIDELINES</Text>

      <View style={styles.toolsGrid}>
        <TouchableOpacity
          style={styles.toolCard}
          onPress={() => setScheduleModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={[styles.toolIconWrap, { backgroundColor: '#EDE9FE' }]}>
            <Ionicons name="calendar" size={22} color="#7C3AED" />
          </View>
          <Text style={styles.toolTitle}>Year Slot Matrix</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolCard}
          onPress={() => setRulesModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={[styles.toolIconWrap, { backgroundColor: '#FFE4E6' }]}>
            <Ionicons name="star" size={22} color="#E11D48" />
          </View>
          <Text style={styles.toolTitle}>Hostel Guidelines</Text>
        </TouchableOpacity>
      </View>

      {/* Pickup Token Modal */}
      <PickupTokenModal
        visible={!!selectedTokenBooking}
        booking={selectedTokenBooking}
        onClose={() => setSelectedTokenBooking(null)}
      />

      {/* Year Schedule Matrix Modal */}
      <Modal
        visible={scheduleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setScheduleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hostel Laundry Schedule</Text>
              <TouchableOpacity onPress={() => setScheduleModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {[
                { title: '1st Year B.Tech (AP, TS, KA, TN, KL, RJ, PB)', drop: 'Friday', pick: 'Monday', color: '#2563EB', key: '1st' },
                { title: '2nd B.Tech & 1st Year Diploma', drop: 'Saturday', pick: 'Tuesday', color: '#0284C7', key: '2nd' },
                { title: '3rd & 4th Year B.Tech, MBA, MCA', drop: 'Monday', pick: 'Wednesday', color: '#7C3AED', key: '3rd' },
                { title: 'Nepal, Andaman, South Africa, Dip 2, Nursing, Pharmacy, BBT', drop: 'Tuesday', pick: 'Thursday', color: '#059669', key: 'nepal' },
                { title: 'Bihar State Batch', drop: 'Wednesday', pick: 'Friday', color: '#D97706', key: 'bihar' },
                { title: 'Girls Hostel (All Branches & Years)', drop: 'Tuesday', pick: 'Friday', color: '#DB2777', key: 'girls' },
              ].map((item, idx) => {
                const isCurrent = yearConfig.dropoffDay === item.drop && yearConfig.pickupDay === item.pick;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.scheduleRosterCard,
                      isCurrent && styles.scheduleRosterCardActive,
                    ]}
                  >
                    <View style={styles.scheduleRosterHeader}>
                      <Text
                        style={[
                          styles.scheduleRosterYear,
                          isCurrent && { color: item.color, fontWeight: '800' },
                        ]}
                      >
                        {item.title}
                      </Text>
                      {isCurrent && (
                        <View style={[styles.yourScheduleBadge, { backgroundColor: item.color }]}>
                          <Text style={[styles.yourScheduleBadgeText, { color: '#FFF' }]}>Your Batch</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.scheduleRosterDays}>
                      Drop: <Text style={{ fontWeight: '800', color: '#0F172A' }}>{item.drop}</Text> • Collect: <Text style={{ fontWeight: '800', color: '#0F172A' }}>{item.pick}</Text>
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Rules Modal */}
      <Modal
        visible={rulesModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRulesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Laundry Rules & Guidelines</Text>
              <TouchableOpacity onPress={() => setRulesModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              <View style={styles.ruleItem}>
                <Ionicons name="checkmark-circle" size={18} color="#059669" />
                <Text style={styles.ruleText}>No item limit on clothes per intake.</Text>
              </View>
              <View style={styles.ruleItem}>
                <Ionicons name="checkmark-circle" size={18} color="#059669" />
                <Text style={styles.ruleText}>Tag your clothes with your Roll Number.</Text>
              </View>
              <View style={styles.ruleItem}>
                <Ionicons name="checkmark-circle" size={18} color="#059669" />
                <Text style={styles.ruleText}>Collect clothes within 24 hours of completion.</Text>
              </View>
            </ScrollView>
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
    paddingBottom: 40,
  },
  greetingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  greetingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  greetingSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  weatherIcon: {
    fontSize: 16,
  },
  weatherTemp: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#334155',
  },
  weatherSub: {
    fontSize: 8.5,
    color: '#64748B',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  viewScheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewScheduleText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0284C7',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  essentialsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  pastelCard: {
    width: '48%',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    minHeight: 145,
    justifyContent: 'space-between',
  },
  pastelSunset: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FFEDD5',
  },
  pastelMatcha: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  pastelViolet: {
    backgroundColor: '#FAF5FF',
    borderColor: '#F3E8FF',
  },
  pastelSky: {
    backgroundColor: '#F0F9FF',
    borderColor: '#E0F2FE',
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  cardMainTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  cardMetricLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  cardMetricVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardFooterSub: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  usageContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  usageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#4338CA',
  },
  usageStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  usageStatBox: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  usageStatNum: {
    fontSize: 18,
    fontWeight: '900',
  },
  usageStatLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
  },
  usageStatSub: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 1,
  },
  activityTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    gap: 4,
    marginBottom: 12,
  },
  activityTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 7,
  },
  activityTabActive: {
    backgroundColor: '#FFFFFF',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  activityTabText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
  },
  activityTabTextActive: {
    color: '#4338CA',
  },
  activityList: {
    gap: 8,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activityCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityDate: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  activityToken: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#4338CA',
  },
  activityItems: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  activityStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activityStatusText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  emptyActivityCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyActivityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginTop: 6,
  },
  emptyActivitySub: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
  },
  toolsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  toolCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  toolIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  toolTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  scheduleRosterCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scheduleRosterCardActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  scheduleRosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  scheduleRosterYear: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  yourScheduleBadge: {
    backgroundColor: '#4338CA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  yourScheduleBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  scheduleRosterDays: {
    fontSize: 12,
    color: '#64748B',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  ruleText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
});

export default StudentHomeScreen;
