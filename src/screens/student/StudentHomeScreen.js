import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  Image,
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
import WavyServiceCard from '../../components/WavyServiceCard';
import LaundryBasketHero from '../../components/LaundryBasketHero';

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

  // Next date that falls on the student's drop-off weekday (today if it matches)
  const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const nextCollectionDate = new Date();
  const dropoffDayIndex = WEEKDAYS.indexOf(yearConfig.dropoffDay);
  if (dropoffDayIndex >= 0) {
    nextCollectionDate.setDate(
      nextCollectionDate.getDate() + ((dropoffDayIndex - nextCollectionDate.getDay() + 7) % 7)
    );
  }
  const nextCollectionDateStr = `${yearConfig.dropoffDay}, ${nextCollectionDate.toLocaleDateString('en-US', {
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

        {/* 🧺 Cute Laundry Basket Illustration (Replaces leaf badge) */}
        <View style={styles.heroDecorWrapper}>
          <LaundryBasketHero size={90} />
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

      {/* 🌊 3. MAIN SERVICES SECTION (Authentic Organic Fluid Wavy Cards) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Main Services</Text>
      </View>

      <View style={styles.servicesGrid}>
        {/* Card 1: Book a Slot (Vibrant Soft Ice Blue Wave) */}
        <WavyServiceCard
          title="Book a Slot"
          subtitle="Schedule pickup"
          icon="calendar-outline"
          iconColor="#0F4C5C"
          colorTheme="iceBlue"
          variant={1}
          onPress={onNavigateToNewBooking}
        />

        {/* Card 2: Pickup Tokens (Warm Soft Sunset Peach Wave) */}
        <WavyServiceCard
          title="Pickup Tokens"
          subtitle="Get token"
          icon="qr-code-outline"
          iconColor="#C2410C"
          colorTheme="sunsetPeach"
          variant={2}
          onPress={() => {
            if (readyBookings.length > 0) {
              setSelectedTokenBooking(readyBookings[0]);
            } else if (studentBookings.length > 0) {
              setSelectedTokenBooking(studentBookings[0]);
            } else {
              setScheduleModalVisible(true);
            }
          }}
        />

        {/* Card 3: Wash History (Crisp Soft Fresh Mint Wave) */}
        <WavyServiceCard
          title="Wash History"
          subtitle="View requests"
          icon="time-outline"
          iconColor="#059669"
          colorTheme="freshMint"
          variant={3}
          onPress={onNavigateToHistory}
        />

        {/* Card 4: Help & Support (Delicate Soft Blush Pink Wave) */}
        <WavyServiceCard
          title="Help & Support"
          subtitle="We're here for you"
          icon="headset-outline"
          iconColor="#E11D48"
          colorTheme="blushPink"
          variant={4}
          onPress={() => setHelpModalVisible(true)}
        />
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
    paddingVertical: 10,
    marginBottom: 10,
  },
  greetingTitle: {
    fontSize: 36,
    color: '#0F4C5C',
    fontFamily: Platform.select({
      ios: 'Caveat_700Bold',
      android: 'Caveat_700Bold',
      web: 'Caveat, "Dancing Script", "Segoe Print", cursive, sans-serif',
      default: 'Caveat_700Bold',
    }),
    letterSpacing: -0.3,
    lineHeight: 40,
    ...Platform.select({
      web: {
        fontWeight: '700',
      },
      default: {},
    }),
  },
  greetingSubtitle: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
    marginTop: 3,
    lineHeight: 20,
  },
  heroDecorWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  heroBasketImage: {
    width: 95,
    height: 95,
  },
  collectionPillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 24,
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
    marginBottom: 14,
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
    rowGap: 12,
    marginBottom: 20,
  },
  serviceCard: {
    width: '48%',
    paddingVertical: 18,
    paddingHorizontal: 16,
    minHeight: 128,
    justifyContent: 'space-between',
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#0F4C5C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 4px 14px rgba(15, 76, 92, 0.05)',
      },
    }),
  },
  squircle1: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 36,
    borderBottomLeftRadius: 22,
  },
  squircle2: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 36,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 36,
  },
  squircle3: {
    borderTopLeftRadius: 34,
    borderTopRightRadius: 22,
    borderBottomRightRadius: 36,
    borderBottomLeftRadius: 20,
  },
  squircle4: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 36,
    borderBottomRightRadius: 22,
    borderBottomLeftRadius: 34,
  },
  cardIceBlue: {
    backgroundColor: '#EBF6FC',
    borderColor: '#D4ECFA',
  },
  cardSunsetPeach: {
    backgroundColor: '#FFF4EB',
    borderColor: '#FFE4D2',
  },
  cardFreshMint: {
    backgroundColor: '#ECFBF3',
    borderColor: '#D2F5E2',
  },
  cardBlushPink: {
    backgroundColor: '#FFF1F4',
    borderColor: '#FFE3E9',
  },
  cardIconDirectWrap: {
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  cardTextContent: {
    justifyContent: 'flex-end',
  },
  serviceCardTitle: {
    fontSize: 15,
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
