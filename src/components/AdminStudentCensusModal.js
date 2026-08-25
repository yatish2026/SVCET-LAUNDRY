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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  STUDENT_GENDERS,
  STUDENT_LOCATIONS,
  ACADEMIC_COURSES,
  STUDENT_BRANCHES,
} from '../constants/schedule';
import apiService from '../services/apiService';

const { width } = Dimensions.get('window');

export const AdminStudentCensusModal = ({ visible, onClose, bookings = [] }) => {
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUsage, setFilterUsage] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [filterGender, setFilterGender] = useState('ALL'); // 'ALL' | 'male' | 'female'
  const [filterYear, setFilterYear] = useState('ALL');
  const [filterLocation, setFilterLocation] = useState('ALL');
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // 'OVERVIEW' | 'ROSTER'

  // Fetch registered users census from backend on open
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

  // Combine registered user accounts with bookings activity
  const studentCensusList = useMemo(() => {
    const map = {};

    // 1. Process all bookings first
    bookings.forEach((b) => {
      const key = (b.student_id || b.student_name || b.student_email || 'unknown')
        .trim()
        .toLowerCase();

      if (!map[key]) {
        map[key] = {
          key,
          student_id: b.student_id || 'N/A',
          student_name: b.student_name || 'Student',
          student_email: b.student_email || '',
          phone_number: b.phone_number || '',
          academic_year: b.academic_year || 'B.Tech 1st Year',
          branch: b.branch || 'CSE',
          hostel_block: b.hostel_block || 'Hostel Block A',
          room_number: b.room_number || 'N/A',
          gender: (b.gender || '').toLowerCase() || (b.hostel_block?.toLowerCase().includes('girl') ? 'female' : 'male'),
          location: b.location || (b.hostel_block?.toLowerCase().includes('nepal') ? 'Nepal' : 'Andhra Pradesh'),
          totalBookings: 0,
          totalClothes: 0,
          usedDhobi: false,
          created_at: b.created_at || new Date().toISOString(),
        };
      }

      map[key].totalBookings++;
      map[key].totalClothes += Number(b.total_items) || 1;
      map[key].usedDhobi = true;
    });

    // 2. Process all registered accounts from backend (including those who haven't made a booking yet)
    registeredUsers.forEach((u) => {
      const key = (u.student_id || u.full_name || u.email || 'unknown').trim().toLowerCase();

      if (!map[key]) {
        map[key] = {
          key,
          student_id: u.student_id || 'N/A',
          student_name: u.full_name || 'Student',
          student_email: u.email || '',
          phone_number: u.phone_number || '',
          academic_year: u.academic_year || 'B.Tech 1st Year',
          branch: u.branch || 'CSE',
          hostel_block: u.hostel_block || 'Hostel Block A',
          room_number: u.room_number || 'N/A',
          gender: (u.gender || '').toLowerCase() || (u.hostel_block?.toLowerCase().includes('girl') ? 'female' : 'male'),
          location: u.location || (u.hostel_block?.toLowerCase().includes('nepal') ? 'Nepal' : 'Andhra Pradesh'),
          totalBookings: 0,
          totalClothes: 0,
          usedDhobi: false,
          created_at: u.created_at || new Date().toISOString(),
        };
      } else {
        // Enrich existing entry with registered details
        if (u.email) map[key].student_email = u.email;
        if (u.gender) map[key].gender = u.gender.toLowerCase();
        if (u.location) map[key].location = u.location;
        if (u.branch) map[key].branch = u.branch;
      }
    });

    return Object.values(map);
  }, [bookings, registeredUsers]);

  // Aggregate Demographic Analytics Calculations
  const stats = useMemo(() => {
    const totalStudents = studentCensusList.length;
    const activeDhobiUsers = studentCensusList.filter((s) => s.usedDhobi).length;
    const inactiveUsers = totalStudents - activeDhobiUsers;
    const totalClothesWashed = studentCensusList.reduce((sum, s) => sum + s.totalClothes, 0);

    // Gender breakdown
    const boysCount = studentCensusList.filter((s) => s.gender === 'male').length;
    const girlsCount = studentCensusList.filter((s) => s.gender === 'female').length;

    // Academic Year breakdown
    const yearCounts = {};
    ACADEMIC_COURSES.forEach((yr) => (yearCounts[yr] = 0));
    studentCensusList.forEach((s) => {
      const match = ACADEMIC_COURSES.find((yr) => s.academic_year.includes(yr.split(' ')[0])) || s.academic_year;
      yearCounts[match] = (yearCounts[match] || 0) + 1;
    });

    // Location / Region breakdown
    const locationCounts = {};
    STUDENT_LOCATIONS.forEach((loc) => (locationCounts[loc] = 0));
    studentCensusList.forEach((s) => {
      const loc = s.location || 'Andhra Pradesh';
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    });

    // Branch breakdown
    const branchCounts = {};
    studentCensusList.forEach((s) => {
      const br = s.branch || 'CSE';
      branchCounts[br] = (branchCounts[br] || 0) + 1;
    });

    return {
      totalStudents,
      activeDhobiUsers,
      inactiveUsers,
      totalClothesWashed,
      boysCount,
      girlsCount,
      yearCounts,
      locationCounts,
      branchCounts,
    };
  }, [studentCensusList]);

  // Filtered Student List
  const filteredStudents = useMemo(() => {
    return studentCensusList.filter((st) => {
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        st.student_name.toLowerCase().includes(q) ||
        st.student_id.toLowerCase().includes(q) ||
        st.student_email.toLowerCase().includes(q) ||
        st.phone_number.includes(q) ||
        st.room_number.toLowerCase().includes(q) ||
        st.hostel_block.toLowerCase().includes(q) ||
        (st.branch && st.branch.toLowerCase().includes(q)) ||
        (st.location && st.location.toLowerCase().includes(q));

      const matchUsage =
        filterUsage === 'ALL' ||
        (filterUsage === 'ACTIVE' && st.usedDhobi) ||
        (filterUsage === 'INACTIVE' && !st.usedDhobi);

      const matchGender =
        filterGender === 'ALL' || st.gender === filterGender;

      const matchYear =
        filterYear === 'ALL' || st.academic_year.includes(filterYear.split(' ')[0]);

      const matchLocation =
        filterLocation === 'ALL' || st.location === filterLocation;

      return matchQuery && matchUsage && matchGender && matchYear && matchLocation;
    });
  }, [studentCensusList, searchQuery, filterUsage, filterGender, filterYear, filterLocation]);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.headerTag}>
                <Ionicons name="pie-chart" size={13} color="#2563EB" />
                <Text style={styles.headerTagText}>STUDENT CENSUS & DEMOGRAPHICS</Text>
              </View>
              <Text style={styles.headerTitle}>Student Demographics & Login Hub</Text>
              <Text style={styles.headerSub}>
                Calculations on logins, active Dhobi users, years, Nepal, Andhra, boys & girls
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={28} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Mode Tabs: Overview Analytics vs Full Student Roster */}
          <View style={styles.topTabsBar}>
            <TouchableOpacity
              style={[styles.topTab, activeTab === 'OVERVIEW' && styles.topTabActive]}
              onPress={() => setActiveTab('OVERVIEW')}
            >
              <Ionicons
                name="bar-chart"
                size={16}
                color={activeTab === 'OVERVIEW' ? '#2563EB' : '#64748B'}
              />
              <Text style={[styles.topTabText, activeTab === 'OVERVIEW' && styles.topTabTextActive]}>
                Demographic Overview
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.topTab, activeTab === 'ROSTER' && styles.topTabActive]}
              onPress={() => setActiveTab('ROSTER')}
            >
              <Ionicons
                name="people"
                size={16}
                color={activeTab === 'ROSTER' ? '#2563EB' : '#64748B'}
              />
              <Text style={[styles.topTabText, activeTab === 'ROSTER' && styles.topTabTextActive]}>
                Student Roster ({filteredStudents.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'OVERVIEW' ? (
              /* ==================================================== */
              /* 📊 DEMOGRAPHIC OVERVIEW & CALCULATIONS VIEW          */
              /* ==================================================== */
              <View style={styles.overviewContainer}>
                {/* 1. Master Usage Cards */}
                <View style={styles.masterMetricsGrid}>
                  {/* Total Logged-in Students */}
                  <View style={[styles.masterCard, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
                    <View style={styles.masterCardTop}>
                      <Ionicons name="person-add" size={20} color="#4338CA" />
                      <Text style={[styles.masterCardNum, { color: '#4338CA' }]}>
                        {stats.totalStudents}
                      </Text>
                    </View>
                    <Text style={styles.masterCardLabel}>Total Registered Students</Text>
                    <Text style={styles.masterCardSub}>Logged in to VASTRA Portal</Text>
                  </View>

                  {/* Active Dhobi Users */}
                  <View style={[styles.masterCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                    <View style={styles.masterCardTop}>
                      <Ionicons name="shirt" size={20} color="#15803D" />
                      <Text style={[styles.masterCardNum, { color: '#15803D' }]}>
                        {stats.activeDhobiUsers}
                      </Text>
                    </View>
                    <Text style={styles.masterCardLabel}>Used Dhobi Service</Text>
                    <Text style={styles.masterCardSub}>
                      {((stats.activeDhobiUsers / (stats.totalStudents || 1)) * 100).toFixed(0)}% Adoption Rate
                    </Text>
                  </View>

                  {/* Inactive Students */}
                  <View style={[styles.masterCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                    <View style={styles.masterCardTop}>
                      <Ionicons name="hourglass-outline" size={20} color="#B45309" />
                      <Text style={[styles.masterCardNum, { color: '#B45309' }]}>
                        {stats.inactiveUsers}
                      </Text>
                    </View>
                    <Text style={styles.masterCardLabel}>Not Used Yet</Text>
                    <Text style={styles.masterCardSub}>Registered but 0 drop-offs</Text>
                  </View>

                  {/* Total Clothes Washed */}
                  <View style={[styles.masterCard, { backgroundColor: '#FAF5FF', borderColor: '#E9D5FF' }]}>
                    <View style={styles.masterCardTop}>
                      <Ionicons name="water" size={20} color="#7C3AED" />
                      <Text style={[styles.masterCardNum, { color: '#7C3AED' }]}>
                        {stats.totalClothesWashed}
                      </Text>
                    </View>
                    <Text style={styles.masterCardLabel}>Total Clothes Washed</Text>
                    <Text style={styles.masterCardSub}>Across all hostel blocks</Text>
                  </View>
                </View>

                {/* 2. 👦 Boys vs 👧 Girls Demographics */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionCardTitle}>🚻 Gender & Hostel Demographics</Text>
                  <View style={styles.genderRow}>
                    <View style={[styles.genderCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                      <Text style={styles.genderIcon}>👦</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.genderTitle}>Boys (Male Hostel)</Text>
                        <Text style={[styles.genderCount, { color: '#1D4ED8' }]}>
                          {stats.boysCount} Students
                        </Text>
                        <Text style={styles.genderPercent}>
                          {((stats.boysCount / (stats.totalStudents || 1)) * 100).toFixed(1)}% of campus
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.genderCard, { backgroundColor: '#FDF2F8', borderColor: '#FBCFE8' }]}>
                      <Text style={styles.genderIcon}>👧</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.genderTitle}>Girls (Female Hostel)</Text>
                        <Text style={[styles.genderCount, { color: '#BE185D' }]}>
                          {stats.girlsCount} Students
                        </Text>
                        <Text style={styles.genderPercent}>
                          {((stats.girlsCount / (stats.totalStudents || 1)) * 100).toFixed(1)}% of campus
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 3. 🌍 State & International Region Breakdown (Nepal, Andhra, Tamil Nadu, Bihar, etc.) */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionCardTitle}>🏔️ State & Regional Demographics</Text>
                  <View style={styles.barsList}>
                    {Object.entries(stats.locationCounts).map(([loc, count]) => {
                      const pct = ((count / (stats.totalStudents || 1)) * 100).toFixed(0);
                      const isNepal = loc.includes('Nepal');
                      const isAndhra = loc.includes('Andhra');

                      return (
                        <View key={loc} style={styles.barItem}>
                          <View style={styles.barItemHeader}>
                            <Text style={styles.barItemLabel}>
                              {isNepal ? '🏔️ ' : isAndhra ? '🌴 ' : '📍 '}
                              {loc}
                            </Text>
                            <Text style={styles.barItemValue}>
                              {count} Students ({pct}%)
                            </Text>
                          </View>
                          <View style={styles.progressBarTrack}>
                            <View
                              style={[
                                styles.progressBarFill,
                                {
                                  width: `${Math.max(4, Number(pct))}%`,
                                  backgroundColor: isNepal ? '#EA580C' : isAndhra ? '#16A34A' : '#2563EB',
                                },
                              ]}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* 4. 🎓 Academic Year & Course Demographics */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionCardTitle}>🎓 Academic Year & Batch Distribution</Text>
                  <View style={styles.yearsGrid}>
                    {Object.entries(stats.yearCounts).map(([yr, count]) => (
                      <View key={yr} style={styles.yearPillBox}>
                        <Text style={styles.yearPillNum}>{count}</Text>
                        <Text style={styles.yearPillLabel}>{yr}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ) : (
              /* ==================================================== */
              /* 👥 FULL STUDENT ROSTER & SEARCH DIRECTORY            */
              /* ==================================================== */
              <View style={styles.rosterContainer}>
                {/* Search Bar */}
                <View style={styles.searchBar}>
                  <Ionicons name="search" size={18} color="#64748B" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name, roll no, email, phone, branch, room..."
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

                {/* Filter Chips Bar */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
                  {/* Usage Filter */}
                  {[
                    { id: 'ALL', label: 'All Students' },
                    { id: 'ACTIVE', label: '🧺 Used Dhobi' },
                    { id: 'INACTIVE', label: '💤 Not Used' },
                  ].map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      style={[styles.filterChip, filterUsage === f.id && styles.filterChipActive]}
                      onPress={() => setFilterUsage(f.id)}
                    >
                      <Text style={[styles.filterChipText, filterUsage === f.id && styles.filterChipTextActive]}>
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  {/* Gender Filter */}
                  {[
                    { id: 'ALL', label: 'All Genders' },
                    { id: 'male', label: '👦 Boys Hostel' },
                    { id: 'female', label: '👧 Girls Hostel' },
                  ].map((g) => (
                    <TouchableOpacity
                      key={g.id}
                      style={[styles.filterChip, filterGender === g.id && styles.filterChipActive]}
                      onPress={() => setFilterGender(g.id)}
                    >
                      <Text style={[styles.filterChipText, filterGender === g.id && styles.filterChipTextActive]}>
                        {g.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Student Cards */}
                <View style={styles.studentCardsList}>
                  {filteredStudents.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Ionicons name="people-outline" size={36} color="#94A3B8" />
                      <Text style={styles.emptyTitle}>No Students Found</Text>
                      <Text style={styles.emptySub}>Try adjusting your search filters.</Text>
                    </View>
                  ) : (
                    filteredStudents.map((st) => (
                      <View key={st.key} style={styles.studentRosterCard}>
                        <View style={styles.rosterTop}>
                          <View style={styles.avatarWrap}>
                            <Text style={styles.avatarIcon}>{st.gender === 'female' ? '👧' : '👦'}</Text>
                          </View>

                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={styles.rosterName}>{st.student_name}</Text>
                              <View style={styles.rollBadge}>
                                <Text style={styles.rollBadgeText}>{st.student_id}</Text>
                              </View>
                            </View>
                            <Text style={styles.rosterCourse}>
                              {st.academic_year} • {st.branch || 'CSE'}
                            </Text>
                            <Text style={styles.rosterBlock}>
                              🏢 {st.hostel_block} • Room {st.room_number} (📍 {st.location})
                            </Text>
                          </View>

                          {/* Used Dhobi Badge */}
                          <View
                            style={[
                              styles.dhobiStatusBadge,
                              { backgroundColor: st.usedDhobi ? '#DCFCE7' : '#F1F5F9' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.dhobiStatusText,
                                { color: st.usedDhobi ? '#15803D' : '#64748B' },
                              ]}
                            >
                              {st.usedDhobi ? `🧺 ${st.totalBookings} Orders` : '💤 Not Used'}
                            </Text>
                          </View>
                        </View>

                        {/* Contact Meta */}
                        <View style={styles.rosterContactRow}>
                          {st.phone_number ? (
                            <Text style={styles.rosterContactText}>📞 {st.phone_number}</Text>
                          ) : null}
                          {st.student_email ? (
                            <Text style={styles.rosterContactText} numberOfLines={1}>
                              ✉️ {st.student_email}
                            </Text>
                          ) : null}
                          {st.usedDhobi ? (
                            <Text style={[styles.rosterContactText, { color: '#4338CA', fontWeight: '800' }]}>
                              👕 {st.totalClothes} Clothes Washed
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>
            )}
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
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  headerTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
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
  topTabsBar: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  topTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  topTabActive: {
    backgroundColor: '#FFFFFF',
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    elevation: 2,
  },
  topTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  topTabTextActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
  modalScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  overviewContainer: {
    gap: 14,
  },
  masterMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  masterCard: {
    width: '48.5%',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
  },
  masterCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  masterCardNum: {
    fontSize: 22,
    fontWeight: '900',
  },
  masterCardLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
  },
  masterCardSub: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    gap: 12,
  },
  sectionCardTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
  },
  genderIcon: {
    fontSize: 28,
  },
  genderTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#334155',
  },
  genderCount: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  genderPercent: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '600',
  },
  barsList: {
    gap: 10,
  },
  barItem: {
    gap: 4,
  },
  barItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barItemLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  barItemValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  yearPillBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    minWidth: '30%',
    flex: 1,
  },
  yearPillNum: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2563EB',
  },
  yearPillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },

  /* Roster Styles */
  rosterContainer: {
    gap: 12,
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
  filterChipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 4,
  },
  filterChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  studentCardsList: {
    gap: 10,
  },
  studentRosterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
    gap: 8,
  },
  rosterTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontSize: 20,
  },
  rosterName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  rollBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rollBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#475569',
  },
  rosterCourse: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '700',
    marginTop: 2,
  },
  rosterBlock: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  dhobiStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dhobiStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  rosterContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  rosterContactText: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#475569',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 3,
  },
});

export default AdminStudentCensusModal;
