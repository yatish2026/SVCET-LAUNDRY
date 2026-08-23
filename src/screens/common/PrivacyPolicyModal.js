import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../constants/theme';

export const PrivacyPolicyModal = ({ visible, onClose }) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="shield-checkmark" size={22} color="#16A34A" />
              <Text style={styles.headerTitle}>Privacy Policy & Data Safety</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Policy Content Scroll */}
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.lastUpdated}>Last Updated: August 2026 • SVCET CampusWash</Text>

            <Text style={styles.sectionHeading}>1. Overview & Commitment</Text>
            <Text style={styles.bodyText}>
              SVCET CampusWash is committed to protecting student privacy. This application is dedicated strictly to managing hostel laundry requests, schedule slots, and pickup tokens for students and campus staff.
            </Text>

            <Text style={styles.sectionHeading}>2. Information We Collect</Text>
            <Text style={styles.bodyText}>
              • <Text style={styles.boldText}>Identity & Hostel Info:</Text> Full Name, Roll No / Student ID, Academic Year, Hostel Block, and Room Number for counter intake identification.{"\n"}
              • <Text style={styles.boldText}>Contact Information:</Text> Mobile Phone Number used strictly for order tracking and ready-for-pickup SMS/Push alerts.{"\n"}
              • <Text style={styles.boldText}>Clothes Verification Photos:</Text> Client-compressed thumbnail photos of your clothes bag, used exclusively by hostel staff to verify piece counts during counter drop-off.
            </Text>

            <Text style={styles.sectionHeading}>3. Photo Upload & Data Safety</Text>
            <Text style={styles.bodyText}>
              • Photos uploaded in the app are compressed on-device into lightweight thumbnails (&lt;30 KB) before transmission.{"\n"}
              • Photos are stored securely in protected storage and are NEVER shared with third parties, advertisers, or outside vendors.{"\n"}
              • Camera and Gallery permissions are requested only when you choose to attach photos of your clothes.
            </Text>

            <Text style={styles.sectionHeading}>4. Data Security & Encryption</Text>
            <Text style={styles.bodyText}>
              All data transmitted between your device and the cloud database is encrypted in transit using industry-standard <Text style={styles.boldText}>HTTPS / TLS 1.3 encryption</Text>.
            </Text>

            <Text style={styles.sectionHeading}>5. User Rights & Data Deletion (Google Play Compliance)</Text>
            <Text style={styles.bodyText}>
              In accordance with Google Play Store policies, students retain the right to access, export, or permanently delete their account and associated laundry data at any time through the Profile screen or by contacting campus administration.
            </Text>

            <Text style={styles.sectionHeading}>6. Contact Information</Text>
            <Text style={styles.bodyText}>
              For any questions regarding privacy or hostel laundry management, please contact:{"\n"}
              📧 Email: <Text style={styles.boldText}>laundry-support@svcet.edu.in</Text>{"\n"}
              📍 SVCET Campus Hostel Office, Counter 1
            </Text>
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>I Understand & Agree</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    ...THEME.shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 24,
  },
  lastUpdated: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 14,
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1E293B',
    marginTop: 14,
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#475569',
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  doneBtn: {
    backgroundColor: '#4338CA',
    margin: 16,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default PrivacyPolicyModal;
