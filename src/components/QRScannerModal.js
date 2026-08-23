import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../constants/theme';
import { useLaundry } from '../context/LaundryContext';

export const QRScannerModal = ({ visible, onClose }) => {
  const { bookings, advanceBookingStatus } = useLaundry();

  const [inputToken, setInputToken] = useState('');
  const [matchedBooking, setMatchedBooking] = useState(null);
  const [completedSuccess, setCompletedSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSearchToken = (searchVal) => {
    const query = (searchVal || inputToken).trim().toUpperCase().replace('#', '');
    if (!query) return;

    // Find booking matching token or ID or student_id
    const found = bookings.find(
      (b) =>
        b.pickup_token?.toUpperCase().replace('#', '') === query ||
        b.id === query ||
        b.student_id?.toUpperCase() === query
    );

    if (found) {
      setMatchedBooking(found);
      setCompletedSuccess(false);
    } else {
      setMatchedBooking(null);
      Alert.alert(
        'Token Not Found',
        `No laundry booking found for "${query}". Please check the student's QR code or token number.`
      );
    }
  };

  const handleCompleteHandover = async () => {
    if (!matchedBooking) return;

    try {
      setIsProcessing(true);
      await advanceBookingStatus(matchedBooking.id, 'completed');
      setCompletedSuccess(true);
    } catch (err) {
      Alert.alert('Error', 'Unable to complete order.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setMatchedBooking(null);
    setInputToken('');
    setCompletedSuccess(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="qr-code" size={24} color="#4338CA" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.title}>Student QR Handover</Text>
              <Text style={styles.subtitle}>Scan or enter token to complete pickup</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Search Input Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="scan-outline" size={20} color="#4338CA" />
            <TextInput
              style={styles.searchInput}
              placeholder="Enter Token (e.g. LND-4921) or Student ID"
              placeholderTextColor="#94A3B8"
              value={inputToken}
              onChangeText={(txt) => {
                setInputToken(txt);
                if (txt.length >= 7) handleSearchToken(txt);
              }}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={styles.searchActionBtn}
              onPress={() => handleSearchToken()}
            >
              <Text style={styles.searchActionBtnText}>Verify</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ width: '100%', maxHeight: 420 }} showsVerticalScrollIndicator={false}>
            {completedSuccess ? (
              /* Success Confirmation Banner */
              <View style={styles.successBox}>
                <View style={styles.successCheckCircle}>
                  <Ionicons name="checkmark-done" size={48} color="#16A34A" />
                </View>
                <Text style={styles.successTitle}>Handover Completed! ✅</Text>
                <Text style={styles.successSub}>
                  Clothes successfully returned to {matchedBooking?.student_name}. The order has been marked as Completed.
                </Text>

                <TouchableOpacity style={styles.scanNextBtn} onPress={handleReset}>
                  <Ionicons name="qr-code-outline" size={18} color="#FFF" />
                  <Text style={styles.scanNextBtnText}>Scan Next Student QR</Text>
                </TouchableOpacity>
              </View>
            ) : matchedBooking ? (
              /* Matched Booking Verification Card */
              <View style={styles.verifyCard}>
                <View style={styles.verifyCardHeader}>
                  <View>
                    <Text style={styles.verifyStudentName}>{matchedBooking.student_name}</Text>
                    <Text style={styles.verifyMeta}>
                      ID: {matchedBooking.student_id || 'N/A'} • {matchedBooking.academic_year || '1st Year'}
                    </Text>
                  </View>
                  <View style={styles.tokenPill}>
                    <Text style={styles.tokenPillText}>#{matchedBooking.pickup_token}</Text>
                  </View>
                </View>

                {/* Details Grid */}
                <View style={styles.gridBox}>
                  <View style={styles.gridRow}>
                    <Text style={styles.gridLabel}>Hostel & Room:</Text>
                    <Text style={styles.gridVal}>
                      {matchedBooking.hostel_block} (Rm {matchedBooking.room_number})
                    </Text>
                  </View>
                  <View style={styles.gridRow}>
                    <Text style={styles.gridLabel}>Total Clothes:</Text>
                    <Text style={[styles.gridVal, { color: '#4338CA', fontWeight: '800' }]}>
                      {matchedBooking.total_items} pieces
                    </Text>
                  </View>
                  <View style={styles.gridRow}>
                    <Text style={styles.gridLabel}>Current Status:</Text>
                    <Text style={[styles.gridVal, { color: '#0284C7', fontWeight: '800' }]}>
                      {matchedBooking.status?.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Confirm Handover Button */}
                <TouchableOpacity
                  style={[styles.confirmBtn, isProcessing && { opacity: 0.7 }]}
                  onPress={handleCompleteHandover}
                  disabled={isProcessing}
                  activeOpacity={0.85}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                      <Text style={styles.confirmBtnText}>Confirm Handover & Complete</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelVerifyBtn} onPress={handleReset}>
                  <Text style={styles.cancelVerifyBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Quick Suggestions: Recent Ready for Pickup orders */
              <View style={styles.recentWrap}>
                <Text style={styles.recentTitle}>Ready for Pickup at Counter:</Text>
                {bookings
                  .filter((b) => b.status === 'ready_for_pickup' || b.status === 'drying_ironing' || b.status === 'in_wash')
                  .slice(0, 5)
                  .map((b) => (
                    <TouchableOpacity
                      key={b.id}
                      style={styles.quickPickRow}
                      onPress={() => {
                        setMatchedBooking(b);
                        setInputToken(b.pickup_token);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.quickPickName}>{b.student_name}</Text>
                        <Text style={styles.quickPickMeta}>
                          #{b.pickup_token} • {b.total_items} clothes • Rm {b.room_number}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '90%',
    ...THEME.shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    height: 48,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  searchActionBtn: {
    backgroundColor: '#4338CA',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  searchActionBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  verifyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  verifyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  verifyStudentName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  verifyMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  tokenPill: {
    backgroundColor: '#4338CA',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  tokenPillText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  gridBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  gridLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  gridVal: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  confirmBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  cancelVerifyBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  cancelVerifyBtnText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successCheckCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#16A34A',
  },
  successSub: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  scanNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4338CA',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginTop: 18,
    gap: 8,
  },
  scanNextBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  recentWrap: {
    marginTop: 4,
  },
  recentTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  quickPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickPickName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  quickPickMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});

export default QRScannerModal;
