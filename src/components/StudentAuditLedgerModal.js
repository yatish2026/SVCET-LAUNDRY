import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../constants/theme';
import apiService from '../services/apiService';
import { STUDENT_LOCATIONS } from '../constants/schedule';

const { width } = Dimensions.get('window');

export const AUDIT_CATEGORY_OPTIONS = [
  { id: 'ALL', label: 'All Courses & Batches', icon: 'apps' },
  { id: '1ST_YEAR', label: '1st Year (B.Tech & Diploma)', icon: 'school' },
  { id: '2ND_YEAR', label: '2nd Year (B.Tech & Diploma)', icon: 'school' },
  { id: '3RD_YEAR', label: '3rd Year B.Tech', icon: 'school' },
  { id: '4TH_YEAR', label: '4th Year B.Tech (Final Year)', icon: 'school' },
  { id: 'DIPLOMA', label: 'Diploma (1st & 2nd Year)', icon: 'construct' },
  { id: 'MBA_MCA', label: 'MBA / MCA Postgrad', icon: 'briefcase' },
  { id: 'PHARMACY_NURSING', label: 'Pharmacy & Nursing', icon: 'medkit' },
  { id: 'GIRLS_HOSTEL', label: 'Girls Hostel (All Branches)', icon: 'woman' },
  { id: 'NEPAL_INTL', label: 'Nepal & International Batch', icon: 'globe' },
  { id: 'BIHAR_STATE', label: 'Bihar State Batch', icon: 'leaf' },
];

export const ACTIVITY_OPTIONS = [
  { id: 'ALL', label: 'All Activity' },
  { id: 'ACTIVE', label: '🧺 Active (Submitted Clothes)' },
  { id: 'HIGH_VOLUME', label: '🔥 High Volume (>10 Clothes)' },
  { id: 'ZERO', label: '💤 0 Submissions' },
];

export const StudentAuditLedgerModal = ({ visible, onClose, bookings = [] }) => {
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedActivityFilter, setSelectedActivityFilter] = useState('ALL');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState('ALL');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState('ALL');
  const [showFilterPickerModal, setShowFilterPickerModal] = useState(false);
  const [selectedStudentKey, setSelectedStudentKey] = useState(null); // Key of student opened in dossier

  // Fetch registered users on modal open
  useEffect(() => {
    if (visible) {
      const fetchCensus = async () => {
        const users = await apiService.getStudentsCensus();
        if (users && users.length > 0) {
          setRegisteredUsers(users);
        }
      };
      fetchCensus();
    }
  }, [visible]);

  // Compute unique student accounts dynamically combining bookings + registered accounts
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

    // 1. Process all bookings
    bookings.forEach((b) => {
      const key = (b.student_id || b.student_name || b.student_email || 'unknown')
        .trim()
        .toLowerCase();

      if (!studentMap[key]) {
        studentMap[key] = {
          key,
          student_id: b.student_id || 'N/A',
          student_name: b.student_name || 'Student',
          student_email: b.student_email || '',
          academic_year: b.academic_year || '1st Year',
          branch: b.branch || 'CSE',
          hostel_block: b.hostel_block || 'Hostel Block',
          room_number: b.room_number || 'N/A',
          phone_number: b.phone_number || '',
          gender: (b.gender || '').toLowerCase() || (b.hostel_block?.toLowerCase().includes('girl') ? 'female' : 'male'),
          location: b.location || (b.hostel_block?.toLowerCase().includes('nepal') ? 'Nepal' : 'Andhra Pradesh'),
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

    // 2. Process all registered users
    registeredUsers.forEach((u) => {
      const key = (u.student_id || u.full_name || u.email || 'unknown').trim().toLowerCase();

      if (!studentMap[key]) {
        studentMap[key] = {
          key,
          student_id: u.student_id || 'N/A',
          student_name: u.full_name || 'Student',
          student_email: u.email || '',
          academic_year: u.academic_year || '1st Year',
          branch: u.branch || 'CSE',
          hostel_block: u.hostel_block || 'Hostel Block',
          room_number: u.room_number || 'N/A',
          phone_number: u.phone_number || '',
          gender: (u.gender || '').toLowerCase() || (u.hostel_block?.toLowerCase().includes('girl') ? 'female' : 'male'),
          location: u.location || (u.hostel_block?.toLowerCase().includes('nepal') ? 'Nepal' : 'Andhra Pradesh'),
          avatar_url: u.avatar_url || null,
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
      } else {
        if (u.email && !studentMap[key].student_email) studentMap[key].student_email = u.email;
        if (u.gender) studentMap[key].gender = u.gender.toLowerCase();
        if (u.location) studentMap[key].location = u.location;
        if (u.branch) studentMap[key].branch = u.branch;
        if (u.academic_year) studentMap[key].academic_year = u.academic_year;
      }
    });

    // Sort orders for each student newest first
    Object.values(studentMap).forEach((st) => {
      st.orders.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    });

    return Object.values(studentMap);
  }, [bookings, registeredUsers]);

  // Compute counts per category filter
  const categoryCounts = useMemo(() => {
    const counts = {};
    AUDIT_CATEGORY_OPTIONS.forEach((f) => (counts[f.id] = 0));

    studentDirectory.forEach((st) => {
      counts.ALL++;

      const yrLower = (st.academic_year || '').toLowerCase();
      const locLower = (st.location || '').toLowerCase();
      const hBlockLower = (st.hostel_block || '').toLowerCase();
      const genderLower = (st.gender || '').toLowerCase();

      if (yrLower.includes('1st') || yrLower.includes('first')) {
        counts['1ST_YEAR'] = (counts['1ST_YEAR'] || 0) + 1;
      }
      if (yrLower.includes('2nd') || yrLower.includes('second')) {
        counts['2ND_YEAR'] = (counts['2ND_YEAR'] || 0) + 1;
      }
      if (yrLower.includes('3rd') || yrLower.includes('third')) {
        counts['3RD_YEAR'] = (counts['3RD_YEAR'] || 0) + 1;
      }
      if (yrLower.includes('4th') || yrLower.includes('fourth') || yrLower.includes('final')) {
        counts['4TH_YEAR'] = (counts['4TH_YEAR'] || 0) + 1;
      }
      if (yrLower.includes('diploma')) {
        counts['DIPLOMA'] = (counts['DIPLOMA'] || 0) + 1;
      }
      if (yrLower.includes('mba') || yrLower.includes('mca')) {
        counts['MBA_MCA'] = (counts['MBA_MCA'] || 0) + 1;
      }
      if (yrLower.includes('pharmacy') || yrLower.includes('nursing')) {
        counts['PHARMACY_NURSING'] = (counts['PHARMACY_NURSING'] || 0) + 1;
      }
      if (genderLower === 'female' || hBlockLower.includes('girl') || hBlockLower.includes('women')) {
        counts['GIRLS_HOSTEL'] = (counts['GIRLS_HOSTEL'] || 0) + 1;
      }
      if (
        locLower.includes('nepal') ||
        locLower.includes('andaman') ||
        locLower.includes('international') ||
        locLower.includes('south africa') ||
        hBlockLower.includes('nepal')
      ) {
        counts['NEPAL_INTL'] = (counts['NEPAL_INTL'] || 0) + 1;
      }
      if (locLower.includes('bihar')) {
        counts['BIHAR_STATE'] = (counts['BIHAR_STATE'] || 0) + 1;
      }
    });

    return counts;
  }, [studentDirectory]);

  // Active filter count
  const activeFiltersCount = useMemo(() => {
    let cnt = 0;
    if (selectedCategoryFilter !== 'ALL') cnt++;
    if (selectedActivityFilter !== 'ALL') cnt++;
    if (selectedLocationFilter !== 'ALL') cnt++;
    if (selectedGenderFilter !== 'ALL') cnt++;
    return cnt;
  }, [selectedCategoryFilter, selectedActivityFilter, selectedLocationFilter, selectedGenderFilter]);

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedCategoryFilter('ALL');
    setSelectedActivityFilter('ALL');
    setSelectedLocationFilter('ALL');
    setSelectedGenderFilter('ALL');
    setSearchQuery('');
  };

  // Filtered Students list
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
        (st.branch && st.branch.toLowerCase().includes(q)) ||
        (st.location && st.location.toLowerCase().includes(q)) ||
        st.phone_number.includes(q);

      // Category matching
      let matchCat = true;
      const yrLower = (st.academic_year || '').toLowerCase();
      const locLower = (st.location || '').toLowerCase();
      const hBlockLower = (st.hostel_block || '').toLowerCase();
      const genderLower = (st.gender || '').toLowerCase();

      switch (selectedCategoryFilter) {
        case '1ST_YEAR':
          matchCat = yrLower.includes('1st') || yrLower.includes('first');
          break;
        case '2ND_YEAR':
          matchCat = yrLower.includes('2nd') || yrLower.includes('second');
          break;
        case '3RD_YEAR':
          matchCat = yrLower.includes('3rd') || yrLower.includes('third');
          break;
        case '4TH_YEAR':
          matchCat = yrLower.includes('4th') || yrLower.includes('fourth') || yrLower.includes('final');
          break;
        case 'DIPLOMA':
          matchCat = yrLower.includes('diploma');
          break;
        case 'MBA_MCA':
          matchCat = yrLower.includes('mba') || yrLower.includes('mca');
          break;
        case 'PHARMACY_NURSING':
          matchCat = yrLower.includes('pharmacy') || yrLower.includes('nursing');
          break;
        case 'GIRLS_HOSTEL':
          matchCat = genderLower === 'female' || hBlockLower.includes('girl') || hBlockLower.includes('women');
          break;
        case 'NEPAL_INTL':
          matchCat =
            locLower.includes('nepal') ||
            locLower.includes('andaman') ||
            locLower.includes('international') ||
            locLower.includes('south africa') ||
            hBlockLower.includes('nepal');
          break;
        case 'BIHAR_STATE':
          matchCat = locLower.includes('bihar');
          break;
        default:
          matchCat = true;
      }

      // Activity matching
      let matchActivity = true;
      switch (selectedActivityFilter) {
        case 'ACTIVE':
          matchActivity = st.totalSubmissions > 0;
          break;
        case 'HIGH_VOLUME':
          matchActivity = st.totalClothes >= 10;
          break;
        case 'ZERO':
          matchActivity = st.totalSubmissions === 0;
          break;
        default:
          matchActivity = true;
      }

      // Location matching
      let matchLocation = true;
      if (selectedLocationFilter !== 'ALL') {
        matchLocation = (st.location || '').toLowerCase().includes(selectedLocationFilter.toLowerCase());
      }

      // Gender matching
      let matchGender = true;
      if (selectedGenderFilter !== 'ALL') {
        matchGender = st.gender === selectedGenderFilter;
      }

      return matchSearch && matchCat && matchActivity && matchLocation && matchGender;
    });
  }, [
    studentDirectory,
    searchQuery,
    selectedCategoryFilter,
    selectedActivityFilter,
    selectedLocationFilter,
    selectedGenderFilter,
  ]);

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

  const selectedCategoryLabel = useMemo(() => {
    const found = AUDIT_CATEGORY_OPTIONS.find((c) => c.id === selectedCategoryFilter);
    return found ? found.label : 'All Courses';
  }, [selectedCategoryFilter]);

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
                      🏢 {activeStudent.hostel_block} • Room {activeStudent.room_number} (📍 {activeStudent.location})
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

              {activeStudent.orders.length === 0 ? (
                <View style={styles.emptyOrdersCard}>
                  <Ionicons name="shirt-outline" size={32} color="#94A3B8" />
                  <Text style={styles.emptyOrdersTitle}>No Laundry Orders Yet</Text>
                  <Text style={styles.emptyOrdersSub}>
                    This student has registered their account but hasn't submitted any clothes yet.
                  </Text>
                </View>
              ) : (
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
              )}
            </ScrollView>
          ) : (
            /* Student Directory & Search View */
            <View style={{ flex: 1 }}>
              {/* Search & Filter Bar */}
              <View style={styles.searchSection}>
                <View style={styles.searchRow}>
                  {/* Search Input */}
                  <View style={styles.searchBar}>
                    <Ionicons name="search" size={18} color="#64748B" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search student name, roll ID, room, email..."
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

                  {/* ⚙️ Modern Filter Button */}
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      activeFiltersCount > 0 && styles.filterButtonActive,
                    ]}
                    onPress={() => setShowFilterPickerModal(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="options-outline"
                      size={18}
                      color={activeFiltersCount > 0 ? '#FFF' : '#4338CA'}
                    />
                    <Text
                      style={[
                        styles.filterButtonText,
                        activeFiltersCount > 0 && styles.filterButtonTextActive,
                      ]}
                    >
                      Filter
                    </Text>
                    {activeFiltersCount > 0 ? (
                      <View style={styles.filterBadgeCircle}>
                        <Text style={styles.filterBadgeCircleText}>{activeFiltersCount}</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                </View>

                {/* Active Filter Chips / Summary Bar */}
                {activeFiltersCount > 0 || searchQuery ? (
                  <View style={styles.activeFiltersBar}>
                    <View style={styles.activeFilterPill}>
                      <Text style={styles.activeFilterPillText} numberOfLines={1}>
                        Filtered: {selectedCategoryLabel}
                        {selectedActivityFilter !== 'ALL' ? ` • ${selectedActivityFilter}` : ''}
                        {selectedLocationFilter !== 'ALL' ? ` • ${selectedLocationFilter}` : ''}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={handleResetFilters}
                      style={styles.clearFiltersBtn}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={14} color="#DC2626" />
                      <Text style={styles.clearFiltersBtnText}>Reset</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>

              {/* Student Cards List */}
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.listHeaderRow}>
                  <Text style={styles.listCountText}>
                    Showing {filteredStudents.length} Students
                  </Text>
                  <Text style={styles.listHintText}>Tap any student for full audit dossier</Text>
                </View>

                {filteredStudents.length === 0 ? (
                  <View style={styles.emptyDirectoryBox}>
                    <Ionicons name="people-outline" size={36} color="#94A3B8" />
                    <Text style={styles.emptyDirectoryTitle}>No Students in this Filter</Text>
                    <Text style={styles.emptyDirectorySub}>
                      No registered students found matching your filter selection.
                    </Text>
                    <TouchableOpacity
                      style={styles.emptyResetBtn}
                      onPress={handleResetFilters}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.emptyResetBtnText}>Reset All Filters</Text>
                    </TouchableOpacity>
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
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={styles.studentCardName}>{st.student_name}</Text>
                            <View style={styles.cardRollBadge}>
                              <Text style={styles.cardRollBadgeText}>{st.student_id}</Text>
                            </View>
                          </View>
                          <Text style={styles.studentCardSub}>
                            {st.academic_year} • Room {st.room_number} ({st.hostel_block})
                          </Text>
                          <Text style={styles.studentRegionSub}>
                            📍 {st.location || 'Campus'} • 📞 {st.phone_number || 'No Phone'}
                          </Text>
                        </View>
                      </View>

                      {/* Stat summary pills */}
                      <View style={styles.studentCardRight}>
                        <View style={styles.statPill}>
                          <Text style={styles.statPillNum}>{st.totalSubmissions}</Text>
                          <Text style={styles.statPillLabel}>Bags</Text>
                        </View>
                        <View
                          style={[
                            styles.statPill,
                            { backgroundColor: st.totalClothes > 0 ? '#F0FDF4' : '#F8FAFC' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statPillNum,
                              { color: st.totalClothes > 0 ? '#15803D' : '#64748B' },
                            ]}
                          >
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

          {/* 🎛️ Clean Dropdown / Modal Filter Sheet */}
          <Modal
            visible={showFilterPickerModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowFilterPickerModal(false)}
          >
            <View style={styles.filterModalOverlay}>
              <View style={styles.filterModalSheet}>
                <View style={styles.filterModalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="options" size={20} color="#4338CA" />
                    <Text style={styles.filterModalTitle}>Filter Students</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowFilterPickerModal(false)} style={{ padding: 4 }}>
                    <Ionicons name="close" size={22} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={{ maxHeight: '75%' }}
                  contentContainerStyle={{ padding: 18, gap: 16 }}
                  showsVerticalScrollIndicator={true}
                >
                  {/* 1. Academic Batch / Year Selection */}
                  <View>
                    <Text style={styles.filterGroupTitle}>🎓 Select Academic Batch / Course:</Text>
                    <View style={styles.filterOptionsGrid}>
                      {AUDIT_CATEGORY_OPTIONS.map((opt) => {
                        const count = categoryCounts[opt.id] || 0;
                        const isSelected = selectedCategoryFilter === opt.id;

                        return (
                          <TouchableOpacity
                            key={opt.id}
                            style={[
                              styles.filterOptionItem,
                              isSelected && styles.filterOptionItemSelected,
                            ]}
                            onPress={() => setSelectedCategoryFilter(opt.id)}
                            activeOpacity={0.75}
                          >
                            <Ionicons
                              name={opt.icon}
                              size={16}
                              color={isSelected ? '#4338CA' : '#64748B'}
                            />
                            <View style={{ flex: 1, marginLeft: 8 }}>
                              <Text
                                style={[
                                  styles.filterOptionText,
                                  isSelected && styles.filterOptionTextSelected,
                                ]}
                              >
                                {opt.label}
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.countBadgePill,
                                isSelected && { backgroundColor: '#4338CA' },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.countBadgePillText,
                                  isSelected && { color: '#FFF' },
                                ]}
                              >
                                {count}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* 2. Submission Activity */}
                  <View>
                    <Text style={styles.filterGroupTitle}>🧺 Submission Activity:</Text>
                    <View style={styles.filterOptionsGrid}>
                      {ACTIVITY_OPTIONS.map((act) => {
                        const isSelected = selectedActivityFilter === act.id;

                        return (
                          <TouchableOpacity
                            key={act.id}
                            style={[
                              styles.filterOptionItem,
                              isSelected && styles.filterOptionItemSelected,
                            ]}
                            onPress={() => setSelectedActivityFilter(act.id)}
                            activeOpacity={0.75}
                          >
                            <Text
                              style={[
                                styles.filterOptionText,
                                isSelected && styles.filterOptionTextSelected,
                              ]}
                            >
                              {act.label}
                            </Text>
                            {isSelected ? (
                              <Ionicons name="checkmark-circle" size={18} color="#4338CA" />
                            ) : null}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* 3. State / Origin Location */}
                  <View>
                    <Text style={styles.filterGroupTitle}>📍 State / Region Origin:</Text>
                    <View style={styles.filterOptionsGrid}>
                      {['ALL', ...STUDENT_LOCATIONS].map((loc) => {
                        const isSelected = selectedLocationFilter === loc;

                        return (
                          <TouchableOpacity
                            key={loc}
                            style={[
                              styles.filterOptionItem,
                              isSelected && styles.filterOptionItemSelected,
                            ]}
                            onPress={() => setSelectedLocationFilter(loc)}
                            activeOpacity={0.75}
                          >
                            <Text
                              style={[
                                styles.filterOptionText,
                                isSelected && styles.filterOptionTextSelected,
                              ]}
                            >
                              {loc === 'ALL' ? 'All Regions' : loc}
                            </Text>
                            {isSelected ? (
                              <Ionicons name="checkmark-circle" size={18} color="#4338CA" />
                            ) : null}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </ScrollView>

                {/* Bottom Footer Actions */}
                <View style={styles.filterModalFooter}>
                  <TouchableOpacity
                    style={styles.modalResetBtn}
                    onPress={handleResetFilters}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalResetBtnText}>Reset All</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalApplyBtn}
                    onPress={() => setShowFilterPickerModal(false)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.modalApplyBtnText}>
                      Apply Filters ({filteredStudents.length} Results)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
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
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    flex: 1,
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
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
  },
  filterButtonActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  filterButtonText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#4338CA',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  filterBadgeCircle: {
    backgroundColor: '#FFFFFF',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeCircleText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#4338CA',
  },
  activeFiltersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeFilterPill: {
    flex: 1,
    marginRight: 8,
  },
  activeFilterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  clearFiltersBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
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
    color: '#4338CA',
    fontWeight: '700',
    marginTop: 2,
  },
  studentRegionSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
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
    marginBottom: 14,
  },
  emptyResetBtn: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  emptyResetBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4338CA',
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

  /* 🎛️ Filter Bottom Sheet Modal Styles */
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  filterModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterModalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  filterGroupTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  filterOptionsGrid: {
    gap: 6,
  },
  filterOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  filterOptionItemSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4338CA',
  },
  filterOptionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  filterOptionTextSelected: {
    color: '#4338CA',
    fontWeight: '900',
  },
  countBadgePill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  filterModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  modalResetBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
  },
  modalResetBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  modalApplyBtn: {
    flex: 1,
    backgroundColor: '#4338CA',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});

export default StudentAuditLedgerModal;
