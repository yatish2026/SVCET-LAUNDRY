import React, { useState } from 'react';
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
import { getYearConfig, ACADEMIC_YEARS } from '../../constants/schedule';
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
  const studentYear = profile?.academic_year || '1st Year';
  const yearConfig = getYearConfig(studentYear);

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

  const studentBookings = bookings.filter((b) => {
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

  const getStatusLabel = (status) => {
    switch (status) {
      case 'in_wash':
        return 'In Washing Machine';
      case 'drying_ironing':
        return 'Drying & Ironing';
      case 'ready_for_pickup':
        return 'Ready for Pickup';
      case 'dropoff_scheduled':
      case 'pending_approval':
        return 'Drop-Off Scheduled';
      default:
        return 'No Active Wash';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* 🌟 Top Greeting Card (Exact reference design) */}
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
            View {studentYear} Wash Schedule ({yearConfig.dropoffDay} Drop-off)
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#0284C7" />
        </TouchableOpacity>
      </View>

      {/* 📌 ESSENTIALS SECTION (2x2 Grid of Curated Squircles) */}
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
                {primaryActive ? getStatusLabel(primaryActive.status) : 'No Active Bag'}
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
              <Text style={styles.cardMetricLabel}>Assigned Day</Text>
              <Text style={[styles.cardMetricVal, { color: '#6B21A8' }]}>{yearConfig.dropoffDay}</Text>
            </View>
            <Ionicons name="calendar-outline" size={16} color="#7C3AED" />
          </View>

          <Text style={styles.cardFooterSub}>Pickup: {yearConfig.pickupDay} (+2 days)</Text>
        </TouchableOpacity>

        {/* Card 4: Pickup Tokens (Ocean Azure Sky) */}
        <TouchableOpacity
          style={[styles.pastelCard, styles.pastelAzure]}
          onPress={() => {
            if (readyBookings.length > 0) {
              setSelectedTokenBooking(readyBookings[0]);
            } else if (primaryActive) {
              setSelectedTokenBooking(primaryActive);
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

      {/* 🛠️ TOOLS SECTION (2 Rounded White Shortcut Cards) */}
      <Text style={styles.sectionHeader}>TOOLS</Text>

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

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              {ACADEMIC_YEARS.map((yr) => {
                const cfg = getYearConfig(yr);
                const isStudentYear = studentYear === yr;
                return (
                  <View
                    key={yr}
                    style={[
                      styles.scheduleRosterCard,
                      isStudentYear && styles.scheduleRosterCardActive,
                    ]}
                  >
                    <View style={styles.rosterTop}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.rosterYearName}>{yr}</Text>
                        {isStudentYear && (
                          <View style={styles.youBadge}>
                            <Text style={styles.youBadgeText}>YOUR YEAR</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.rosterDaysText}>
                        🗓️ {cfg.dropoffDay} $\rightarrow$ {cfg.pickupDay}
                      </Text>
                    </View>
                    <Text style={styles.rosterSub}>
                      Drop clothes every {cfg.dropoffDay} • Guaranteed collection on {cfg.pickupDay} (after 2 days).
                    </Text>
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setScheduleModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>Close Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Hostel Guidelines Modal */}
      <Modal
        visible={rulesModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRulesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hostel Laundry Rules</Text>
              <TouchableOpacity onPress={() => setRulesModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.guidelineItem}>
              <Ionicons name="shirt-outline" size={18} color="#2563EB" />
              <Text style={styles.guidelineText}>
                Maximum 20 items per student load.
              </Text>
            </View>

            <View style={styles.guidelineItem}>
              <Ionicons name="calendar-outline" size={18} color="#2563EB" />
              <Text style={styles.guidelineText}>
                Drop clothes on your allocated year day (1st: Mon, 2nd: Tue, 3rd: Wed, 4th: Fri).
              </Text>
            </View>

            <View style={styles.guidelineItem}>
              <Ionicons name="gift-outline" size={18} color="#059669" />
              <Text style={styles.guidelineText}>
                Collect clean laundry after 2 days by presenting your in-app Pickup Token.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setRulesModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>Got It</Text>
            </TouchableOpacity>
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
    borderRadius: 32, // ✨ Ultra-smooth rounded greeting card
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    overflow: 'hidden',
    ...THEME.shadows.md,
  },
  greetingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  greetingName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  greetingSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  weatherIcon: {
    fontSize: 18,
  },
  weatherTemp: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  weatherSub: {
    fontSize: 8,
    color: '#64748B',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 6,
  },
  viewScheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  viewScheduleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '900',
    color: '#334155',
    letterSpacing: 1,
    marginBottom: 14,
    marginTop: 4,
  },
  essentialsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 24,
  },
  pastelCard: {
    width: '47.5%',
    borderRadius: 38, // 🌟 Dramatic curved squircle edges
    padding: 18,
    minHeight: 160,
    justifyContent: 'space-between',
    borderWidth: 1.5,
    overflow: 'hidden',
    ...THEME.shadows.md,
  },
  pastelSunset: {
    backgroundColor: '#FFEAD5', // Rich Warm Sunset Peach / Coral
    borderColor: '#FDBA74',
  },
  pastelMatcha: {
    backgroundColor: '#DCFCE7', // Rich Crisp Matcha Mint
    borderColor: '#86EFAC',
  },
  pastelViolet: {
    backgroundColor: '#F3E8FF', // Rich Royal Iris Lilac
    borderColor: '#D8B4FE',
  },
  pastelAzure: {
    backgroundColor: '#E0F2FE', // Rich Ocean Sky Azure
    borderColor: '#7DD3FC',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22, // Full round circle/pill badge
    alignItems: 'center',
    justifyContent: 'center',
    ...THEME.shadows.sm,
  },
  cardMainTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 8,
  },
  cardMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cardMetricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  cardMetricVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  cardFooterSub: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  toolsGrid: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  toolCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 32, // 🌟 Distinct curved tool box
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...THEME.shadows.md,
  },
  toolIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26, // Round bubble
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  toolTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  scheduleRosterCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scheduleRosterCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  rosterTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  rosterYearName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  youBadge: {
    backgroundColor: '#1E40AF',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  youBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFF',
  },
  rosterDaysText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  rosterSub: {
    fontSize: 10,
    color: '#475569',
    lineHeight: 14,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  guidelineText: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
    lineHeight: 16,
  },
  modalCloseBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default StudentHomeScreen;
