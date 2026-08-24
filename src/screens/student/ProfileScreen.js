import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../constants/theme';
import { HOSTEL_BLOCKS } from '../../constants/categories';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PrivacyPolicyModal from '../common/PrivacyPolicyModal';

export const ProfileScreen = () => {
  const { profile, signOut } = useAuth();

  const [name, setName] = useState(profile?.full_name || '');
  const [studentId, setStudentId] = useState(profile?.student_id || '');
  const [roomNumber, setRoomNumber] = useState(profile?.room_number || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || '');
  const [hostelBlock, setHostelBlock] = useState(profile?.hostel_block || HOSTEL_BLOCKS[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleDeleteAccount = () => {
    const confirmMessage =
      'Are you sure you want to permanently delete your account and all associated laundry data? This action cannot be undone.';

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(confirmMessage);
      if (confirmed) {
        executeAccountDeletion();
      }
    } else {
      Alert.alert('Delete Account & Data', confirmMessage, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: executeAccountDeletion,
        },
      ]);
    }
  };

  const executeAccountDeletion = async () => {
    try {
      if (profile?.email) {
        await apiService.post('delete_account', {
          email: profile.email,
          password: profile.password || 'deleted',
        });
      }
      await AsyncStorage.clear();
      signOut();
      if (Platform.OS === 'web') {
        window.alert('Your account and personal data have been permanently deleted.');
      } else {
        Alert.alert('Account Deleted', 'Your account and personal data have been permanently deleted.');
      }
    } catch (e) {
      // Clear local session in all cases
      await AsyncStorage.clear();
      signOut();
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updatedProfile = {
        ...profile,
        full_name: name.trim(),
        student_id: studentId.trim(),
        room_number: roomNumber.trim(),
        phone_number: phoneNumber.trim(),
        hostel_block: hostelBlock,
      };
      await AsyncStorage.setItem(
        '@campuswash_user_session',
        JSON.stringify(updatedProfile)
      );
      setIsEditing(false);
      Alert.alert('Profile Saved', 'Your hostel and room details have been updated.');
    } catch (e) {
      Alert.alert('Error', 'Unable to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      const confirmSignout = window.confirm('Are you sure you want to sign out?');
      if (confirmSignout) {
        signOut();
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: () => signOut(),
          },
        ]
      );
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Hero Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>
            {(name || profile?.email || 'S').charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.profileName}>{name || profile?.email}</Text>
        <Text style={styles.profileTag}>
          {profile?.email} • {hostelBlock?.split(' ')[0]}
        </Text>

        <TouchableOpacity
          style={styles.editToggleBtn}
          onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
          disabled={saving}
        >
          <Ionicons
            name={isEditing ? 'checkmark-circle-outline' : 'create-outline'}
            size={16}
            color={THEME.colors.primaryDark}
          />
          <Text style={styles.editToggleBtnText}>
            {saving ? 'Saving...' : isEditing ? 'Save Profile' : 'Edit Information'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Profile Form Fields */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Student Hostel Information</Text>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Full Name</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={name}
            onChangeText={setName}
            editable={isEditing}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Student / Roll Number</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={studentId}
            onChangeText={setStudentId}
            editable={isEditing}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Hostel Block</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={hostelBlock}
            onChangeText={setHostelBlock}
            placeholder="e.g. Block A (Boys Hostel) or Kaveri Block"
            placeholderTextColor={THEME.colors.textMuted}
            editable={isEditing}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Room Number</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={roomNumber}
            onChangeText={setRoomNumber}
            editable={isEditing}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Mobile Number (For Alerts)</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            editable={isEditing}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      {/* Laundry Rules & Guidelines Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Campus Laundry Guidelines</Text>

        <View style={styles.guideItem}>
          <Ionicons name="bag-check-outline" size={18} color={THEME.colors.primary} />
          <View style={styles.guideTextWrap}>
            <Text style={styles.guideHeading}>Maximum 20 Items per Request</Text>
            <Text style={styles.guideSub}>
              Ensure all clothes are tagged or tied inside your hostel laundry bag.
            </Text>
          </View>
        </View>

        <View style={styles.guideItem}>
          <Ionicons name="time-outline" size={18} color={THEME.colors.primary} />
          <View style={styles.guideTextWrap}>
            <Text style={styles.guideHeading}>Strict Drop-off Slot Timings</Text>
            <Text style={styles.guideSub}>
              Drop clothes within your allocated slot window to prevent queue bottlenecks.
            </Text>
          </View>
        </View>
      </View>

      {/* Privacy, Data Safety & Legal */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Privacy & Data Protection</Text>

        <TouchableOpacity
          style={styles.legalRow}
          onPress={() => setShowPrivacyModal(true)}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#16A34A" />
            <Text style={styles.legalRowText}>Privacy Policy & Data Safety Disclosures</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteAccountRow}
          onPress={handleDeleteAccount}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="trash-outline" size={18} color="#E11D48" />
            <Text style={styles.deleteAccountText}>Request Account & Data Deletion</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#E11D48" />
        </TouchableOpacity>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={18} color="#4338CA" />
        <Text style={styles.signOutBtnText}>Sign Out from DobiX</Text>
      </TouchableOpacity>

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  content: {
    padding: THEME.spacing.lg,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.xl,
    padding: THEME.spacing.lg,
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.sm,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarLargeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
  },
  profileName: {
    fontSize: THEME.typography.sizes.lg,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  profileTag: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    marginBottom: 12,
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primarySoft,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: THEME.radius.full,
  },
  editToggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primaryDark,
    marginLeft: 6,
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.sm,
  },
  cardTitle: {
    fontSize: THEME.typography.sizes.sm,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 12,
  },
  field: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: THEME.colors.textPrimary,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  inputDisabled: {
    backgroundColor: THEME.colors.surfaceSubtle,
    color: THEME.colors.textSecondary,
  },
  blockChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  blockChip: {
    backgroundColor: THEME.colors.surfaceSubtle,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  blockChipActive: {
    backgroundColor: THEME.colors.primaryDark,
    borderColor: THEME.colors.primaryDark,
  },
  blockChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  blockChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.divider,
  },
  guideTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  guideHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  guideSub: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: THEME.radius.lg,
    paddingVertical: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  signOutBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4338CA',
    marginLeft: 8,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  legalRowText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  deleteAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  deleteAccountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E11D48',
  },
});

export default ProfileScreen;
