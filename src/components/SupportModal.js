import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useLaundry } from '../context/LaundryContext';

const TICKET_CATEGORIES = [
  { id: 'missing', label: 'Missing Clothes', icon: 'shirt-outline', color: '#EF4444' },
  { id: 'damaged', label: 'Damaged / Stained', icon: 'alert-circle-outline', color: '#F59E0B' },
  { id: 'delay', label: 'Delivery Delay', icon: 'time-outline', color: '#8B5CF6' },
  { id: 'software', label: 'App / Software Issue', icon: 'bug-outline', color: '#3B82F6' },
  { id: 'service', label: 'Laundry Machine / Service', icon: 'hardware-chip-outline', color: '#10B981' },
  { id: 'other', label: 'Other Query / Feedback', icon: 'help-circle-outline', color: '#64748B' },
];

export const SupportModal = ({ visible, onClose }) => {
  const { profile } = useAuth();
  const { tickets, createTicket } = useLaundry();

  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'
  const [selectedCategory, setSelectedCategory] = useState(TICKET_CATEGORIES[0].label);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Filter student tickets
  const myEmail = (profile?.email || '').trim().toLowerCase();
  const myId = profile?.student_id || '';
  const myTickets = tickets.filter(
    (t) =>
      (t.student_email && t.student_email.toLowerCase() === myEmail) ||
      (myId && t.student_id === myId) ||
      (profile?.id && t.user_id === profile.id)
  );

  const handlePickPhoto = async () => {
    if (photos.length >= 3) {
      Alert.alert('Photo Limit', 'You can attach up to 3 photos per ticket.');
      return;
    }

    try {
      if (Platform.OS !== 'web') {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setPhotos([...photos, result.assets[0].uri]);
      }
    } catch (e) {
      console.log('Error picking support photo:', e);
    }
  };

  const handleRemovePhoto = (idx) => {
    setPhotos(photos.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!subject.trim()) {
      Alert.alert('Missing Subject', 'Please enter a brief title for your complaint or query.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please explain the issue you are facing so our staff can assist.');
      return;
    }

    try {
      setSubmitting(true);
      await createTicket({
        user_id: profile?.id || 'usr_guest',
        student_name: profile?.full_name || profile?.email?.split('@')[0] || 'Student',
        student_id: profile?.student_id || 'N/A',
        student_email: profile?.email || '',
        room_number: profile?.room_number || 'N/A',
        hostel_block: profile?.hostel_block || 'N/A',
        phone_number: profile?.phone_number || '',
        category: selectedCategory,
        subject: subject.trim(),
        description: description.trim(),
        photos,
      });

      setSubject('');
      setDescription('');
      setPhotos([]);
      setActiveTab('history');

      if (Platform.OS === 'web') {
        window.alert('Support ticket submitted successfully! Staff will review and assist you.');
      } else {
        Alert.alert(
          'Ticket Submitted',
          'Your support ticket has been sent to RVS Laundry Admin. You can track updates under "My Tickets".'
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.headerIconWrap}>
                <Ionicons name="chatbubbles" size={20} color="#4338CA" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Help & Support Desk</Text>
                <Text style={styles.headerSub}>RVS University Laundry Grievance Redressal</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close-circle" size={26} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'new' && styles.tabActive]}
              onPress={() => setActiveTab('new')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="create-outline"
                size={16}
                color={activeTab === 'new' ? '#4338CA' : '#64748B'}
              />
              <Text style={[styles.tabText, activeTab === 'new' && styles.tabTextActive]}>
                Report Issue / Ticket
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'history' && styles.tabActive]}
              onPress={() => setActiveTab('history')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="time-outline"
                size={16}
                color={activeTab === 'history' ? '#4338CA' : '#64748B'}
              />
              <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
                My Tickets ({myTickets.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab 1: Submit New Ticket */}
          {activeTab === 'new' ? (
            <ScrollView
              style={styles.body}
              contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {/* Category Selector */}
              <Text style={styles.fieldLabel}>Issue Category *</Text>
              <View style={styles.categoryGrid}>
                {TICKET_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.label;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.catPill,
                        isSelected && { backgroundColor: '#EEF2FF', borderColor: '#4338CA' },
                      ]}
                      onPress={() => setSelectedCategory(cat.label)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={cat.icon}
                        size={16}
                        color={isSelected ? '#4338CA' : cat.color}
                      />
                      <Text
                        style={[
                          styles.catPillText,
                          isSelected && { color: '#4338CA', fontWeight: '800' },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Subject */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Problem Subject *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Missing blue hoodie or app booking error"
                  placeholderTextColor="#94A3B8"
                  value={subject}
                  onChangeText={setSubject}
                />
              </View>

              {/* Description */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Explain Details *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Please describe what happened, batch day, or error details so staff can resolve it quickly..."
                  placeholderTextColor="#94A3B8"
                  value={description}
                  onChangeText={setDescription}
                  multiline={true}
                  numberOfLines={4}
                />
              </View>

              {/* Attach Photos */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Attach Photos / Screenshots (Optional)</Text>
                <View style={styles.photosRow}>
                  {photos.map((uri, idx) => (
                    <View key={idx} style={styles.photoThumbWrap}>
                      <Image source={{ uri }} style={styles.photoThumb} />
                      <TouchableOpacity
                        style={styles.removePhotoBtn}
                        onPress={() => handleRemovePhoto(idx)}
                      >
                        <Ionicons name="close" size={14} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {photos.length < 3 && (
                    <TouchableOpacity
                      style={styles.addPhotoBtn}
                      onPress={handlePickPhoto}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="camera-outline" size={22} color="#4338CA" />
                      <Text style={styles.addPhotoText}>Add Photo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={18} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.submitBtnText}>Submit Support Ticket</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          ) : (
            /* Tab 2: My Tickets List */
            <ScrollView
              style={styles.body}
              contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
              showsVerticalScrollIndicator={true}
            >
              {myTickets.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="checkmark-done-circle-outline" size={48} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>No Support Tickets</Text>
                  <Text style={styles.emptySub}>
                    You haven't submitted any complaints or issues. Everything looks good!
                  </Text>
                </View>
              ) : (
                myTickets.map((t) => {
                  const isResolved = t.status === 'resolved';
                  const isInProgress = t.status === 'in_progress';
                  const statusColor = isResolved ? '#059669' : isInProgress ? '#D97706' : '#EF4444';
                  const statusBg = isResolved ? '#ECFDF5' : isInProgress ? '#FEF3C7' : '#FEF2F2';

                  return (
                    <View key={t.id} style={styles.ticketCard}>
                      <View style={styles.ticketCardTop}>
                        <View>
                          <Text style={styles.ticketId}>{t.id}</Text>
                          <Text style={styles.ticketCat}>{t.category}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                          <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                            {t.status.replace('_', ' ').toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.ticketSubject}>{t.subject}</Text>
                      <Text style={styles.ticketDesc}>{t.description}</Text>

                      {t.photos && t.photos.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                          {t.photos.map((pUri, pIdx) => (
                            <Image key={pIdx} source={{ uri: pUri }} style={styles.ticketPhotoMini} />
                          ))}
                        </ScrollView>
                      )}

                      {t.admin_reply ? (
                        <View style={styles.adminReplyBox}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <Ionicons name="shield-checkmark" size={14} color="#4338CA" />
                            <Text style={styles.adminReplyTitle}>Staff / Admin Response:</Text>
                          </View>
                          <Text style={styles.adminReplyText}>{t.admin_reply}</Text>
                        </View>
                      ) : (
                        <Text style={styles.waitingStaffText}>⏳ Awaiting laundry staff review...</Text>
                      )}

                      <Text style={styles.ticketDate}>
                        Submitted: {new Date(t.created_at).toLocaleString()}
                      </Text>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    boxShadow: '0 -10px 30px rgba(0,0,0,0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    marginHorizontal: 18,
    marginTop: 12,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#4338CA',
    fontWeight: '800',
  },
  body: {
    maxHeight: 520,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  catPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  photosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  photoThumbWrap: {
    position: 'relative',
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBtn: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderStyle: 'dashed',
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#4338CA',
    marginTop: 2,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4338CA',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
    boxShadow: '0 4px 12px rgba(67, 56, 202, 0.3)',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },
  ticketCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ticketCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ticketId: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4338CA',
  },
  ticketCat: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  ticketSubject: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  ticketDesc: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
  },
  ticketPhotoMini: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginRight: 6,
  },
  adminReplyBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#4338CA',
  },
  adminReplyTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4338CA',
  },
  adminReplyText: {
    fontSize: 12,
    color: '#1E1B4B',
  },
  waitingStaffText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 8,
  },
  ticketDate: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'right',
  },
});

export default SupportModal;
