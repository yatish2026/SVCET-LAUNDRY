import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../constants/theme';
import { useLaundry } from '../../context/LaundryContext';
import { useAuth } from '../../context/AuthContext';
import { ACADEMIC_YEARS, getYearConfig } from '../../constants/schedule';

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
    refreshData,
  } = useLaundry();

  const [refreshing, setRefreshing] = React.useState(false);

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
      {/* 🌟 Top Greeting Card (Matching Student Curved Squircle UI) */}
      <View style={styles.greetingCard}>
        <View style={styles.greetingTopRow}>
          <View>
            <Text style={styles.greetingName}>Hi {staffName},</Text>
            <Text style={styles.greetingSub}>{currentDateStr} • Campus Laundry Staff</Text>
          </View>
          <View style={styles.weatherBadge}>
            <Text style={styles.weatherIcon}>🌤️</Text>
            <View style={{ marginLeft: 4 }}>
              <Text style={styles.weatherTemp}>31° C</Text>
              <Text style={styles.weatherSub}>Campus</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <TouchableOpacity
          style={styles.viewScheduleRow}
          onPress={onNavigateToReports}
          activeOpacity={0.7}
        >
          <Text style={styles.viewScheduleText}>
            📊 Campus Laundry Overview ({bookings.length} Total Submissions)
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#4338CA" />
        </TouchableOpacity>
      </View>

      {/* 📌 ESSENTIALS SECTION (2x2 Grid of Curated Squircles) */}
      <Text style={styles.sectionHeader}>STAFF ESSENTIALS</Text>

      <View style={styles.essentialsGrid}>
        {/* Card 1: Review Approvals (Royal Iris Violet Squircle) */}
        <TouchableOpacity
          style={[styles.pastelCard, styles.pastelViolet]}
          onPress={onNavigateToApprovals}
          activeOpacity={0.85}
        >
          <View style={[styles.iconBox, { backgroundColor: '#7C3AED' }]}>
            <Ionicons name="checkmark-done-circle" size={20} color="#FFF" />
          </View>

          <Text style={styles.cardMainTitle}>Approvals</Text>

          <View style={styles.cardMetricRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardMetricLabel}>Pending</Text>
              <Text style={[styles.cardMetricVal, { color: '#6B21A8' }]}>
                {pendingCount} Requests
              </Text>
            </View>
            {pendingCount > 0 ? (
              <View style={styles.alertDot}>
                <Text style={styles.alertDotText}>{pendingCount}</Text>
              </View>
            ) : (
              <Ionicons name="checkmark-circle-outline" size={16} color="#7C3AED" />
            )}
          </View>

          <Text style={styles.cardFooterSub}>Review & Accept Clothes</Text>
        </TouchableOpacity>

        {/* Card 2: Student Submissions (Ocean Azure Sky Squircle) */}
        <TouchableOpacity
          style={[styles.pastelCard, styles.pastelAzure]}
          onPress={onNavigateToSubmissions}
          activeOpacity={0.85}
        >
          <View style={[styles.iconBox, { backgroundColor: '#0284C7' }]}>
            <Ionicons name="list" size={20} color="#FFF" />
          </View>

          <Text style={styles.cardMainTitle}>Submissions</Text>

          <View style={styles.cardMetricRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardMetricLabel}>Active Orders</Text>
              <Text style={[styles.cardMetricVal, { color: '#075985' }]}>
                {activeCount} Active
              </Text>
            </View>
            <Ionicons name="folder-outline" size={16} color="#0284C7" />
          </View>

          <Text style={styles.cardFooterSub}>Search & Intake Checklist</Text>
        </TouchableOpacity>

        {/* Card 3: Download Reports (Fresh Matcha Emerald Squircle) */}
        <TouchableOpacity
          style={[styles.pastelCard, styles.pastelMatcha]}
          onPress={onNavigateToReports}
          activeOpacity={0.85}
        >
          <View style={[styles.iconBox, { backgroundColor: '#16A34A' }]}>
            <Ionicons name="download" size={20} color="#FFF" />
          </View>

          <Text style={styles.cardMainTitle}>Reports Export</Text>

          <View style={styles.cardMetricRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardMetricLabel}>Format</Text>
              <Text style={[styles.cardMetricVal, { color: '#166534' }]}>Excel .CSV</Text>
            </View>
            <Ionicons name="document-text-outline" size={16} color="#16A34A" />
          </View>

          <Text style={styles.cardFooterSub}>Export Student Records</Text>
        </TouchableOpacity>

        {/* Card 4: Total Campus Load (Warm Sunset Coral Squircle) */}
        <TouchableOpacity
          style={[styles.pastelCard, styles.pastelSunset]}
          onPress={onNavigateToSubmissions}
          activeOpacity={0.85}
        >
          <View style={[styles.iconBox, { backgroundColor: '#EA580C' }]}>
            <Ionicons name="shirt" size={20} color="#FFF" />
          </View>

          <Text style={styles.cardMainTitle}>Total Load</Text>

          <View style={styles.cardMetricRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardMetricLabel}>Grand Total</Text>
              <Text style={[styles.cardMetricVal, { color: '#9A3412' }]}>
                {grandTotalClothes} Clothes
              </Text>
            </View>
            <Ionicons name="stats-chart-outline" size={16} color="#EA580C" />
          </View>

          <Text style={styles.cardFooterSub}>{readyCount} Bags Ready Pickup</Text>
        </TouchableOpacity>
      </View>

      {/* 📊 Year-Wise Breakdown Section */}
      <Text style={styles.sectionHeader}>COLLEGE YEAR BREAKDOWN</Text>

      <View style={styles.yearGrid}>
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
                { backgroundColor: theme.bg, borderColor: theme.border },
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
      </View>
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
    borderRadius: 32,
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
    color: '#4338CA',
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
    backgroundColor: '#FFEAD5',
    borderColor: '#FDBA74',
  },
  pastelMatcha: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  pastelViolet: {
    backgroundColor: '#F3E8FF',
    borderColor: '#D8B4FE',
  },
  pastelAzure: {
    backgroundColor: '#E0F2FE',
    borderColor: '#7DD3FC',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 1,
  },
  alertDot: {
    backgroundColor: '#EF4444',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  alertDotText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  cardFooterSub: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
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
});

export default AdminDashboardScreen;
