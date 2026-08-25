import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import THEME from '../constants/theme';

export const DEFAULT_SCHEDULE_RULES = [
  {
    id: 'monday_batch',
    name: 'B.Tech 1st & 2nd Year',
    icon: 'school',
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    dropoffDay: 'Monday',
    pickupDay: 'Wednesday',
    dropoffSlot: '08:00 AM - 11:30 AM',
    pickupSlot: '04:00 PM - 07:30 PM',
    targetAudience: 'All B.Tech 1st Year & 2nd Year (Boys & Local Hostel)',
    notes: 'Regular 2-Day turnaround cycle',
  },
  {
    id: 'tuesday_batch',
    name: 'B.Tech 3rd & 4th Year (MBA, MCA)',
    icon: 'briefcase',
    color: '#7C3AED',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    dropoffDay: 'Tuesday',
    pickupDay: 'Thursday',
    dropoffSlot: '08:00 AM - 11:30 AM',
    pickupSlot: '04:00 PM - 07:30 PM',
    targetAudience: 'Senior B.Tech 3rd & 4th Year + Postgraduates (MBA, MCA)',
    notes: 'Regular 2-Day turnaround cycle',
  },
  {
    id: 'wednesday_batch',
    name: 'Diploma, Nursing, Pharmacy & Bio-Tech',
    icon: 'medkit',
    color: '#0284C7',
    bg: '#F0F9FF',
    border: '#BAE6FD',
    dropoffDay: 'Wednesday',
    pickupDay: 'Friday',
    dropoffSlot: '08:00 AM - 11:30 AM',
    pickupSlot: '04:00 PM - 07:30 PM',
    targetAudience: 'Diploma 1st/2nd, B.Sc Nursing, B.Pharmacy & Bio-Tech',
    notes: 'Regular 2-Day turnaround cycle',
  },
  {
    id: 'thursday_batch',
    name: 'Girls Hostel (All Branches & Years)',
    icon: 'woman',
    color: '#DB2777',
    bg: '#FDF2F8',
    border: '#FBCFE8',
    dropoffDay: 'Thursday',
    pickupDay: 'Saturday',
    dropoffSlot: '08:00 AM - 11:30 AM',
    pickupSlot: '04:00 PM - 07:30 PM',
    targetAudience: 'All Female Students in Kaveri, Meenakshi & Girls Hostel Blocks',
    notes: 'Exclusive Girls Hostel Wash Day (2-Day turnaround)',
  },
  {
    id: 'friday_batch',
    name: 'Nepal, Andaman & International States',
    icon: 'globe',
    color: '#059669',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    dropoffDay: 'Friday',
    pickupDay: 'Monday',
    dropoffSlot: '08:00 AM - 11:30 AM',
    pickupSlot: '04:00 PM - 07:30 PM',
    targetAudience: 'Nepal Hostel, Andaman & Nicobar, South Africa & Other States',
    notes: 'Weekend Processing Batch (Returns Monday)',
  },
  {
    id: 'saturday_batch',
    name: 'Bihar State Hostel Batch',
    icon: 'leaf',
    color: '#D97706',
    bg: '#FEF3C7',
    border: '#FDE68A',
    dropoffDay: 'Saturday',
    pickupDay: 'Tuesday',
    dropoffSlot: '08:00 AM - 11:30 AM',
    pickupSlot: '04:00 PM - 07:30 PM',
    targetAudience: 'Bihar State Student Residents & Special Hostel Wing',
    notes: 'Weekend Intake Batch (Returns Tuesday)',
  },
];

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const AdminScheduleEditorModal = ({ visible, onClose }) => {
  const [scheduleRules, setScheduleRules] = useState(DEFAULT_SCHEDULE_RULES);
  const [announcement, setAnnouncement] = useState('');
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load custom schedule rules from AsyncStorage on open
  useEffect(() => {
    if (visible) {
      const loadSaved = async () => {
        try {
          const stored = await AsyncStorage.getItem('@vastra_custom_schedule_matrix');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed.rules)) {
              setScheduleRules(parsed.rules);
            }
            if (parsed.announcement) {
              setAnnouncement(parsed.announcement);
            }
          }
        } catch (e) {}
      };
      loadSaved();
    }
  }, [visible]);

  // Handle updating a single field in a batch rule
  const handleUpdateRule = (batchId, field, value) => {
    setScheduleRules((prev) =>
      prev.map((r) => (r.id === batchId ? { ...r, [field]: value } : r))
    );
  };

  // Save changes to AsyncStorage
  const handleSaveSchedule = async () => {
    setSaving(true);
    try {
      const payload = {
        rules: scheduleRules,
        announcement,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem('@vastra_custom_schedule_matrix', JSON.stringify(payload));
      setSaving(false);
      setEditingBatchId(null);

      if (Platform.OS === 'web') {
        window.alert('✅ Dhobi Weekly Schedule Updated Successfully!');
      } else {
        Alert.alert('Schedule Saved', 'Dhobi weekly intake & return schedule has been updated.');
      }
    } catch (e) {
      setSaving(false);
      Alert.alert('Save Error', 'Failed to persist schedule changes.');
    }
  };

  // Reset to default RVS University rules
  const handleResetDefaults = () => {
    Alert.alert(
      'Reset Schedule?',
      'Are you sure you want to reset all batches to official RVS University schedule defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to Defaults',
          style: 'destructive',
          onPress: async () => {
            setScheduleRules(DEFAULT_SCHEDULE_RULES);
            setAnnouncement('');
            await AsyncStorage.removeItem('@vastra_custom_schedule_matrix');
            if (Platform.OS === 'web') {
              window.alert('🔄 Schedule reset to official university defaults.');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.headerTag}>
                <Ionicons name="time" size={13} color="#D97706" />
                <Text style={styles.headerTagText}>DHOBI TIMELINE CONFIG</Text>
              </View>
              <Text style={styles.headerTitle}>Edit Dhobi Weekly Schedule</Text>
              <Text style={styles.headerSub}>
                Customize intake days, return timelines, and slot hours per batch
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={28} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Scrollable Schedule Editor */}
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Announcement Banner Input */}
            <View style={styles.announcementCard}>
              <View style={styles.announcementTop}>
                <Ionicons name="megaphone" size={18} color="#D97706" />
                <Text style={styles.announcementTitle}>Campus Schedule Notice (Optional):</Text>
              </View>
              <TextInput
                style={styles.announcementInput}
                placeholder="e.g. Friday is a holiday. Nepal & International batch will drop-off on Saturday."
                placeholderTextColor="#94A3B8"
                value={announcement}
                onChangeText={setAnnouncement}
                multiline
              />
            </View>

            {/* List of Batch Rules */}
            <View style={styles.batchesList}>
              {scheduleRules.map((batch) => {
                const isEditing = editingBatchId === batch.id;

                return (
                  <View
                    key={batch.id}
                    style={[
                      styles.batchCard,
                      { backgroundColor: batch.bg, borderColor: batch.border },
                    ]}
                  >
                    {/* Top Row: Batch Title & Edit Toggle */}
                    <View style={styles.batchTopRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                        <View style={[styles.batchIconBox, { backgroundColor: batch.color }]}>
                          <Ionicons name={batch.icon} size={18} color="#FFF" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.batchName, { color: batch.color }]}>
                            {batch.name}
                          </Text>
                          <Text style={styles.batchAudience} numberOfLines={1}>
                            {batch.targetAudience}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.editToggleBtn,
                          isEditing && { backgroundColor: batch.color },
                        ]}
                        onPress={() => setEditingBatchId(isEditing ? null : batch.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isEditing ? 'checkmark' : 'create-outline'}
                          size={14}
                          color={isEditing ? '#FFF' : batch.color}
                        />
                        <Text
                          style={[
                            styles.editToggleBtnText,
                            { color: isEditing ? '#FFF' : batch.color },
                          ]}
                        >
                          {isEditing ? 'Done Editing' : 'Edit'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Timeline Summary Box */}
                    <View style={styles.timelineSummaryRow}>
                      <View style={styles.timelinePill}>
                        <Ionicons name="log-in-outline" size={14} color="#15803D" />
                        <Text style={styles.timelineLabel}>Drop-off:</Text>
                        <Text style={styles.timelineDayBold}>{batch.dropoffDay}</Text>
                      </View>

                      <Ionicons name="arrow-forward" size={16} color="#64748B" />

                      <View style={styles.timelinePill}>
                        <Ionicons name="log-out-outline" size={14} color="#4338CA" />
                        <Text style={styles.timelineLabel}>Return / Pickup:</Text>
                        <Text style={styles.timelineDayBold}>{batch.pickupDay}</Text>
                      </View>
                    </View>

                    {/* Expanded Editable Form */}
                    {isEditing ? (
                      <View style={styles.expandedEditorBox}>
                        <View style={styles.editorDivider} />

                        {/* Drop-off Day Selector */}
                        <Text style={styles.inputFieldLabel}>📅 Select Drop-off Day:</Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.daysSelectRow}
                        >
                          {DAYS_OF_WEEK.map((d) => (
                            <TouchableOpacity
                              key={d}
                              style={[
                                styles.daySelectChip,
                                batch.dropoffDay === d && {
                                  backgroundColor: batch.color,
                                  borderColor: batch.color,
                                },
                              ]}
                              onPress={() => handleUpdateRule(batch.id, 'dropoffDay', d)}
                            >
                              <Text
                                style={[
                                  styles.daySelectChipText,
                                  batch.dropoffDay === d && { color: '#FFF' },
                                ]}
                              >
                                {d}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>

                        {/* Pickup / Return Day Selector */}
                        <Text style={[styles.inputFieldLabel, { marginTop: 10 }]}>
                          🚚 Select Pickup / Return Day:
                        </Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.daysSelectRow}
                        >
                          {DAYS_OF_WEEK.map((d) => (
                            <TouchableOpacity
                              key={d}
                              style={[
                                styles.daySelectChip,
                                batch.pickupDay === d && {
                                  backgroundColor: batch.color,
                                  borderColor: batch.color,
                                },
                              ]}
                              onPress={() => handleUpdateRule(batch.id, 'pickupDay', d)}
                            >
                              <Text
                                style={[
                                  styles.daySelectChipText,
                                  batch.pickupDay === d && { color: '#FFF' },
                                ]}
                              >
                                {d}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>

                        {/* Slot Windows */}
                        <View style={styles.slotInputsRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.inputFieldLabel}>Drop-off Slot Hours:</Text>
                            <TextInput
                              style={styles.slotInput}
                              value={batch.dropoffSlot}
                              onChangeText={(v) => handleUpdateRule(batch.id, 'dropoffSlot', v)}
                              placeholder="e.g. 08:00 AM - 11:30 AM"
                            />
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text style={styles.inputFieldLabel}>Pickup Slot Hours:</Text>
                            <TextInput
                              style={styles.slotInput}
                              value={batch.pickupSlot}
                              onChangeText={(v) => handleUpdateRule(batch.id, 'pickupSlot', v)}
                              placeholder="e.g. 04:00 PM - 07:30 PM"
                            />
                          </View>
                        </View>

                        {/* Special Notes / Instructions */}
                        <Text style={[styles.inputFieldLabel, { marginTop: 10 }]}>
                          Batch Notes / Terms:
                        </Text>
                        <TextInput
                          style={styles.slotInput}
                          value={batch.notes}
                          onChangeText={(v) => handleUpdateRule(batch.id, 'notes', v)}
                          placeholder="e.g. Regular 2-Day cycle"
                        />
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={handleResetDefaults}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={16} color="#DC2626" />
                <Text style={styles.resetBtnText}>Reset to Defaults</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveSchedule}
                activeOpacity={0.85}
              >
                <Ionicons name="save-outline" size={18} color="#FFF" />
                <Text style={styles.saveBtnText}>
                  {saving ? 'Saving...' : 'Save & Publish Schedule'}
                </Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: '#FEF3C7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  headerTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
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
  modalScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  announcementCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    gap: 8,
  },
  announcementTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  announcementTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#B45309',
  },
  announcementInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FCD34D',
    fontSize: 12,
    color: '#0F172A',
    minHeight: 44,
  },
  batchesList: {
    gap: 12,
  },
  batchCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    gap: 12,
    ...THEME.shadows.sm,
  },
  batchTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  batchIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchName: {
    fontSize: 14,
    fontWeight: '900',
  },
  batchAudience: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editToggleBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  timelineSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timelineLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  timelineDayBold: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
  },
  expandedEditorBox: {
    gap: 10,
  },
  editorDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 4,
  },
  inputFieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  daysSelectRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  daySelectChip: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  daySelectChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  slotInputsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  slotInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
    marginTop: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});

export default AdminScheduleEditorModal;
