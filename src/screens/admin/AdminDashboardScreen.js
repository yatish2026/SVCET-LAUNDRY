import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../constants/theme';
import { useLaundry } from '../../context/LaundryContext';
import { useAuth } from '../../context/AuthContext';
import { ACADEMIC_YEARS, getYearConfig } from '../../constants/schedule';
import QRScannerModal from '../../components/QRScannerModal';
import WavyServiceCard from '../../components/WavyServiceCard';
import LaundryBasketHero from '../../components/LaundryBasketHero';

export const AdminDashboardScreen = ({
  onNavigateToApprovals,
  onNavigateToSubmissions,
  onNavigateToReports,
}) => {
  const { profile } = useAuth();
  const {
    bookings,
    grandTotalClothes,
    yearWiseStats,
    tickets = [],
    updateTicketStatus,
    deleteTicket,
    refreshData,
  } = useLaundry();

  const [refreshing, setRefreshing] = React.useState(false);
  const [showQRScanner, setShowQRScanner] = React.useState(false);
  const [showYearModal, setShowYearModal] = React.useState(false);
  const [selectedTicket, setSelectedTicket] = React.useState(null);
  const [ticketFilter, setTicketFilter] = React.useState('all'); // 'all' | 'open' | 'resolved'

  const handleDeleteTicket = (ticketId, title) => {
    const doDelete = async () => {
      try {
        await deleteTicket(ticketId);
        setSelectedTicket(null);
        if (Platform.OS === 'web') {
          window.alert('🗑️ Complaint ticket removed.');
        } else {
          Alert.alert('Deleted', 'Complaint ticket has been removed.');
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to delete complaint ticket.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete this student complaint?\n\n"${title || 'Ticket'}"`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Delete Complaint',
        `Are you sure you want to permanently delete "${title || 'this complaint'}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const staffName = profile?.full_name || 'Staff Admin';
  const pendingCount = bookings.filter(
    (b) => b.status === 'pending_approval' || b.status === 'dropoff_scheduled'
  ).length;

  const activeCount = bookings.filter(
    (b) => b.status !== 'completed' && b.status !== 'cancelled'
  ).length;

  const readyCount = bookings.filter((b) => b.status === 'ready_for_pickup').length;
  const openTicketsCount = (tickets || []).filter((t) => t.status !== 'resolved').length;

  const filteredTickets = (tickets || []).filter((t) => {
    if (ticketFilter === 'open') return t.status !== 'resolved';
    if (ticketFilter === 'resolved') return t.status === 'resolved';
    return true;
  });

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

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
          <Text style={styles.greetingTitle}>Hi {staffName.split(' ')[0]},</Text>
          <Text style={styles.greetingSubtitle}>Clean campus,{"\n"}smooth flow!</Text>
        </View>

        {/* 🧺 Cute Laundry Basket Illustration (Replaces leaf badge) */}
        <View style={styles.heroDecorWrapper}>
          <LaundryBasketHero size={90} />
        </View>
      </View>

      {/* 📷 2. SCAN QR CAPSULE PILL */}
      <TouchableOpacity
        style={styles.collectionPillCard}
        onPress={() => setShowQRScanner(true)}
        activeOpacity={0.85}
      >
        <View style={styles.collectionLeftBox}>
          <View style={styles.calendarIconBox}>
            <Ionicons name="qr-code" size={20} color="#0F4C5C" />
          </View>
          <View style={styles.collectionTextWrap}>
            <Text style={styles.collectionSubLabel}>Counter Scanner</Text>
            <Text style={styles.collectionDateText}>Scan Student Pickup QR</Text>
          </View>
        </View>

        <View style={styles.arrowCircle}>
          <Ionicons name="scan-outline" size={18} color="#0F4C5C" />
        </View>
      </TouchableOpacity>

      {/* 🌊 3. MAIN SERVICES SECTION (Authentic Organic Fluid Wavy Cards) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Main Services</Text>
      </View>

      <View style={styles.servicesGrid}>
        {/* Card 1: Review Approvals (Vibrant Soft Ice Blue Wave) */}
        <WavyServiceCard
          title="Approvals"
          subtitle={pendingCount > 0 ? `${pendingCount} Pending` : 'All caught up'}
          icon="checkmark-done-circle-outline"
          iconColor="#0F4C5C"
          colorTheme="iceBlue"
          variant={1}
          onPress={onNavigateToApprovals}
        />

        {/* Card 2: Student Submissions (Warm Soft Sunset Peach Wave) */}
        <WavyServiceCard
          title="Active Orders"
          subtitle={`${activeCount} In processing`}
          icon="list-outline"
          iconColor="#C2410C"
          colorTheme="sunsetPeach"
          variant={2}
          onPress={onNavigateToSubmissions}
        />

        {/* Card 3: Download Reports (Crisp Soft Fresh Mint Wave) */}
        <WavyServiceCard
          title="Excel Reports"
          subtitle="Audit & Census"
          icon="download-outline"
          iconColor="#059669"
          colorTheme="freshMint"
          variant={3}
          onPress={onNavigateToReports}
        />

        {/* Card 4: Campus Analytics (Delicate Soft Blush Pink Wave) */}
        <WavyServiceCard
          title="Batch Analytics"
          subtitle={`${grandTotalClothes} Total clothes`}
          icon="stats-chart-outline"
          iconColor="#E11D48"
          colorTheme="blushPink"
          variant={4}
          onPress={() => setShowYearModal(true)}
        />
      </View>

      {/* 📊 Compact College Year Breakdown Button Card */}
      <View style={styles.breakdownHeaderWrap}>
        <Text style={styles.sectionHeader}>COLLEGE YEAR & BATCH ANALYTICS</Text>
      </View>

      <TouchableOpacity
        style={styles.compactYearBreakdownCard}
        onPress={() => setShowYearModal(true)}
        activeOpacity={0.85}
      >
        <View style={styles.compactYearLeft}>
          <View style={styles.compactYearIconBox}>
            <Ionicons name="school" size={20} color="#4338CA" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Text style={styles.compactYearTitle}>Batch Breakdown</Text>
              <View style={styles.compactBatchBadge}>
                <Text style={styles.compactBatchBadgeText}>{ACADEMIC_YEARS.length} Batches</Text>
              </View>
            </View>
            <Text style={styles.compactYearSub}>
              Tap to view live clothes, students & schedule per year
            </Text>
          </View>
        </View>

        <View style={styles.compactYearRight}>
          <View style={styles.compactOpenBtn}>
            <Text style={styles.compactOpenBtnText}>Open</Text>
            <Ionicons name="chevron-forward" size={14} color="#4338CA" />
          </View>
        </View>
      </TouchableOpacity>

      {/* 🎫 STUDENT COMPLAINTS & TECHNICAL ISSUES HUB */}
      <View style={styles.complaintsHeaderRow}>
        <Text style={styles.sectionHeader}>STUDENT COMPLAINTS & ISSUES</Text>
        {openTicketsCount > 0 && (
          <View style={styles.openTicketsBadge}>
            <Text style={styles.openTicketsBadgeText}>{openTicketsCount} Unresolved</Text>
          </View>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.tktFilterRow}>
        {[
          { id: 'all', label: `All (${tickets.length})` },
          { id: 'open', label: `Open (${openTicketsCount})` },
          { id: 'resolved', label: `Resolved (${tickets.length - openTicketsCount})` },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tktFilterTab, ticketFilter === tab.id && styles.tktFilterTabActive]}
            onPress={() => setTicketFilter(tab.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tktFilterText, ticketFilter === tab.id && styles.tktFilterTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredTickets.length === 0 ? (
        <View style={styles.emptyTicketsBox}>
          <Ionicons name="checkmark-circle" size={36} color="#10B981" />
          <Text style={styles.emptyTicketsTitle}>
            {ticketFilter === 'open' ? 'No Open Complaints' : 'No Tickets Logged'}
          </Text>
          <Text style={styles.emptyTicketsSub}>
            All student laundry issues and app server complaints are resolved!
          </Text>
        </View>
      ) : (
        <View style={styles.ticketsList}>
          {filteredTickets.map((tkt) => {
            const isResolved = tkt.status === 'resolved';
            return (
              <TouchableOpacity
                key={tkt.id}
                style={[styles.ticketCard, isResolved && styles.ticketCardResolved]}
                onPress={() => setSelectedTicket(tkt)}
                activeOpacity={0.85}
              >
                <View style={styles.ticketCardTop}>
                  <View style={[styles.catBadge, { backgroundColor: isResolved ? '#DCFCE7' : '#FEF3C7' }]}>
                    <Text style={[styles.catBadgeText, { color: isResolved ? '#15803D' : '#D97706' }]}>
                      {tkt.category || 'Complaint'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.ticketDate}>
                      {new Date(tkt.created_at).toLocaleDateString()}
                    </Text>
                    <TouchableOpacity
                      style={styles.tktQuickDeleteBtn}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleDeleteTicket(tkt.id, tkt.title);
                      }}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.ticketTitle} numberOfLines={1}>
                  {tkt.title}
                </Text>
                <Text style={styles.ticketDesc} numberOfLines={2}>
                  {tkt.description}
                </Text>

                <View style={styles.ticketCardFooter}>
                  <View style={styles.studentMeta}>
                    <Ionicons name="person-outline" size={13} color="#64748B" />
                    <Text style={styles.studentMetaText}>
                      {tkt.student_name} • Room {tkt.room_number || 'N/A'} ({tkt.student_id || ''})
                    </Text>
                  </View>

                  {tkt.photo_uri && (
                    <View style={styles.hasPhotoPill}>
                      <Ionicons name="image" size={12} color="#4338CA" />
                      <Text style={styles.hasPhotoPillText}>Photo Attached</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* 📋 TICKET DETAIL & RESOLUTION MODAL */}
      <Modal
        visible={!!selectedTicket}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedTicket(null)}
      >
        <View style={styles.tktModalOverlay}>
          <TouchableOpacity
            style={styles.tktModalBackdrop}
            activeOpacity={1}
            onPress={() => setSelectedTicket(null)}
          />
          <View style={styles.tktModalSheet}>
            {selectedTicket && (
              <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ padding: 20 }}>
                {/* Modal Header */}
                <View style={styles.tktModalHeader}>
                  <View style={{ flex: 1 }}>
                    <View
                      style={[
                        styles.catBadge,
                        {
                          backgroundColor:
                            selectedTicket.status === 'resolved' ? '#DCFCE7' : '#FEF3C7',
                          alignSelf: 'flex-start',
                          marginBottom: 6,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.catBadgeText,
                          {
                            color:
                              selectedTicket.status === 'resolved' ? '#15803D' : '#D97706',
                          },
                        ]}
                      >
                        {selectedTicket.status === 'resolved' ? 'RESOLVED' : 'OPEN / IN REVIEW'}
                      </Text>
                    </View>
                    <Text style={styles.tktModalTitle}>{selectedTicket.title}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedTicket(null)} style={{ padding: 4 }}>
                    <Ionicons name="close-circle" size={26} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Student Info Box */}
                <View style={styles.tktStudentCard}>
                  <Text style={styles.tktStudentName}>{selectedTicket.student_name}</Text>
                  <Text style={styles.tktStudentSub}>
                    Roll No: {selectedTicket.student_id || 'N/A'} • Room:{' '}
                    {selectedTicket.room_number || 'N/A'} (
                    {selectedTicket.hostel_block || 'Hostel'})
                  </Text>
                  {selectedTicket.phone_number ? (
                    <Text style={styles.tktStudentPhone}>
                      📞 Contact Phone: {selectedTicket.phone_number}
                    </Text>
                  ) : null}
                  {selectedTicket.student_email ? (
                    <Text style={styles.tktStudentEmail}>
                      ✉️ Email: {selectedTicket.student_email}
                    </Text>
                  ) : null}
                </View>

                {/* Description */}
                <Text style={styles.tktDetailLabel}>Detailed Issue Explanation:</Text>
                <View style={styles.tktDescBox}>
                  <Text style={styles.tktDescFull}>{selectedTicket.description}</Text>
                </View>

                {/* Photo Preview if attached */}
                {selectedTicket.photo_uri && (
                  <View style={{ marginTop: 14 }}>
                    <Text style={styles.tktDetailLabel}>Attached Image / Proof:</Text>
                    <Image
                      source={{ uri: selectedTicket.photo_uri }}
                      style={styles.tktFullImage}
                      resizeMode="contain"
                    />
                  </View>
                )}

                {/* Resolution & Delete Actions */}
                <View style={styles.tktActionRow}>
                  {selectedTicket.status !== 'resolved' ? (
                    <TouchableOpacity
                      style={styles.resolveActionBtn}
                      onPress={async () => {
                        await updateTicketStatus(selectedTicket.id, 'resolved');
                        setSelectedTicket({ ...selectedTicket, status: 'resolved' });
                        if (Platform.OS === 'web') {
                          window.alert('✅ Issue Ticket Marked as Resolved!');
                        } else {
                          Alert.alert('Resolved', 'Ticket has been marked as resolved.');
                        }
                      }}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                      <Text style={styles.resolveActionBtnText}>Mark as Resolved</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.reopenActionBtn}
                      onPress={async () => {
                        await updateTicketStatus(selectedTicket.id, 'open');
                        setSelectedTicket({ ...selectedTicket, status: 'open' });
                      }}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="refresh" size={16} color="#4338CA" />
                      <Text style={styles.reopenActionBtnText}>Re-open Ticket</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.deleteTicketActionBtn}
                    onPress={() => handleDeleteTicket(selectedTicket.id, selectedTicket.title)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="trash-outline" size={17} color="#DC2626" />
                    <Text style={styles.deleteTicketActionBtnText}>Delete Complaint</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* 🎓 COLLEGE YEAR & BATCH BREAKDOWN POPUP MODAL */}
      <Modal
        visible={showYearModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowYearModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowYearModal(false)}
          />

          <View style={styles.yearModalSheet}>
            {/* Header */}
            <View style={styles.yearModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.compactYearIconBox}>
                  <Ionicons name="school" size={20} color="#4338CA" />
                </View>
                <View>
                  <Text style={styles.yearModalTitle}>College Year Breakdown</Text>
                  <Text style={styles.yearModalSubtitle}>Live Batch Analytics & Intake Days</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowYearModal(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Scrollable Year Cards */}
            <ScrollView
              style={styles.yearModalScroll}
              contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
              showsVerticalScrollIndicator={true}
            >
              {ACADEMIC_YEARS.map((yr) => {
                const stats = yearWiseStats[yr] || { totalClothes: 0, studentCount: 0, activeCount: 0 };
                const cfg = getYearConfig(yr);

                const getYearTheme = (yearName) => {
                  switch (yearName) {
                    case '1st Year':
                      return { bg: '#FFF7ED', border: '#FFEDD5', text: '#EA580C', icon: 'school' };
                    case '2nd Year':
                      return { bg: '#F0FDF4', border: '#DCFCE7', text: '#16A34A', icon: 'school-outline' };
                    case '3rd Year':
                      return { bg: '#FAF5FF', border: '#F3E8FF', text: '#7C3AED', icon: 'school' };
                    case '4th Year':
                      return { bg: '#F0F9FF', border: '#E0F2FE', text: '#0284C7', icon: 'school-outline' };
                    default:
                      return { bg: '#FFF7ED', border: '#FFEDD5', text: '#EA580C', icon: 'school' };
                  }
                };

                const theme = getYearTheme(yr);

                return (
                  <View
                    key={yr}
                    style={[
                      styles.yearCard,
                      { backgroundColor: theme.bg, borderColor: theme.border, marginBottom: 12 },
                    ]}
                  >
                    <View style={styles.yearHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name={theme.icon} size={18} color={theme.text} />
                        <Text style={[styles.yearTitle, { color: theme.text }]}>{yr}</Text>
                      </View>
                      <View style={[styles.dayPill, { backgroundColor: '#FFFFFF' }]}>
                        <Text style={[styles.dayPillText, { color: theme.text }]}>
                          {cfg.dropoffDay}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.yearStatsRow}>
                      <View style={styles.yearStatBlock}>
                        <Text style={styles.statNumber}>{stats.totalClothes}</Text>
                        <Text style={styles.statLabel}>Clothes</Text>
                      </View>

                      <View style={styles.yearStatDivider} />

                      <View style={styles.yearStatBlock}>
                        <Text style={styles.statNumber}>{stats.studentCount}</Text>
                        <Text style={styles.statLabel}>Students</Text>
                      </View>

                      <View style={styles.yearStatDivider} />

                      <View style={styles.yearStatBlock}>
                        <Text style={[styles.statNumber, { color: theme.text }]}>
                          {stats.activeCount}
                        </Text>
                        <Text style={styles.statLabel}>In Wash</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Bottom Done Button */}
            <View style={styles.yearModalFooter}>
              <TouchableOpacity
                style={styles.yearModalDoneBtn}
                onPress={() => setShowYearModal(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.yearModalDoneBtnText}>Done / Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* QR Scanner Modal for Handover */}
      <QRScannerModal
        visible={showQRScanner}
        onClose={() => setShowQRScanner(false)}
      />
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
    paddingBottom: 110,
  },
  greetingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...THEME.shadows.md,
    marginBottom: 20,
  },
  scanQrActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
  },
  scanQrIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#4338CA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanQrBtnTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  scanQrBtnSub: {
    fontSize: 10.5,
    color: '#4338CA',
    fontWeight: '600',
    marginTop: 1,
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 10,
  },
  heroTextContainer: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#0F4C5C',
    fontFamily: Platform.select({
      ios: 'Caveat-Bold, Snell Roundhand, cursive',
      android: 'Caveat_700Bold',
      web: 'Caveat, "Dancing Script", "Segoe Print", cursive, sans-serif',
      default: 'Caveat_700Bold',
    }),
    letterSpacing: -0.3,
    lineHeight: 38,
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
  sectionHeader: {
    fontSize: 12,
    fontWeight: '900',
    color: '#334155',
    letterSpacing: 1,
    marginBottom: 14,
    marginTop: 4,
  },
  breakdownHeaderWrap: {
    marginBottom: 8,
    marginTop: 4,
  },
  compactYearBreakdownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    ...THEME.shadows.md,
  },
  compactYearLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  compactYearIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  compactYearTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  compactBatchBadge: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  compactBatchBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4338CA',
  },
  compactYearSub: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  compactYearRight: {
    marginLeft: 8,
  },
  compactOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  compactOpenBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4338CA',
  },
  advancedToolsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  advancedToolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    borderWidth: 1.5,
    gap: 14,
    ...THEME.shadows.sm,
  },
  advancedToolIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  advancedToolTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  advancedToolSub: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 16,
  },
  yearModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    overflow: 'hidden',
    ...THEME.shadows.lg,
  },
  yearModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
  },
  yearModalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  yearModalSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  yearModalScroll: {
    maxHeight: 480,
  },
  yearModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
  },
  yearModalDoneBtn: {
    backgroundColor: '#4338CA',
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    ...THEME.shadows.sm,
  },
  yearModalDoneBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  yearGrid: {
    gap: 12,
    marginBottom: 20,
  },
  yearCard: {
    borderRadius: 28,
    padding: 16,
    borderWidth: 1.5,
    ...THEME.shadows.sm,
  },
  yearHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  yearTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  dayPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  dayPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  yearStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  yearStatBlock: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
  },
  yearStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#F1F5F9',
  },
  complaintsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 6,
  },
  openTicketsBadge: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  openTicketsBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#DC2626',
  },
  tktFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tktFilterTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tktFilterTabActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4338CA',
  },
  tktFilterText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  tktFilterTextActive: {
    color: '#4338CA',
    fontWeight: '800',
  },
  emptyTicketsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  emptyTicketsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 8,
  },
  emptyTicketsSub: {
    fontSize: 11.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 3,
  },
  ticketsList: {
    gap: 10,
    marginBottom: 20,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.06)',
  },
  ticketCardResolved: {
    borderColor: '#E2E8F0',
    boxShadow: 'none',
    opacity: 0.85,
  },
  ticketCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  catBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  ticketDate: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  ticketTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  ticketDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
    marginBottom: 8,
  },
  ticketCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  studentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  studentMetaText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  hasPhotoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  hasPhotoPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#4338CA',
  },
  tktModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  tktModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tktModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    minHeight: 380,
  },
  tktModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  tktModalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  tktStudentCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  tktStudentName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  tktStudentSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  tktStudentPhone: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#4338CA',
    marginTop: 4,
  },
  tktStudentEmail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  tktDetailLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
  },
  tktDescBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  tktDescFull: {
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 18,
  },
  tktFullImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    marginTop: 4,
  },
  tktActionRow: {
    marginTop: 18,
  },
  resolveActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  resolveActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  reopenActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    gap: 6,
  },
  reopenActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4338CA',
  },
  tktQuickDeleteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteTicketActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
    marginTop: 10,
  },
  deleteTicketActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
});

export default AdminDashboardScreen;
