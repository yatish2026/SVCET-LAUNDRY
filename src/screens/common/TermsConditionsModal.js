import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../constants/theme';

export const TermsConditionsModal = ({ visible, onClose }) => {
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
              <Ionicons name="document-text" size={22} color="#4338CA" />
              <Text style={styles.headerTitle}>Terms of Service</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Terms Content Scroll */}
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.lastUpdated}>Effective Date: August 2026 • LaundryGo</Text>

            <Text style={styles.sectionHeading}>1. Acceptance of Terms</Text>
            <Text style={styles.bodyText}>
              By registering or using the LaundryGo mobile application, you agree to these Terms and Conditions. This app is provided exclusively for registered hostel students and authorized laundry staff of RVS University.
            </Text>

            <Text style={styles.sectionHeading}>2. Student Account & Security</Text>
            <Text style={styles.bodyText}>
              • You agree to provide accurate registration information including your official Roll Number, Room Number, and contact details.{"\n"}
              • You are responsible for safeguarding your login credentials. Never share your password or QR pickup tokens.
            </Text>

            <Text style={styles.sectionHeading}>3. Laundry Submission & Quota Rules</Text>
            <Text style={styles.bodyText}>
              • <Text style={styles.boldText}>Assigned Slot Days:</Text> Students must drop off clothes on their assigned weekly intake schedule mapped to their academic branch.{"\n"}
              • <Text style={styles.boldText}>Handover Verification:</Text> Counter drop-off and pickup must be confirmed using the digital QR Token in the app.{"\n"}
              • <Text style={styles.boldText}>Garment Care:</Text> Standard hostel washing is provided. Delicate fabrics requiring specialized dry-cleaning should not be deposited in bulk washing bags.
            </Text>

            <Text style={styles.sectionHeading}>4. Photo Evidence & Verification</Text>
            <Text style={styles.bodyText}>
              Verification photos attached during intake serve as mutual count proof between the student and the laundry counter. Photos are stored securely and never shared with commercial entities.
            </Text>

            <Text style={styles.sectionHeading}>5. Issue Redressal & Help Desk</Text>
            <Text style={styles.bodyText}>
              For any washing delays or grievances, students can submit a formal support ticket with photo attachments via the in-app Help Desk for 24-hour resolution by staff.
            </Text>

            <Text style={styles.sectionHeading}>6. Account & Data Deletion</Text>
            <Text style={styles.bodyText}>
              Users can delete their account and associated laundry records at any time through the Profile screen.
            </Text>

            <Text style={styles.sectionHeading}>7. Campus Contact</Text>
            <Text style={styles.bodyText}>
              Hostel Laundry Administration Desk{"\n"}
              📧 Email: <Text style={styles.boldText}>laundry@rvsu.org</Text>{"\n"}
              📍 RVS University Campus Hostel Office
            </Text>
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>I Accept Terms of Service</Text>
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
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...THEME.shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 14,
  },
  lastUpdated: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 12,
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 8,
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  doneBtn: {
    backgroundColor: '#4338CA',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 12,
    ...THEME.shadows.sm,
  },
  doneBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default TermsConditionsModal;
