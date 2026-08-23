import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../constants/theme';
import { ACADEMIC_YEARS, getYearConfig } from '../../constants/schedule';
import { useLaundry } from '../../context/LaundryContext';

export const SlotManagerScreen = ({ onBack }) => {
  const { yearWiseStats, grandTotalClothes, totalStudentsCount } = useLaundry();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Year Slot Schedule & Capacity</Text>
          <Text style={styles.headerSub}>Hostel wash days & +2 days pickup rules</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Summary */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Active Load in System</Text>
          <View style={styles.overviewRow}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewVal}>{grandTotalClothes}</Text>
              <Text style={styles.overviewLabel}>Total Clothes Pieces</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <Text style={styles.overviewVal}>{totalStudentsCount}</Text>
              <Text style={styles.overviewLabel}>Active Students</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Weekly Year Roster</Text>

        {ACADEMIC_YEARS.map((yr) => {
          const cfg = getYearConfig(yr);
          const stats = yearWiseStats[yr] || { clothesCount: 0, studentsCount: 0 };

          return (
            <View key={yr} style={styles.yearRosterCard}>
              <View style={styles.rosterHeader}>
                <View
                  style={[
                    styles.rosterYearPill,
                    { backgroundColor: cfg.badgeBg, borderColor: cfg.badgeBorder },
                  ]}
                >
                  <Text style={[styles.rosterYearText, { color: cfg.badgeColor }]}>{yr}</Text>
                </View>
                <View style={styles.rosterStats}>
                  <Text style={styles.rosterClothes}>
                    {stats.clothesCount} clothes • {stats.studentsCount} students
                  </Text>
                </View>
              </View>

              {/* Schedule Days */}
              <View style={styles.daysRow}>
                <View style={styles.dayBox}>
                  <Text style={styles.dayBoxLabel}>DROP-OFF DAY</Text>
                  <Text style={[styles.dayBoxVal, { color: '#1D4ED8' }]}>{cfg.dropoffDay}</Text>
                  <Text style={styles.dayBoxSub}>Intake at Counter 1</Text>
                </View>

                <View style={styles.dayArrow}>
                  <Text style={styles.dayArrowTag}>+2 DAYS</Text>
                  <Ionicons name="arrow-forward" size={16} color="#60A5FA" />
                </View>

                <View style={styles.dayBox}>
                  <Text style={[styles.dayBoxLabel, { color: '#059669' }]}>PICKUP DAY</Text>
                  <Text style={[styles.dayBoxVal, { color: '#059669' }]}>{cfg.pickupDay}</Text>
                  <Text style={styles.dayBoxSub}>Clean & Pressed</Text>
                </View>
              </View>

              {/* Shifts list */}
              <View style={styles.shiftsWrap}>
                <Text style={styles.shiftsTitle}>Operating Shifts:</Text>
                {cfg.shifts.map((s) => (
                  <View key={s.id} style={styles.shiftItem}>
                    <Ionicons name="time-outline" size={14} color={THEME.colors.textSecondary} />
                    <Text style={styles.shiftItemText}>
                      <Text style={{ fontWeight: '700' }}>{s.name}:</Text> {s.time}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  headerSub: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: THEME.spacing.md,
    paddingBottom: 40,
  },
  overviewCard: {
    backgroundColor: '#1E3A8A',
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  overviewTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  overviewItem: {
    alignItems: 'center',
  },
  overviewVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
  },
  overviewLabel: {
    fontSize: 10,
    color: '#BFDBFE',
    marginTop: 1,
  },
  overviewDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 10,
  },
  yearRosterCard: {
    backgroundColor: '#FFF',
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...THEME.shadows.sm,
  },
  rosterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rosterYearPill: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
  },
  rosterYearText: {
    fontSize: 11,
    fontWeight: '800',
  },
  rosterStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rosterClothes: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: THEME.radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  dayBox: {
    flex: 1,
  },
  dayBoxLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: THEME.colors.textMuted,
  },
  dayBoxVal: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  dayBoxSub: {
    fontSize: 9,
    color: THEME.colors.textSecondary,
  },
  dayArrow: {
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  dayArrowTag: {
    fontSize: 8,
    fontWeight: '800',
    color: '#60A5FA',
    marginBottom: 2,
  },
  shiftsWrap: {
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  shiftsTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginBottom: 4,
  },
  shiftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  shiftItemText: {
    fontSize: 11,
    color: THEME.colors.textPrimary,
    marginLeft: 6,
  },
});

export default SlotManagerScreen;
