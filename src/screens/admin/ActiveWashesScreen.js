import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../constants/theme';
import { useLaundry } from '../../context/LaundryContext';
import StatusBadge from '../../components/StatusBadge';

export const ActiveWashesScreen = ({ onBack, onSelectBooking }) => {
  const { bookings, updateOrderStatus } = useLaundry();
  const [selectedStage, setSelectedStage] = useState('in_wash'); // 'scheduled' | 'in_wash' | 'drying' | 'ready'

  const scheduled = bookings.filter(
    (b) => b.status === 'dropoff_scheduled' || b.status === 'pending_approval'
  );
  const inWash = bookings.filter((b) => b.status === 'in_wash');
  const drying = bookings.filter((b) => b.status === 'drying_ironing');
  const ready = bookings.filter((b) => b.status === 'ready_for_pickup');

  const getActiveList = () => {
    switch (selectedStage) {
      case 'scheduled':
        return scheduled;
      case 'in_wash':
        return inWash;
      case 'drying':
        return drying;
      case 'ready':
        return ready;
      default:
        return inWash;
    }
  };

  const list = getActiveList();

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Wash Stage Controller</Text>
          <Text style={styles.headerSub}>Manage machines & process cycles</Text>
        </View>
      </View>

      {/* Stage Progression Tabs */}
      <View style={styles.stagesBar}>
        {[
          { key: 'scheduled', label: 'Drop-off Due', count: scheduled.length, icon: 'calendar-outline' },
          { key: 'in_wash', label: 'In Washer', count: inWash.length, icon: 'water-outline' },
          { key: 'drying', label: 'Drying/Press', count: drying.length, icon: 'flash-outline' },
          { key: 'ready', label: 'Ready Pickup', count: ready.length, icon: 'gift-outline' },
        ].map((stg) => (
          <TouchableOpacity
            key={stg.key}
            style={[styles.stageTab, selectedStage === stg.key && styles.stageTabActive]}
            onPress={() => setSelectedStage(stg.key)}
          >
            <Ionicons
              name={stg.icon}
              size={16}
              color={selectedStage === stg.key ? '#FFF' : THEME.colors.textSecondary}
            />
            <Text
              style={[
                styles.stageTabText,
                selectedStage === stg.key && styles.stageTabTextActive,
              ]}
              numberOfLines={1}
            >
              {stg.label}
            </Text>
            <View
              style={[
                styles.stageBadge,
                selectedStage === stg.key && styles.stageBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.stageBadgeText,
                  selectedStage === stg.key && styles.stageBadgeTextActive,
                ]}
              >
                {stg.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Batches in Current Phase */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {list.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={44} color="#059669" />
            <Text style={styles.emptyTitle}>Stage Clear</Text>
            <Text style={styles.emptySub}>No laundry batches currently in this phase.</Text>
          </View>
        ) : (
          list.map((bkg) => {
            const yearStr = bkg.academic_year || '1st Year';
            return (
              <View key={bkg.id} style={styles.batchCard}>
                <View style={styles.batchTop}>
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.batchToken}>#{bkg.pickup_token}</Text>
                      <View style={styles.yearChip}>
                        <Text style={styles.yearChipText}>{yearStr}</Text>
                      </View>
                    </View>
                    <Text style={styles.studentName}>{bkg.student_name}</Text>
                    <Text style={styles.studentMeta}>
                      {bkg.hostel_block?.split(' ')[0]} • Rm {bkg.room_number}
                    </Text>
                  </View>
                  <StatusBadge status={bkg.status} size="sm" />
                </View>

                <View style={styles.itemsRow}>
                  <Text style={styles.itemsLabel}>Bag Content:</Text>
                  <Text style={styles.itemsVal}>{bkg.total_items} items total</Text>
                </View>

                {bkg.dropoff_slot_time && (
                  <View style={styles.itemsRow}>
                    <Text style={styles.itemsLabel}>Schedule:</Text>
                    <Text style={[styles.itemsVal, { color: '#1D4ED8', fontWeight: '700' }]}>
                      {bkg.dropoff_slot_time.split('(')[0]} (Pickup: {bkg.pickup_slot_time?.split('(')[0] || '2 days'})
                    </Text>
                  </View>
                )}

                {bkg.special_instructions ? (
                  <View style={styles.noteWrap}>
                    <Text style={styles.noteText}>Note: {bkg.special_instructions}</Text>
                  </View>
                ) : null}

                {/* Advance Button */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.detailsBtn}
                    onPress={() => onSelectBooking(bkg.id)}
                  >
                    <Text style={styles.detailsBtnText}>Checklist</Text>
                  </TouchableOpacity>

                  {selectedStage === 'scheduled' && (
                    <TouchableOpacity
                      style={[styles.advanceBtn, { backgroundColor: '#1E40AF' }]}
                      onPress={() => updateOrderStatus(bkg.id, 'in_wash')}
                    >
                      <Ionicons name="water" size={16} color="#FFF" />
                      <Text style={styles.advanceBtnText}>Mark In Washer</Text>
                    </TouchableOpacity>
                  )}

                  {selectedStage === 'in_wash' && (
                    <TouchableOpacity
                      style={[styles.advanceBtn, { backgroundColor: '#7C3AED' }]}
                      onPress={() => updateOrderStatus(bkg.id, 'drying_ironing')}
                    >
                      <Ionicons name="flash" size={16} color="#FFF" />
                      <Text style={styles.advanceBtnText}>Move to Dryer/Iron</Text>
                    </TouchableOpacity>
                  )}

                  {selectedStage === 'drying' && (
                    <TouchableOpacity
                      style={[styles.advanceBtn, { backgroundColor: '#059669' }]}
                      onPress={() =>
                        updateOrderStatus(bkg.id, 'ready_for_pickup', {
                          counter: 'Counter 1',
                        })
                      }
                    >
                      <Ionicons name="gift" size={16} color="#FFF" />
                      <Text style={styles.advanceBtnText}>Mark Ready & Alert</Text>
                    </TouchableOpacity>
                  )}

                  {selectedStage === 'ready' && (
                    <TouchableOpacity
                      style={[styles.advanceBtn, { backgroundColor: '#059669' }]}
                      onPress={() => updateOrderStatus(bkg.id, 'completed')}
                    >
                      <Ionicons name="checkbox" size={16} color="#FFF" />
                      <Text style={styles.advanceBtnText}>Complete Pickup</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
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
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
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
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  headerSub: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  stagesBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 6,
  },
  stageTab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: THEME.radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stageTabActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  stageTabText: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    marginTop: 3,
  },
  stageTabTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
  stageBadge: {
    backgroundColor: '#E2E8F0',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  stageBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  stageBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
  },
  stageBadgeTextActive: {
    color: '#FFF',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: THEME.spacing.md,
    paddingBottom: 40,
  },
  emptyState: {
    backgroundColor: '#FFF',
    borderRadius: THEME.radius.lg,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  batchCard: {
    backgroundColor: '#FFF',
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...THEME.shadows.sm,
  },
  batchTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  batchToken: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  yearChip: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  yearChipText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  studentName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  studentMeta: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  itemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemsLabel: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    width: 80,
  },
  itemsVal: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  noteWrap: {
    backgroundColor: '#FFFBEB',
    padding: 6,
    borderRadius: THEME.radius.xs,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  noteText: {
    fontSize: 10,
    color: '#78350F',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    gap: 8,
  },
  detailsBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: THEME.radius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailsBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  advanceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: THEME.radius.md,
    gap: 4,
  },
  advanceBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
  },
});

export default ActiveWashesScreen;
