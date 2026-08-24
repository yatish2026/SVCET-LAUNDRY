import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLaundry } from '../../context/LaundryContext';

export const SupportTicketsScreen = ({ onBack }) => {
  const { tickets, updateTicketStatus } = useLaundry();

  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'open' | 'in_progress' | 'resolved'
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [updating, setUpdating] = useState(false);

  const filteredTickets = tickets.filter((t) => {
    if (filter === 'ALL') return true;
    return t.status === filter;
  });

  const openCount = tickets.filter((t) => t.status === 'open').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;

  const handleOpenTicketModal = (ticket) => {
    setSelectedTicket(ticket);
    setAdminReplyText(ticket.admin_reply || '');
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTicket) return;
    try {
      setUpdating(true);
      await updateTicketStatus(selectedTicket.id, newStatus, adminReplyText.trim());

      setSelectedTicket((prev) => ({
        ...prev,
        status: newStatus,
        admin_reply: adminReplyText.trim(),
      }));

      if (Platform.OS === 'web') {
        window.alert(`Ticket ${selectedTicket.id} updated to ${newStatus.toUpperCase()}`);
      } else {
        Alert.alert('Ticket Updated', `Ticket ${selectedTicket.id} marked as ${newStatus.toUpperCase()}`);
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to update ticket status.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.headerTitle}>Student Support & Grievances</Text>
          <Text style={styles.headerSub}>Complaints, Damaged/Missing Clothes & Queries</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { id: 'ALL', label: `All (${tickets.length})` },
          { id: 'open', label: `Open (${openCount})`, color: '#EF4444' },
          { id: 'in_progress', label: `In Progress (${inProgressCount})`, color: '#D97706' },
          { id: 'resolved', label: `Resolved (${resolvedCount})`, color: '#10B981' },
        ].map((tab) => {
          const isActive = filter === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setFilter(tab.id)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterTabText,
                  isActive && styles.filterTabTextActive,
                  tab.color && isActive && { color: tab.color },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Ticket List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredTickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbox-ellipses-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Complaints Found</Text>
            <Text style={styles.emptySub}>There are no support tickets in this category.</Text>
          </View>
        ) : (
          filteredTickets.map((t) => {
            const isResolved = t.status === 'resolved';
            const isInProgress = t.status === 'in_progress';
            const statusColor = isResolved ? '#059669' : isInProgress ? '#D97706' : '#EF4444';
            const statusBg = isResolved ? '#ECFDF5' : isInProgress ? '#FEF3C7' : '#FEF2F2';

            return (
              <TouchableOpacity
                key={t.id}
                style={styles.ticketCard}
                onPress={() => handleOpenTicketModal(t)}
                activeOpacity={0.85}
              >
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
                <Text style={styles.ticketDesc} numberOfLines={2}>
                  {t.description}
                </Text>

                {/* Student Room / Contact Details */}
                <View style={styles.studentMetaRow}>
                  <View style={styles.metaChip}>
                    <Ionicons name="person-outline" size={13} color="#4338CA" />
                    <Text style={styles.metaChipText}>{t.student_name} ({t.student_id})</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Ionicons name="home-outline" size={13} color="#64748B" />
                    <Text style={styles.metaChipText}>Rm {t.room_number}, {t.hostel_block}</Text>
                  </View>
                  {t.phone_number ? (
                    <View style={styles.metaChip}>
                      <Ionicons name="call-outline" size={13} color="#16A34A" />
                      <Text style={styles.metaChipText}>{t.phone_number}</Text>
                    </View>
                  ) : null}
                </View>

                {t.photos && t.photos.length > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <Ionicons name="images-outline" size={14} color="#64748B" />
                    <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700' }}>
                      {t.photos.length} Photo(s) Attached
                    </Text>
                  </View>
                )}

                {t.admin_reply ? (
                  <View style={styles.replyPreview}>
                    <Text style={styles.replyPreviewText}>
                      💬 Reply: <Text style={{ fontStyle: 'italic' }}>{t.admin_reply}</Text>
                    </Text>
                  </View>
                ) : null}

                <View style={styles.ticketCardFooter}>
                  <Text style={styles.ticketTime}>
                    {new Date(t.created_at).toLocaleString()}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={styles.actionPrompt}>Manage Ticket</Text>
                    <Ionicons name="chevron-forward" size={14} color="#4338CA" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Ticket Details & Action Modal */}
      {selectedTicket && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSelectedTicket(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              {/* Modal Header */}
              <View style={styles.modalSheetHeader}>
                <View>
                  <Text style={styles.modalTicketId}>{selectedTicket.id}</Text>
                  <Text style={styles.modalTicketCat}>{selectedTicket.category}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedTicket(null)}>
                  <Ionicons name="close-circle" size={26} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalBody}
                contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
                showsVerticalScrollIndicator={true}
              >
                {/* Student Details Card */}
                <View style={styles.studentInfoCard}>
                  <Text style={styles.studentInfoTitle}>Student Information</Text>
                  <Text style={styles.studentInfoRow}>👤 Name: <Text style={{ fontWeight: '800' }}>{selectedTicket.student_name}</Text></Text>
                  <Text style={styles.studentInfoRow}>🎓 Roll ID: <Text style={{ fontWeight: '800' }}>{selectedTicket.student_id}</Text></Text>
                  <Text style={styles.studentInfoRow}>🏢 Hostel: {selectedTicket.hostel_block} • Room {selectedTicket.room_number}</Text>
                  <Text style={styles.studentInfoRow}>📧 Email: {selectedTicket.student_email}</Text>
                  <Text style={styles.studentInfoRow}>📱 Mobile: {selectedTicket.phone_number || 'N/A'}</Text>
                </View>

                {/* Complaint Details */}
                <View style={styles.complaintBox}>
                  <Text style={styles.complaintSubject}>{selectedTicket.subject}</Text>
                  <Text style={styles.complaintDesc}>{selectedTicket.description}</Text>

                  {/* Attached Photos */}
                  {selectedTicket.photos && selectedTicket.photos.length > 0 && (
                    <View style={{ marginTop: 12 }}>
                      <Text style={styles.photosHeading}>Attached Photos / Evidence:</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                        {selectedTicket.photos.map((uri, idx) => (
                          <Image key={idx} source={{ uri }} style={styles.modalPhotoLarge} />
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* Staff Response Box */}
                <View style={styles.staffResponseWrap}>
                  <Text style={styles.staffResponseTitle}>Staff / Admin Official Response</Text>
                  <TextInput
                    style={styles.replyInput}
                    placeholder="Enter resolution notes, laundry room findings, or instructions for the student..."
                    placeholderTextColor="#94A3B8"
                    value={adminReplyText}
                    onChangeText={setAdminReplyText}
                    multiline={true}
                    numberOfLines={3}
                  />
                </View>

                {/* Action Buttons */}
                <View style={styles.statusActions}>
                  <TouchableOpacity
                    style={[styles.statusBtn, { backgroundColor: '#F59E0B' }]}
                    onPress={() => handleUpdateStatus('in_progress')}
                    disabled={updating}
                  >
                    <Ionicons name="time" size={16} color="#FFF" />
                    <Text style={styles.statusBtnText}>Mark In-Progress</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.statusBtn, { backgroundColor: '#10B981' }]}
                    onPress={() => handleUpdateStatus('resolved')}
                    disabled={updating}
                  >
                    <Ionicons name="checkmark-done" size={16} color="#FFF" />
                    <Text style={styles.statusBtnText}>Mark Resolved</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 6,
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
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 6,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  filterTabActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  filterTabText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#4338CA',
    fontWeight: '800',
  },
  list: {
    flex: 1,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  ticketCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ticketId: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4338CA',
  },
  ticketCat: {
    fontSize: 11,
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
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  ticketDesc: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
  },
  studentMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metaChipText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  replyPreview: {
    backgroundColor: '#EEF2FF',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  replyPreviewText: {
    fontSize: 11.5,
    color: '#312E81',
  },
  ticketCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  ticketTime: {
    fontSize: 10.5,
    color: '#94A3B8',
  },
  actionPrompt: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#4338CA',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
  },
  modalSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTicketId: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4338CA',
  },
  modalTicketCat: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  modalBody: {
    maxHeight: 520,
  },
  studentInfoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  studentInfoTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  studentInfoRow: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 3,
  },
  complaintBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  complaintSubject: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  complaintDesc: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  photosHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  modalPhotoLarge: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginRight: 8,
  },
  staffResponseWrap: {
    marginBottom: 16,
  },
  staffResponseTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  replyInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 70,
    textAlignVertical: 'top',
  },
  statusActions: {
    flexDirection: 'row',
    gap: 10,
  },
  statusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
  },
  statusBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },
});

export default SupportTicketsScreen;
