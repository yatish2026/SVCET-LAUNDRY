import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../constants/theme';

const STAGES = [
  { key: 'pending_approval', label: 'Requested', icon: 'document-text' },
  { key: 'dropoff_scheduled', label: 'Slot Set', icon: 'calendar' },
  { key: 'in_wash', label: 'In Wash', icon: 'water' },
  { key: 'drying_ironing', label: 'Drying', icon: 'flash' },
  { key: 'ready_for_pickup', label: 'Ready', icon: 'gift' },
];

const STAGE_ORDER = {
  pending_approval: 0,
  dropoff_scheduled: 1,
  in_wash: 2,
  drying_ironing: 3,
  ready_for_pickup: 4,
  completed: 5,
};

export const StepTracker = ({ currentStatus }) => {
  const currentIndex = STAGE_ORDER[currentStatus] ?? 0;
  const isCancelled = currentStatus === 'cancelled';

  if (isCancelled) {
    return (
      <View style={styles.cancelledBox}>
        <Ionicons name="close-circle" size={20} color={THEME.colors.accent} />
        <Text style={styles.cancelledText}>This booking was cancelled</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {STAGES.map((stage, idx) => {
          const isDone = currentIndex > idx || currentStatus === 'completed';
          const isCurrent = currentIndex === idx && currentStatus !== 'completed';
          const isPending = currentIndex < idx && currentStatus !== 'completed';

          return (
            <React.Fragment key={stage.key}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.node,
                    isDone && styles.nodeDone,
                    isCurrent && styles.nodeCurrent,
                    isPending && styles.nodePending,
                  ]}
                >
                  {isDone ? (
                    <Ionicons name="checkmark" size={14} color={THEME.colors.textInverse} />
                  ) : (
                    <Ionicons
                      name={stage.icon}
                      size={13}
                      color={isCurrent ? THEME.colors.primaryDark : THEME.colors.textMuted}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isCurrent && styles.labelCurrent,
                    isDone && styles.labelDone,
                  ]}
                  numberOfLines={1}
                >
                  {stage.label}
                </Text>
              </View>

              {idx < STAGES.length - 1 && (
                <View
                  style={[
                    styles.connectingLine,
                    currentIndex > idx ? styles.lineDone : styles.linePending,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.xs,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    width: 52,
  },
  node: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 4,
  },
  nodeDone: {
    backgroundColor: THEME.colors.secondary,
    borderColor: THEME.colors.secondary,
  },
  nodeCurrent: {
    backgroundColor: THEME.colors.primarySoft,
    borderColor: THEME.colors.primary,
  },
  nodePending: {
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.border,
  },
  connectingLine: {
    flex: 1,
    height: 3,
    marginBottom: 18,
    marginHorizontal: -2,
  },
  lineDone: {
    backgroundColor: THEME.colors.secondary,
  },
  linePending: {
    backgroundColor: THEME.colors.border,
  },
  stepLabel: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '500',
    textAlign: 'center',
  },
  labelCurrent: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  labelDone: {
    color: THEME.colors.secondary,
    fontWeight: '600',
  },
  cancelledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.accentSoft,
    padding: THEME.spacing.md,
    borderRadius: THEME.radius.md,
  },
  cancelledText: {
    marginLeft: 8,
    color: THEME.colors.accent,
    fontWeight: '600',
  },
});

export default StepTracker;
