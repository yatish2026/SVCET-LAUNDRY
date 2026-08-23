import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../constants/theme';

export const SlotCard = ({ slot, isSelected, onSelect }) => {
  const isFull = slot.available <= 0;
  const isFastFilling = slot.available <= 5 && !isFull;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected,
        isFull && styles.cardDisabled,
      ]}
      onPress={() => !isFull && onSelect(slot)}
      disabled={isFull}
      activeOpacity={0.8}
    >
      <View style={styles.topRow}>
        <View style={styles.dateTag}>
          <Text style={styles.dateText}>{slot.date}</Text>
          <Text style={styles.shiftText}> • {slot.shift}</Text>
        </View>

        {isSelected ? (
          <View style={styles.selectedCircle}>
            <Ionicons name="checkmark-circle" size={20} color={THEME.colors.primary} />
          </View>
        ) : isFull ? (
          <View style={styles.fullBadge}>
            <Text style={styles.fullText}>Full</Text>
          </View>
        ) : (
          <View style={styles.emptyCircle} />
        )}
      </View>

      <Text style={[styles.timeText, isSelected && styles.timeTextSelected]}>{slot.time}</Text>

      <View style={styles.bottomRow}>
        <View style={styles.capacityBarWrap}>
          <View
            style={[
              styles.capacityBarFill,
              {
                width: `${Math.min(100, ((slot.max - slot.available) / slot.max) * 100)}%`,
                backgroundColor: isFull
                  ? THEME.colors.accent
                  : isFastFilling
                  ? '#F59E0B'
                  : THEME.colors.secondary,
              },
            ]}
          />
        </View>
        <Text style={[styles.spotsText, isFastFilling && styles.fastFillingText]}>
          {isFull ? '0 spots left' : `${slot.available} spots left`}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.radius.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    ...THEME.shadows.sm,
  },
  cardSelected: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primarySoft,
  },
  cardDisabled: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderColor: THEME.colors.border,
    opacity: 0.6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dateTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: THEME.typography.sizes.xs,
    fontWeight: '700',
    color: THEME.colors.primaryDark,
    textTransform: 'uppercase',
  },
  shiftText: {
    fontSize: THEME.typography.sizes.xs,
    color: THEME.colors.textMuted,
  },
  timeText: {
    fontSize: THEME.typography.sizes.lg,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginVertical: 4,
  },
  timeTextSelected: {
    color: THEME.colors.primaryDark,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  capacityBarWrap: {
    flex: 1,
    height: 5,
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: 3,
    marginRight: 10,
    overflow: 'hidden',
  },
  capacityBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  spotsText: {
    fontSize: THEME.typography.sizes.xs,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  fastFillingText: {
    color: '#D97706',
    fontWeight: '700',
  },
  emptyCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: THEME.colors.textMuted,
  },
  selectedCircle: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullBadge: {
    backgroundColor: THEME.colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: THEME.radius.xs,
  },
  fullText: {
    fontSize: 10,
    color: THEME.colors.accent,
    fontWeight: '700',
  },
});

export default SlotCard;
