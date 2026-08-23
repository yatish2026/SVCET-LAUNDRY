import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../constants/theme';
import { useLaundry } from '../context/LaundryContext';
import { CameraView, useCameraPermissions } from 'expo-camera';

export const QRScannerModal = ({ visible, onClose }) => {
  const { bookings, advanceBookingStatus } = useLaundry();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const [inputToken, setInputToken] = useState('');
  const [matchedBooking, setMatchedBooking] = useState(null);
  const [completedSuccess, setCompletedSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setMatchedBooking(null);
      setCompletedSuccess(false);
      setInputToken('');
    }
  }, [visible]);

  // Handle live barcode scanning from camera
  const handleBarCodeScanned = ({ data }) => {
    if (scanned || matchedBooking) return;
    setScanned(true);

    try {
      let parsed = data;
      try {
        const json = JSON.parse(data);
        if (json.token) parsed = json.token;
        else if (json.booking_id) parsed = json.booking_id;
      } catch (e) {
        // Plain string
      }
      lookupBooking(parsed);
    } catch (err) {
      setScanned(false);
    }
  };

  const lookupBooking = (searchQuery) => {
    const clean = (searchQuery || inputToken)
      .trim()
      .toUpperCase()
      .replace('#', '');
    if (!clean) return;

    const found = bookings.find(
      (b) =>
        b.pickup_token?.toUpperCase().replace('#', '') === clean ||
        b.id === clean ||
        b.student_id?.toUpperCase() === clean ||
        b.phone_number?.replace(/\s+/g, '') === clean.replace(/\s+/g, '')
    );

    if (found) {
      setMatchedBooking(found);
      setCompletedSuccess(false);
    } else {
      setMatchedBooking(null);
      Alert.alert(
        'QR Code Not Found',
        `No booking matched "${clean}". Please verify the student's QR code.`,
        [{ text: 'Try Again', onPress: () => setScanned(false) }]
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
    setScanned(false);
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
              <Text style={styles.title}>Counter QR Scanner</Text>
              <Text style={styles.subtitle}>Scan student's QR code for instant pickup</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ width: '100%', maxHeight: 520 }}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {completedSuccess ? (
              /* Success Confirmation Banner */
              <View style={styles.successBox}>
                <View style={styles.successCheckCircle}>
                  <Ionicons name="checkmark-done" size={48} color="#16A34A" />
                </View>
                <Text style={styles.successTitle}>Handover Verified! ✅</Text>
                <Text style={styles.successSub}>
                  Clothes successfully returned to {matchedBooking?.student_name}. The order has been marked as Completed.
                </Text>

                <TouchableOpacity style={styles.scanNextBtn} onPress={handleReset}>
                  <Ionicons name="camera-outline" size={18} color="#FFF" />
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
                  <Text style={styles.cancelVerifyBtnText}>Scan Another Code</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Live Camera Scanner Viewport & Search Option */
              <View>
                <View style={styles.cameraBox}>
                  {!permission?.granted ? (
                    <View style={styles.permWrap}>
                      <Ionicons name="camera" size={40} color="#4338CA" />
                      <Text style={styles.permTitle}>Camera Access Required</Text>
                      <Text style={styles.permSub}>Allow camera permission to scan student QR passes</Text>
                      <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
                        <Text style={styles.grantBtnText}>Enable Camera</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <CameraView
                      style={StyleSheet.absoluteFillObject}
                      facing="back"
                      barcodeScannerSettings={{
                        barcodeTypes: ['qr'],
                      }}
                      onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    >
                      <View style={styles.viewFinderOverlay}>
                        <View style={styles.targetFrame}>
                          <View style={styles.laserLine} />
                        </View>
                        <Text style={styles.targetHint}>Align student QR pass within frame</Text>
                      </View>
                    </CameraView>
                  )}
                </View>

                {/* Manual Token Entry Bar */}
                <View style={styles.manualEntrySection}>
                  <Text style={styles.manualLabel}>OR ENTER STUDENT TOKEN / ID:</Text>
                  <View style={styles.searchBar}>
                    <Ionicons name="keypad-outline" size={20} color="#4338CA" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="e.g. LND-4921 or Roll No"
                      placeholderTextColor="#94A3B8"
                      value={inputToken}
                      onChangeText={(txt) => {
                        setInputToken(txt);
                        if (txt.length >= 7) lookupBooking(txt);
                      }}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      style={styles.searchActionBtn}
                      onPress={() => lookupBooking()}
                    >
                      <Text style={styles.searchActionBtnText}>Verify</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Quick List of Ready For Pickup Orders */}
                <View style={styles.recentWrap}>
                  <Text style={styles.recentTitle}>Ready for Pickup at Counter:</Text>
                  {bookings
                    .filter(
                      (b) =>
                        b.status === 'ready_for_pickup' ||
                        b.status === 'drying_ironing' ||
                        b.status === 'in_wash'
                    )
                    .slice(0, 4)
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '92%',
    ...THEME.shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
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
  cameraBox: {
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#4338CA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewFinderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetFrame: {
    width: 150,
    height: 150,
    borderWidth: 2.5,
    borderColor: '#22C55E',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laserLine: {
    width: '90%',
    height: 2,
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  targetHint: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  permWrap: {
    alignItems: 'center',
    padding: 20,
  },
  permTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 8,
  },
  permSub: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 12,
  },
  grantBtn: {
    backgroundColor: '#4338CA',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  grantBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  manualEntrySection: {
    marginBottom: 12,
  },
  manualLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 6,
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
    paddingVertical: 8,
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
