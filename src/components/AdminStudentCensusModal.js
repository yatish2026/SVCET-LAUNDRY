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
  const [showFilterPickerModal, setShowFilterPickerModal] = useState(false);
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

    // 2. Process all registered accounts from backend
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
        if (u.email && !map[key].student_email) map[key].student_email = u.email;
        if (u.gender) map[key].gender = u.gender.toLowerCase();
        if (u.location) map[key].location = u.location;
        if (u.branch) map[key].branch = u.branch;
        if (u.academic_year) map[key].academic_year = u.academic_year;
      }
    });

    return Object.values(map);
  }, [bookings, registeredUsers]);

  // Global Census Metrics Calculations
  const stats = useMemo(() => {
    const totalStudents = studentCensusList.length;
    let activeDhobiUsers = 0;
    let inactiveUsers = 0;
    let totalClothesWashed = 0;
    let boysCount = 0;
    let girlsCount = 0;

    const locationCounts = {
      'Andhra Pradesh': 0,
      'Tamil Nadu': 0,
      'Kerala': 0,
      'Bihar': 0,
      'Nepal': 0,
      'Andaman & Nicobar': 0,
      'Other States / International': 0,
    };

    const yearCounts = {
      '1st Year': 0,
      '2nd Year': 0,
      '3rd Year': 0,
      '4th Year': 0,
      'Diploma': 0,
      'MBA/MCA': 0,
      'Pharmacy/Nursing': 0,
      'Other': 0,
    };

    const branchCounts = {};

    studentCensusList.forEach((st) => {
      if (st.usedDhobi) {
        activeDhobiUsers++;
        totalClothesWashed += st.totalClothes;
      } else {
        inactiveUsers++;
      }

      if (st.gender === 'female') {
        girlsCount++;
      } else {
        boysCount++;
      }

      // Location classification
      const loc = st.location || '';
      if (loc.includes('Nepal')) locationCounts['Nepal']++;
      else if (loc.includes('Andhra')) locationCounts['Andhra Pradesh']++;
      else if (loc.includes('Tamil')) locationCounts['Tamil Nadu']++;
      else if (loc.includes('Kerala')) locationCounts['Kerala']++;
      else if (loc.includes('Bihar')) locationCounts['Bihar']++;
      else if (loc.includes('Andaman')) locationCounts['Andaman & Nicobar']++;
      else locationCounts['Other States / International']++;

      // Year classification
      const yr = (st.academic_year || '').toLowerCase();
      if (yr.includes('1st') || yr.includes('first')) yearCounts['1st Year']++;
      else if (yr.includes('2nd') || yr.includes('second')) yearCounts['2nd Year']++;
      else if (yr.includes('3rd') || yr.includes('third')) yearCounts['3rd Year']++;
      else if (yr.includes('4th') || yr.includes('fourth') || yr.includes('final')) yearCounts['4th Year']++;
      else if (yr.includes('diploma')) yearCounts['Diploma']++;
      else if (yr.includes('mba') || yr.includes('mca')) yearCounts['MBA/MCA']++;
      else if (yr.includes('pharmacy') || yr.includes('nursing')) yearCounts['Pharmacy/Nursing']++;
      else yearCounts['Other']++;

      // Branch classification
      const br = st.branch || 'General';
      branchCounts[br] = (branchCounts[br] || 0) + 1;
    });

    return {
      totalStudents,
      activeDhobiUsers,
      inactiveUsers,
      totalClothesWashed,
      boysCount,
      girlsCount,
      locationCounts,
      yearCounts,
      branchCounts,
    };
  }, [studentCensusList]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let cnt = 0;
    if (filterUsage !== 'ALL') cnt++;
    if (filterGender !== 'ALL') cnt++;
    if (filterYear !== 'ALL') cnt++;
    if (filterLocation !== 'ALL') cnt++;
    return cnt;
  }, [filterUsage, filterGender, filterYear, filterLocation]);

  const handleResetFilters = () => {
    setFilterUsage('ALL');
    setFilterGender('ALL');
    setFilterYear('ALL');
    setFilterLocation('ALL');
    setSearchQuery('');
  };

  // Filtered roster for search tab
  const filteredStudents = useMemo(() => {
    return studentCensusList.filter((st) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
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

      const matchGender = filterGender === 'ALL' || st.gender === filterGender;

      let matchYear = true;
      if (filterYear !== 'ALL') {
        const yLower = (st.academic_year || '').toLowerCase();
        const fLower = filterYear.toLowerCase();
        matchYear = yLower.includes(fLower);
      }

      let matchLocation = true;
      if (filterLocation !== 'ALL') {
        const lLower = (st.location || '').toLowerCase();
        const fLower = filterLocation.toLowerCase();
        matchLocation = lLower.includes(fLower);
      }

      return matchSearch && matchUsage && matchGender && matchYear && matchLocation;
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
              <Text style={styles.headerTitle}>Student Census & Login Hub</Text>
              <Text style={styles.headerSub}>
                Total logins, Dhobi adoption, Nepal, Andhra, boys & girls
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={28} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs (Overview vs Full Roster) */}
          <View style={styles.navTabsRow}>
            <TouchableOpacity
              style={[styles.navTab, activeTab === 'OVERVIEW' && styles.navTabActive]}
              onPress={() => setActiveTab('OVERVIEW')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="analytics-outline"
                size={16}
                color={activeTab === 'OVERVIEW' ? '#2563EB' : '#64748B'}
              />
              <Text
                style={[
                  styles.navTabText,
                  activeTab === 'OVERVIEW' && styles.navTabTextActive,
                ]}
              >
                Demographic Overview
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navTab, activeTab === 'ROSTER' && styles.navTabActive]}
              onPress={() => setActiveTab('ROSTER')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="people-outline"
                size={16}
                color={activeTab === 'ROSTER' ? '#2563EB' : '#64748B'}
              />
              <Text
                style={[
                  styles.navTabText,
                  activeTab === 'ROSTER' && styles.navTabTextActive,
                ]}
              >
                Student Roster ({studentCensusList.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab 1: Demographic Overview */}
          {activeTab === 'OVERVIEW' ? (
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* 1. Master Metric Overview Cards */}
              <View style={styles.masterMetricsGrid}>
                {/* Total Logged In */}
                <View style={[styles.masterCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                  <View style={styles.masterCardTop}>
                    <Ionicons name="people" size={20} color="#2563EB" />
                    <Text style={[styles.masterCardNum, { color: '#2563EB' }]}>
                      {stats.totalStudents}
                    </Text>
                  </View>
                  <Text style={styles.masterCardLabel}>Total Logged In</Text>
                  <Text style={styles.masterCardSub}>Registered accounts</Text>
                </View>

                {/* Used Dhobi */}
                <View style={[styles.masterCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                  <View style={styles.masterCardTop}>
                    <Ionicons name="checkmark-done-circle" size={20} color="#15803D" />
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

              {/* 3. 🌍 State & International Region Breakdown */}
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
            </ScrollView>
          ) : (
            /* Tab 2: Full Student Roster & Search Directory */
            <View style={styles.rosterContainer}>
              {/* Search & Filter Bar */}
              <View style={styles.searchSection}>
                <View style={styles.searchRow}>
                  {/* Search Bar */}
                  <View style={styles.searchBar}>
                    <Ionicons name="search" size={18} color="#64748B" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search name, roll ID, email, branch..."
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

                  {/* ⚙️ Filter Button */}
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
                      color={activeFiltersCount > 0 ? '#FFF' : '#2563EB'}
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

                {/* Active Filter summary */}
                {activeFiltersCount > 0 || searchQuery ? (
                  <View style={styles.activeFiltersBar}>
                    <View style={styles.activeFilterPill}>
                      <Text style={styles.activeFilterPillText} numberOfLines={1}>
                        Filtered: {filterUsage !== 'ALL' ? filterUsage : 'All Usage'}
                        {filterGender !== 'ALL' ? ` • ${filterGender === 'male' ? 'Boys' : 'Girls'}` : ''}
                        {filterYear !== 'ALL' ? ` • ${filterYear}` : ''}
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

              {/* Student Cards */}
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {filteredStudents.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Ionicons name="people-outline" size={36} color="#94A3B8" />
                    <Text style={styles.emptyTitle}>No Students Found</Text>
                    <Text style={styles.emptySub}>Try adjusting your filter selection.</Text>
                  </View>
                ) : (
                  filteredStudents.map((st) => (
                    <View key={st.key} style={styles.studentRosterCard}>
                      <View style={styles.rosterTop}>
                        <View style={styles.avatarWrap}>
                          <Text style={styles.avatarIcon}>{st.gender === 'female' ? '👧' : '👦'}</Text>
                        </View>

                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
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

                        <View
                          style={[
                            styles.usageBadge,
                            st.usedDhobi ? styles.usageActive : styles.usageInactive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.usageBadgeText,
                              st.usedDhobi ? styles.usageActiveText : styles.usageInactiveText,
                            ]}
                          >
                            {st.usedDhobi ? 'Used Dhobi' : 'Not Used'}
                          </Text>
                        </View>
                      </View>

                      {/* Contact and clothes details */}
                      <View style={styles.rosterMetaRow}>
                        <View style={styles.metaItem}>
                          <Ionicons name="mail-outline" size={13} color="#64748B" />
                          <Text style={styles.metaText} numberOfLines={1}>
                            {st.student_email || 'No email'}
                          </Text>
                        </View>

                        <View style={styles.metaItem}>
                          <Ionicons name="shirt-outline" size={13} color="#2563EB" />
                          <Text style={[styles.metaText, { color: '#2563EB', fontWeight: '800' }]}>
                            {st.totalClothes} Clothes ({st.totalBookings} Bags)
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          )}

          {/* 🎛️ Filter Bottom Sheet Modal */}
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
                    <Ionicons name="options" size={20} color="#2563EB" />
                    <Text style={styles.filterModalTitle}>Filter Student Roster</Text>
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
                  {/* 1. Dhobi Usage Filter */}
                  <View>
                    <Text style={styles.filterGroupTitle}>🧺 Dhobi Service Usage:</Text>
                    <View style={styles.filterOptionsGrid}>
                      {[
                        { id: 'ALL', label: 'All Registered Students' },
                        { id: 'ACTIVE', label: '🧺 Used Dhobi Service' },
                        { id: 'INACTIVE', label: '💤 Not Used (0 Drop-offs)' },
                      ].map((opt) => (
                        <TouchableOpacity
                          key={opt.id}
                          style={[
                            styles.filterOptionItem,
                            filterUsage === opt.id && styles.filterOptionItemSelected,
                          ]}
                          onPress={() => setFilterUsage(opt.id)}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.filterOptionText,
                              filterUsage === opt.id && styles.filterOptionTextSelected,
                            ]}
                          >
                            {opt.label}
                          </Text>
                          {filterUsage === opt.id ? (
                            <Ionicons name="checkmark-circle" size={18} color="#2563EB" />
                          ) : null}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* 2. Gender & Hostel Filter */}
                  <View>
                    <Text style={styles.filterGroupTitle}>🚻 Gender & Hostel:</Text>
                    <View style={styles.filterOptionsGrid}>
                      {[
                        { id: 'ALL', label: 'All Genders (Campus-wide)' },
                        { id: 'male', label: '👦 Boys Hostel (Male Students)' },
                        { id: 'female', label: '👧 Girls Hostel (Female Students)' },
                      ].map((opt) => (
                        <TouchableOpacity
                          key={opt.id}
                          style={[
                            styles.filterOptionItem,
                            filterGender === opt.id && styles.filterOptionItemSelected,
                          ]}
                          onPress={() => setFilterGender(opt.id)}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.filterOptionText,
                              filterGender === opt.id && styles.filterOptionTextSelected,
                            ]}
                          >
                            {opt.label}
                          </Text>
                          {filterGender === opt.id ? (
                            <Ionicons name="checkmark-circle" size={18} color="#2563EB" />
                          ) : null}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* 3. Academic Year & Course */}
                  <View>
                    <Text style={styles.filterGroupTitle}>🎓 Course & Academic Year:</Text>
                    <View style={styles.filterOptionsGrid}>
                      {['ALL', ...ACADEMIC_COURSES].map((yr) => (
                        <TouchableOpacity
                          key={yr}
                          style={[
                            styles.filterOptionItem,
                            filterYear === yr && styles.filterOptionItemSelected,
                          ]}
                          onPress={() => setFilterYear(yr)}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.filterOptionText,
                              filterYear === yr && styles.filterOptionTextSelected,
                            ]}
                          >
                            {yr === 'ALL' ? 'All Academic Courses' : yr}
                          </Text>
                          {filterYear === yr ? (
                            <Ionicons name="checkmark-circle" size={18} color="#2563EB" />
                          ) : null}
                        </TouchableOpacity>
                      ))}
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
  navTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  navTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  navTabActive: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2.5,
    borderBottomColor: '#2563EB',
  },
  navTabText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  navTabTextActive: {
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
  masterMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  masterCard: {
    width: '48.5%',
    borderRadius: 16,
    padding: 14,
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
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  masterCardSub: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  sectionCardTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    gap: 10,
  },
  genderIcon: {
    fontSize: 26,
  },
  genderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  genderCount: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 1,
  },
  genderPercent: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '600',
  },
  barsList: {
    gap: 8,
  },
  barItem: {
    gap: 4,
  },
  barItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  barItemLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  barItemValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  progressBarTrack: {
    height: 8,
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
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  yearPillNum: {
    fontSize: 13,
    fontWeight: '900',
    color: '#2563EB',
  },
  yearPillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },

  /* Roster Styles */
  rosterContainer: {
    flex: 1,
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
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  filterButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterButtonText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#2563EB',
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
    color: '#2563EB',
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
  studentRosterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  rosterTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
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
    marginTop: 1,
  },
  rosterBlock: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  usageBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  usageActive: {
    backgroundColor: '#DCFCE7',
  },
  usageInactive: {
    backgroundColor: '#FEF3C7',
  },
  usageBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  usageActiveText: {
    color: '#15803D',
  },
  usageInactiveText: {
    color: '#B45309',
  },
  rosterMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  metaText: {
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
    textAlign: 'center',
    marginTop: 3,
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
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  filterOptionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  filterOptionTextSelected: {
    color: '#2563EB',
    fontWeight: '900',
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
    backgroundColor: '#2563EB',
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

export default AdminStudentCensusModal;
