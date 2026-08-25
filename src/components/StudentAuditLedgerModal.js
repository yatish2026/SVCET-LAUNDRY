import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../constants/theme';
import { ACADEMIC_COURSES, STUDENT_BRANCHES } from '../constants/schedule';

export const StudentAuditLedgerModal = ({ visible, onClose, bookings = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState('ALL');
  const [selectedStudentKey, setSelectedStudentKey] = useState(null); // Key of student opened in dossier

  // Compute unique student accounts dynamically from bookings
  const studentDirectory = useMemo(() => {
    const studentMap = {};
    const now = new Date();

    // Calculate start of current week (Monday) and start of current month
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    bookings.forEach((b) => {
      // Create a unique key per student
      const key = (b.student_id || b.student_name || b.student_email || 'unknown')
        .trim()
        .toLowerCase();

      if (!studentMap[key]) {
        studentMap[key] = {
          key,
          student_id: b.student_id || 'N/A',
          student_name: b.student_name || 'Student',
          student_email: b.student_email || '',
          academic_year: b.academic_year || '1st Year B.Tech',
          hostel_block: b.hostel_block || 'Hostel',
          room_number: b.room_number || 'N/A',
          phone_number: b.phone_number || '',
          avatar_url: b.student_avatar || null,
          totalSubmissions: 0,
          totalClothes: 0,
          thisWeekSubmissions: 0,
          thisWeekClothes: 0,
          thisMonthSubmissions: 0,
          thisMonthClothes: 0,
          completedCount: 0,
          activeCount: 0,
          orders: [],
        };
      }

      const st = studentMap[key];
      st.orders.push(b);
      st.totalSubmissions++;
      const itemsCount = Number(b.total_items) || 1;
      st.totalClothes += itemsCount;

      if (b.status === 'completed') {
        st.completedCount++;
      } else if (b.status !== 'cancelled') {
        st.activeCount++;
      }

      // Check date for weekly and monthly counts
      if (b.created_at) {
        const orderDate = new Date(b.created_at);
        if (orderDate >= startOfWeek) {
          st.thisWeekSubmissions++;
          st.thisWeekClothes += itemsCount;
        }
        if (orderDate >= startOfMonth) {
          st.thisMonthSubmissions++;
          st.thisMonthClothes += itemsCount;
        }
      }
    });

    // Sort orders for each student newest first
    Object.values(studentMap).forEach((st) => {
      st.orders.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    });

    return Object.values(studentMap);
  }, [bookings]);

  // Filtered Students list based on search & year
  const filteredStudents = useMemo(() => {
    return studentDirectory.filter((st) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        st.student_name.toLowerCase().includes(q) ||
        st.student_id.toLowerCase().includes(q) ||
        st.student_email.toLowerCase().includes(q) ||
        st.room_number.toLowerCase().includes(q) ||
        st.hostel_block.toLowerCase().includes(q) ||
        st.phone_number.includes(q);

      let matchYear = true;
      if (selectedYearFilter !== 'ALL') {
        const selLower = selectedYearFilter.toLowerCase();
        const stLower = (st.academic_year || '').toLowerCase();

        if (selLower.includes('1st') && (stLower.includes('1st') || stLower.includes('first'))) {
          matchYear = true;
        } else if (selLower.includes('2nd') && (stLower.includes('2nd') || stLower.includes('second'))) {
          matchYear = true;
        } else if (selLower.includes('3rd') && (stLower.includes('3rd') || stLower.includes('third'))) {
          matchYear = true;
        } else if (
          selLower.includes('4th') &&
          (stLower.includes('4th') || stLower.includes('fourth') || stLower.includes('final'))
        ) {
          matchYear = true;
        } else if (selLower.includes('diploma') && stLower.includes('diploma')) {
          matchYear = true;
        } else if (selLower.includes('pharmacy') && stLower.includes('pharmacy')) {
          matchYear = true;
        } else if (selLower.includes('nursing') && stLower.includes('nursing')) {
          matchYear = true;
        } else if (selLower.includes('mba') && stLower.includes('mba')) {
          matchYear = true;
        } else if (selLower.includes('mca') && stLower.includes('mca')) {
          matchYear = true;
        } else if (selLower.includes('bio') && (stLower.includes('bio') || stLower.includes('bbt'))) {
          matchYear = true;
        } else {
          matchYear = stLower.includes(selLower) || selLower.includes(stLower);
        }
      }

      return matchSearch && matchYear;
    });
  }, [studentDirectory, searchQuery, selectedYearFilter]);

  // Current student selected for full dossier view
  const activeStudent = useMemo(() => {
    if (!selectedStudentKey) return null;
    return studentDirectory.find((st) => st.key === selectedStudentKey) || null;
  }, [selectedStudentKey, studentDirectory]);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { label: 'Delivered', color: '#15803D', bg: '#DCFCE7' };
      case 'ready_for_pickup':
        return { label: 'Ready at Counter', color: '#B45309', bg: '#FEF3C7' };
      case 'in_wash':
        return { label: 'In Washing', color: '#1E40AF', bg: '#DBEAFE' };
      case 'drying_ironing':
        return { label: 'Drying / Ironing', color: '#6B21A8', bg: '#F3E8FF' };
      default:
        return { label: 'Pending Intake', color: '#475569', bg: '#F1F5F9' };
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
                <Ionicons name="shield-checkmark" size={13} color="#059669" />
                <Text style={styles.headerTagText}>FAIRNESS & AUDIT LEDGER</Text>
              </View>
              <Text style={styles.headerTitle}>Student Submission Ledger</Text>
              <Text style={styles.headerSub}>
                Inspect weekly, monthly & lifetime laundry records per student
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={28} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* If a student is selected, show Full Dossier view; otherwise show Student Search Directory */}
          {activeStudent ? (
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Back to Directory Button */}
              <TouchableOpacity
                style={styles.backToDirectoryBtn}
                onPress={() => setSelectedStudentKey(null)}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={16} color="#4338CA" />
                <Text style={styles.backToDirectoryText}>Back to Student Directory</Text>
              </TouchableOpacity>

              {/* 🌟 Student Profile Card */}
              <View style={styles.studentProfileCard}>
                <View style={styles.profileTopRow}>
                  <View style={styles.avatarCircle}>
                    {activeStudent.avatar_url ? (
                      <Image source={{ uri: activeStudent.avatar_url }} style={styles.avatarImg} />
                    ) : (
                      <Text style={styles.avatarLetter}>
                        {activeStudent.student_name.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.profileName}>{activeStudent.student_name}</Text>
                    <View style={styles.rollBadgeRow}>
                      <View style={styles.rollBadge}>
                        <Text style={styles.rollBadgeText}>ID: {activeStudent.student_id}</Text>
                      </View>
                      <Text style={styles.profileYearText}>{activeStudent.academic_year}</Text>
                    </View>
                    <Text style={styles.profileLocationText}>
                      🏢 {activeStudent.hostel_block} • Room {activeStudent.room_number}
                    </Text>
                  </View>
                </View>

                {/* Contact Meta */}
                <View style={styles.profileContactRow}>
                  {activeStudent.phone_number ? (
                    <View style={styles.contactItem}>
                      <Ionicons name="call" size={13} color="#2563EB" />
                      <Text style={styles.contactText}>{activeStudent.phone_number}</Text>
                    </View>
                  ) : null}
                  {activeStudent.student_email ? (
                    <View style={styles.contactItem}>
                      <Ionicons name="mail" size={13} color="#7C3AED" />
                      <Text style={styles.contactText} numberOfLines={1}>
                        {activeStudent.student_email}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* 📊 Fairness & Volume Statistics (Weekly / Monthly / Lifetime) */}
              <Text style={styles.sectionHeaderTitle}>⚖️ FAIRNESS & SUBMISSION METRICS</Text>

              <View style={styles.metricsGrid}>
                {/* Lifetime Total */}
                <View style={[styles.metricCard, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
                  <View style={styles.metricTop}>
                    <Ionicons name="cube" size={18} color="#4338CA" />
                    <Text style={[styles.metricBigNum, { color: '#4338CA' }]}>
                      {activeStudent.totalSubmissions}
                    </Text>
                  </View>
                  <Text style={styles.metricLabel}>Lifetime Bags</Text>
                  <Text style={styles.metricSub}>{activeStudent.totalClothes} total clothes</Text>
                </View>

                {/* This Month */}
                <View style={[styles.metricCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                  <View style={styles.metricTop}>
                    <Ionicons name="calendar" size={18} color="#15803D" />
                    <Text style={[styles.metricBigNum, { color: '#15803D' }]}>
                      {activeStudent.thisMonthSubmissions}
                    </Text>
                  </View>
                  <Text style={styles.metricLabel}>This Month</Text>
                  <Text style={styles.metricSub}>{activeStudent.thisMonthClothes} clothes this month</Text>
                </View>

                {/* This Week */}
                <View style={[styles.metricCard, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                  <View style={styles.metricTop}>
                    <Ionicons name="flash" size={18} color="#B45309" />
                    <Text style={[styles.metricBigNum, { color: '#B45309' }]}>
                      {activeStudent.thisWeekSubmissions}
                    </Text>
                  </View>
                  <Text style={styles.metricLabel}>This Week</Text>
                  <Text style={styles.metricSub}>{activeStudent.thisWeekClothes} clothes this week</Text>
                </View>

                {/* Current Active */}
                <View style={[styles.metricCard, { backgroundColor: '#FAF5FF', borderColor: '#E9D5FF' }]}>
                  <View style={styles.metricTop}>
                    <Ionicons name="timer" size={18} color="#7C3AED" />
                    <Text style={[styles.metricBigNum, { color: '#7C3AED' }]}>
                      {activeStudent.activeCount}
                    </Text>
                  </View>
                  <Text style={styles.metricLabel}>Active in Wash</Text>
                  <Text style={styles.metricSub}>{activeStudent.completedCount} delivered bags</Text>
                </View>
              </View>

              {/* 📜 Complete Chronological Submission History */}
              <Text style={[styles.sectionHeaderTitle, { marginTop: 12 }]}>
                📑 COMPLETE ORDER HISTORY ({activeStudent.orders.length} Submissions)
              </Text>

              <View style={styles.dossierOrdersList}>
                {activeStudent.orders.map((ord, idx) => {
                  const statusObj = getStatusInfo(ord.status);
                  const itemsList = Object.entries(ord.items || {})
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(' • ');

                  return (
                    <View key={ord.id || idx} style={styles.dossierOrderCard}>
                      <View style={styles.dossierOrderTop}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View style={styles.tokenPill}>
                            <Text style={styles.tokenPillText}>#{ord.pickup_token}</Text>
                          </View>
                          <Text style={styles.orderDateTitle}>
                            {new Date(ord.created_at).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Text>
                        </View>

                        <View style={[styles.statusBadge, { backgroundColor: statusObj.bg }]}>
                          <Text style={[styles.statusBadgeText, { color: statusObj.color }]}>
                            {statusObj.label}
                          </Text>
                        </View>
                      </View>

                      {/* Items breakdown */}
                      <View style={styles.itemsBreakdownBox}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="shirt-outline" size={14} color="#4338CA" />
                          <Text style={styles.clothesCountHeader}>
                            Total Clothes: {ord.total_items || 1}
                          </Text>
                        </View>
                        <Text style={styles.clothesBreakdownList}>
                          {itemsList || 'Regular mix clothes'}
                        </Text>
                      </View>

                      {/* Timing details */}
                      <View style={styles.dossierTimingRow}>
                        <Text style={styles.timingText}>
                          📥 Drop-off: {ord.dropoff_slot_time || 'Standard Slot'}
                        </Text>
                        <Text style={styles.timingText}>
                          📤 Pickup: {ord.pickup_slot_time || 'Counter Token'}
                        </Text>
                      </View>

                      {ord.special_instructions ? (
                        <View style={styles.instructionsBox}>
                          <Text style={styles.instructionsText}>
                            💬 Note: {ord.special_instructions}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          ) : (
            /* Student Directory & Search View */
            <View style={{ flex: 1 }}>
              {/* Search Bar */}
              <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                  <Ionicons name="search" size={18} color="#64748B" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by student name, roll no, room, block..."
                    placeholderTextColor="#94A3B8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Academic Course & Year Filter Chips */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.yearChipsRow}
                >
                  {['ALL', ...ACADEMIC_COURSES].map((yr) => (
                    <TouchableOpacity
                      key={yr}
                      style={[
                        styles.yearChip,
                        selectedYearFilter === yr && styles.yearChipActive,
                      ]}
                      onPress={() => setSelectedYearFilter(yr)}
                    >
                      <Text
                        style={[
                          styles.yearChipText,
                          selectedYearFilter === yr && styles.yearChipTextActive,
                        ]}
                      >
                        {yr === 'ALL' ? 'All Courses' : yr}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Student Cards List */}
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.listHeaderRow}>
                  <Text style={styles.listCountText}>
                    Showing {filteredStudents.length} Registered Students
                  </Text>
                  <Text style={styles.listHintText}>Tap student for full audit dossier</Text>
                </View>

                {filteredStudents.length === 0 ? (
                  <View style={styles.emptyDirectoryBox}>
                    <Ionicons name="people-outline" size={36} color="#94A3B8" />
                    <Text style={styles.emptyDirectoryTitle}>No Students Found</Text>
                    <Text style={styles.emptyDirectorySub}>
                      No student records matched your search query.
                    </Text>
                  </View>
                ) : (
                  filteredStudents.map((st) => (
                    <TouchableOpacity
                      key={st.key}
                      style={styles.studentCard}
                      onPress={() => setSelectedStudentKey(st.key)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.studentCardLeft}>
                        <View style={styles.avatarCircleSmall}>
                          <Text style={styles.avatarLetterSmall}>
                            {st.student_name.charAt(0).toUpperCase()}
                          </Text>
                        </View>

                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.studentCardName}>{st.student_name}</Text>
                            <View style={styles.cardRollBadge}>
                              <Text style={styles.cardRollBadgeText}>{st.student_id}</Text>
                            </View>
                          </View>
                          <Text style={styles.studentCardSub}>
                            {st.academic_year} • Room {st.room_number} ({st.hostel_block})
                          </Text>
                        </View>
                      </View>

                      {/* Stat summary pills */}
                      <View style={styles.studentCardRight}>
                        <View style={styles.statPill}>
                          <Text style={styles.statPillNum}>{st.totalSubmissions}</Text>
                          <Text style={styles.statPillLabel}>Bags</Text>
                        </View>
                        <View style={[styles.statPill, { backgroundColor: '#F0FDF4' }]}>
                          <Text style={[styles.statPillNum, { color: '#15803D' }]}>
                            {st.totalClothes}
                          </Text>
                          <Text style={styles.statPillLabel}>Clothes</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          )}
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
    backgroundColor: '#ECFDF5',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  headerTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
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
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  yearChipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 4,
  },
  yearChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  yearChipActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  yearChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  yearChipTextActive: {
    color: '#FFFFFF',
  },
  modalScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  listCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  listHintText: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '600',
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
  },
  studentCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircleSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
  },
  avatarLetterSmall: {
    fontSize: 16,
    fontWeight: '900',
    color: '#4338CA',
  },
  studentCardName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardRollBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardRollBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#475569',
  },
  studentCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  studentCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statPill: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statPillNum: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
  },
  statPillLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#64748B',
  },
  emptyDirectoryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyDirectoryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#475569',
    marginTop: 8,
  },
  emptyDirectorySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 3,
  },

  /* Dossier Styles */
  backToDirectoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  backToDirectoryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4338CA',
  },
  studentProfileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
    gap: 12,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4338CA',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: '900',
    color: '#4338CA',
  },
  profileName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  rollBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  rollBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rollBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#334155',
  },
  profileYearText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  profileLocationText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 3,
  },
  profileContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    flexWrap: 'wrap',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  contactText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  sectionHeaderTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: 0.8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48.5%',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
  },
  metricTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metricBigNum: {
    fontSize: 20,
    fontWeight: '900',
  },
  metricLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1E293B',
  },
  metricSub: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  dossierOrdersList: {
    gap: 10,
  },
  dossierOrderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
    gap: 8,
  },
  dossierOrderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tokenPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  tokenPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#4338CA',
  },
  orderDateTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  itemsBreakdownBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  clothesCountHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  clothesBreakdownList: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  dossierTimingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  timingText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  instructionsBox: {
    backgroundColor: '#FFFBEB',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  instructionsText: {
    fontSize: 10.5,
    color: '#B45309',
    fontWeight: '600',
  },
});

export default StudentAuditLedgerModal;
