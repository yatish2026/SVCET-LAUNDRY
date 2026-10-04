import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../constants/theme';
import { getStudentSchedule } from '../../constants/schedule';
import { useAuth } from '../../context/AuthContext';
import { useLaundry } from '../../context/LaundryContext';
import PickupTokenModal from '../../components/PickupTokenModal';
import RaiseTicketModal from '../../components/RaiseTicketModal';
import StatusBadge from '../../components/StatusBadge';

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
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  const rawName = profile?.full_name || profile?.email?.split('@')[0] || 'Student';
  const studentFirstName = rawName.split(' ')[0] || 'Student';
  const studentYear = profile?.academic_year || '1st Year B.Tech';
  const yearConfig = useMemo(() => getStudentSchedule(profile), [profile]);

  // Current Date formatting
  const today = new Date();
  const nextCollectionDateStr = `${yearConfig.dropoffDay}, ${today.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}`;

  const studentEmail = (profile?.email || '').trim().toLowerCase();
  const studentRollNo = (profile?.student_id || '').trim().toLowerCase();
  const cleanStudentPhone = (profile?.phone_number || '').replace(/[^0-9]/g, '');

  const studentBookings = useMemo(() => {
    return bookings.filter((b) => {
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* 🌿 1. TOP HERO GREETING SECTION */}
      <View style={styles.heroSection}>
        <View style={styles.heroTextContainer}>
          <Text style={styles.greetingTitle}>Hi {studentFirstName},</Text>
          <Text style={styles.greetingSubtitle}>Fresh clothes,{"\n"}bright days!</Text>
        </View>

        {/* Botanical Organic Illustration Badge */}
        <View style={styles.heroDecorWrapper}>
          <View style={styles.leafCircle}>
            <Ionicons name="leaf" size={26} color="#0D9488" />
          </View>
        </View>
      </View>

      {/* 📅 2. NEXT COLLECTION CAPSULE PILL */}
      <TouchableOpacity
        style={styles.collectionPillCard}
        onPress={() => setScheduleModalVisible(true)}
        activeOpacity={0.85}
      >
        <View style={styles.collectionLeftBox}>
          <View style={styles.calendarIconBox}>
            <Ionicons name="calendar" size={20} color="#0F4C5C" />
          </View>
          <View style={styles.collectionTextWrap}>
            <Text style={styles.collectionSubLabel}>Next Collection</Text>
            <Text style={styles.collectionDateText}>{nextCollectionDateStr}</Text>
          </View>
        </View>

        <View style={styles.arrowCircle}>
          <Ionicons name="arrow-forward" size={18} color="#0F4C5C" />
        </View>
      </TouchableOpacity>

      {/* 🌟 3. MAIN SERVICES SECTION (2x2 Organic Pastel Wave Grid) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Main Services</Text>
      </View>

      <View style={styles.servicesGrid}>
        {/* Card 1: Book a Slot (Soft Pastel Ice Blue) */}
        <TouchableOpacity
          style={[styles.serviceCard, styles.cardIceBlue]}
          onPress={onNavigateToNewBooking}
          activeOpacity={0.85}
        >
          <View style={[styles.serviceIconCircle, { backgroundColor: '#BAE6FD' }]}>
            <Ionicons name="calendar" size={22} color="#0284C7" />
          </View>
          <Text style={styles.serviceCardTitle}>Book a Slot</Text>
          <Text style={styles.serviceCardSub}>Schedule pickup</Text>
        </TouchableOpacity>

        {/* Card 2: Pickup Tokens (Soft Pastel Sunset Peach) */}
        <TouchableOpacity
          style={[styles.serviceCard, styles.cardSunsetPeach]}
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
          <View style={[styles.serviceIconCircle, { backgroundColor: '#FED7AA' }]}>
            <Ionicons name="qr-code" size={22} color="#EA580C" />
          </View>
          <Text style={styles.serviceCardTitle}>Pickup Tokens</Text>
          <Text style={styles.serviceCardSub}>Get token</Text>
        </TouchableOpacity>

        {/* Card 3: Wash History (Soft Pastel Fresh Mint) */}
        <TouchableOpacity
          style={[styles.serviceCard, styles.cardFreshMint]}
          onPress={onNavigateToHistory}
          activeOpacity={0.85}
        >
          <View style={[styles.serviceIconCircle, { backgroundColor: '#BBF7D0' }]}>
            <Ionicons name="time" size={22} color="#16A34A" />
          </View>
          <Text style={styles.serviceCardTitle}>Wash History</Text>
          <Text style={styles.serviceCardSub}>View requests</Text>
        </TouchableOpacity>

        {/* Card 4: Help & Support (Soft Pastel Blush Pink) */}
        <TouchableOpacity
          style={[styles.serviceCard, styles.cardBlushPink]}
          onPress={() => setHelpModalVisible(true)}
          activeOpacity={0.85}
        >
          <View style={[styles.serviceIconCircle, { backgroundColor: '#FECDD3' }]}>
            <Ionicons name="headset" size={22} color="#E11D48" />
          </View>
          <Text style={styles.serviceCardTitle}>Help & Support</Text>
          <Text style={styles.serviceCardSub}>We're here for you</Text>
        </TouchableOpacity>
      </View>

      {/* 🧺 4. ACTIVE ORDER SPOTLIGHT (If currently in progress) */}
      {primaryActive && (
        <View style={styles.activeOrderSpotlight}>
          <View style={styles.activeOrderTop}>
            <View>
              <Text style={styles.activeOrderLabel}>CURRENT ACTIVE LAUNDRY</Text>
              <Text style={styles.activeOrderToken}>Token #{primaryActive.pickup_token}</Text>
            </View>
            <StatusBadge status={primaryActive.status} size="sm" />
          </View>

          <View style={styles.activeOrderDetailsRow}>
            <Text style={styles.activeOrderClothesText}>
              🧺 {primaryActive.total_items} Clothes in Wash Cycle
            </Text>
            <TouchableOpacity
              style={styles.viewTokenBtn}
              onPress={() => setSelectedTokenBooking(primaryActive)}
              activeOpacity={0.8}
            >
              <Ionicons name="qr-code" size={14} color="#FFF" />
              <Text style={styles.viewTokenBtnText}>Show QR</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 🛠️ 5. QUICK CAMPUS TOOLS */}
      <View style={styles.quickToolsRow}>
        <TouchableOpacity
          style={styles.quickToolBtn}
          onPress={() => setScheduleModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={18} color="#0F4C5C" />
          <Text style={styles.quickToolText}>Year Slot Matrix</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickToolBtn}
          onPress={() => setRulesModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="shield-checkmark-outline" size={18} color="#0F4C5C" />
          <Text style={styles.quickToolText}>Hostel Guidelines</Text>
        </TouchableOpacity>
      </View>

      {/* 📱 Pickup Token Modal */}
      <PickupTokenModal
        visible={!!selectedTokenBooking}
        booking={selectedTokenBooking}
        onClose={() => setSelectedTokenBooking(null)}
      />

      {/* 🎫 Raise Ticket / Help & Support Modal */}
      <RaiseTicketModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
      />

      {/* 📅 Year Schedule Matrix Modal */}
      <Modal
        visible={scheduleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setScheduleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setScheduleModalVisible(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hostel Laundry Schedule</Text>
              <TouchableOpacity onPress={() => setScheduleModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {[
                { title: 'Monday: B.Tech 1st Year & B.Tech 2nd Year', drop: 'Monday', pick: 'Wednesday', color: '#0284C7' },
                { title: 'Tuesday: B.Tech 3rd Year & B.Tech 4th Year (MBA, MCA)', drop: 'Tuesday', pick: 'Thursday', color: '#7C3AED' },
                { title: 'Wednesday: Diploma 1st & 2nd Year (Nursing, Pharmacy, BBT)', drop: 'Wednesday', pick: 'Friday', color: '#0D9488' },
                { title: 'Thursday: Girls Hostel (All Branches & Years)', drop: 'Thursday', pick: 'Saturday', color: '#E11D48' },
                { title: 'Friday: Nepal, Andaman, South Africa, Other States & International', drop: 'Friday', pick: 'Monday', color: '#059669' },
                { title: 'Saturday: Bihar State Batch (Get on Tuesday)', drop: 'Saturday', pick: 'Tuesday', color: '#EA580C' },
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

      {/* 📜 Rules Modal */}
      <Modal
        visible={rulesModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRulesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setRulesModalVisible(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Laundry Rules & Guidelines</Text>
              <TouchableOpacity onPress={() => setRulesModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              <View style={styles.ruleItem}>
                <Ionicons name="checkmark-circle" size={18} color="#0D9488" />
                <Text style={styles.ruleText}>No item limit on clothes per student intake.</Text>
              </View>
              <View style={styles.ruleItem}>
                <Ionicons name="checkmark-circle" size={18} color="#0D9488" />
                <Text style={styles.ruleText}>Tag your laundry bag with your Roll Number & Room.</Text>
              </View>
              <View style={styles.ruleItem}>
                <Ionicons name="checkmark-circle" size={18} color="#0D9488" />
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
    backgroundColor: '#F6FAF9',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 110,
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    marginBottom: 10,
  },
  heroTextContainer: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F4C5C',
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif',
    letterSpacing: -0.5,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
    marginTop: 4,
    lineHeight: 20,
  },
  heroDecorWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  leafCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E6F4F7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BEE3EA',
  },
  collectionPillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 26,
    ...Platform.select({
      ios: {
        shadowColor: '#0F4C5C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 16px rgba(15, 76, 92, 0.06)',
      },
    }),
  },
  collectionLeftBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calendarIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E6F4F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectionTextWrap: {
    justifyContent: 'center',
  },
  collectionSubLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  collectionDateText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
    marginBottom: 24,
  },
  serviceCard: {
    width: '48%',
    borderRadius: 28, // Organic fluid squircle shape
    padding: 18,
    minHeight: 140,
    justifyContent: 'space-between',
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 3px 12px rgba(0,0,0,0.04)',
      },
    }),
  },
  cardIceBlue: {
    backgroundColor: '#E8F5FD',
    borderColor: '#BAE6FD',
  },
  cardSunsetPeach: {
    backgroundColor: '#FFF2E8',
    borderColor: '#FED7AA',
  },
  cardFreshMint: {
    backgroundColor: '#EBF8F2',
    borderColor: '#BBF7D0',
  },
  cardBlushPink: {
    backgroundColor: '#FFF0F3',
    borderColor: '#FECDD3',
  },
  serviceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  serviceCardTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  serviceCardSub: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  activeOrderSpotlight: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      },
    }),
  },
  activeOrderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  activeOrderLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D9488',
    letterSpacing: 0.8,
  },
  activeOrderToken: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  activeOrderDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  activeOrderClothesText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  viewTokenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F4C5C',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 5,
  },
  viewTokenBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  quickToolsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickToolBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  quickToolText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F4C5C',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
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
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scheduleRosterCardActive: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
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
    backgroundColor: '#0D9488',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  yourScheduleBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  scheduleRosterDays: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  ruleText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
});

export default StudentHomeScreen;
