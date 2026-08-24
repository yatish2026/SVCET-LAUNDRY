import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import THEME from '../../constants/theme';
import { HOSTEL_BLOCKS } from '../../constants/categories';
import { ACADEMIC_YEARS } from '../../constants/schedule';
import { useAuth } from '../../context/AuthContext';
import { useLaundry } from '../../context/LaundryContext';
import { apiService } from '../../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PrivacyPolicyModal from '../common/PrivacyPolicyModal';

export const ProfileScreen = () => {
  const { profile, signOut } = useAuth();
  const { bookings } = useLaundry();

  const [name, setName] = useState(profile?.full_name || '');
  const [studentId, setStudentId] = useState(profile?.student_id || '');
  const [roomNumber, setRoomNumber] = useState(profile?.room_number || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || '');
  const [hostelBlock, setHostelBlock] = useState(profile?.hostel_block || HOSTEL_BLOCKS[0]);
  const [academicYear, setAcademicYear] = useState(profile?.academic_year || '1st Year');
  const [avatarUri, setAvatarUri] = useState(profile?.avatar_url || null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Load avatar from storage on mount
  useEffect(() => {
    const loadAvatar = async () => {
      try {
        const storedAvatar = await AsyncStorage.getItem('@dobix_user_avatar');
        if (storedAvatar) {
          setAvatarUri(storedAvatar);
        }
      } catch (e) {
        console.log('Error loading avatar:', e);
      }
    };
    loadAvatar();
  }, []);

  // Compute student-specific laundry statistics
  const studentEmail = (profile?.email || '').trim().toLowerCase();
  const studentRollNo = (profile?.student_id || '').trim();
  const cleanStudentName = (profile?.full_name || '').trim().toLowerCase();

  const studentBookings = bookings.filter((b) => {
    if (b.user_id && profile?.id && b.user_id === profile.id) return true;
    if (b.student_email && studentEmail && b.student_email.toLowerCase() === studentEmail) return true;
    const bName = (b.student_name || '').trim().toLowerCase();
    if (cleanStudentName && bName && bName === cleanStudentName) return true;
    if (studentRollNo && studentRollNo !== 'SVCET-STD' && studentRollNo !== 'RVS-STD' && b.student_id === studentRollNo) return true;
    return false;
  });

  const totalClothesCleaned = studentBookings.reduce((sum, b) => sum + (b.total_items || 0), 0);
  const completedOrders = studentBookings.filter((b) => b.status === 'completed').length;
  const activeOrders = studentBookings.filter((b) => b.status !== 'completed' && b.status !== 'cancelled').length;

  // Compress avatar photo
  const compressAvatar = async (uri) => {
    if (Platform.OS === 'web') {
      return new Promise((resolve) => {
        if (typeof document !== 'undefined' && document.createElement) {
          try {
            const img = document.createElement('img');
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const maxDim = 300;
              let width = img.width || maxDim;
              let height = img.height || maxDim;
              if (width > height) {
                if (width > maxDim) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                }
              } else {
                if (height > maxDim) {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
            img.onerror = () => resolve(uri);
            img.src = uri;
          } catch (e) {
            resolve(uri);
          }
        } else {
          resolve(uri);
        }
      });
    } else {
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 300, height: 300 } }],
          { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        if (manipResult.base64) {
          return `data:image/jpeg;base64,${manipResult.base64}`;
        }
        return manipResult.uri;
      } catch (e) {
        return uri;
      }
    }
  };

  // Upload or Change Profile Photo
  const handlePickAvatar = async () => {
    try {
      if (Platform.OS !== 'web') {
        try {
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        } catch (e) {}
      }

      let result;
      try {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        });
      } catch (err) {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.5,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        const compressed = await compressAvatar(result.assets[0].uri);
        setAvatarUri(compressed);
        await AsyncStorage.setItem('@dobix_user_avatar', compressed);
        if (Platform.OS === 'web') {
          window.alert('Profile photo updated successfully!');
        } else {
          Alert.alert('Photo Updated', 'Your profile picture has been updated.');
        }
      }
    } catch (error) {
      console.log('Error picking avatar:', error);
      Alert.alert('Photo Picker', 'Unable to choose photo. Please check gallery permissions.');
    }
  };

  const handleTakeAvatarPhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        try {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Camera Permission', 'Please allow camera access in phone settings.');
            return;
          }
        } catch (e) {}
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const compressed = await compressAvatar(result.assets[0].uri);
        setAvatarUri(compressed);
        await AsyncStorage.setItem('@dobix_user_avatar', compressed);
        if (Platform.OS === 'web') {
          window.alert('Profile photo captured and updated!');
        } else {
          Alert.alert('Photo Updated', 'Your profile picture has been updated.');
        }
      }
    } catch (error) {
      console.log('Error taking avatar photo:', error);
    }
  };

  const showPhotoOptions = () => {
    if (Platform.OS === 'web') {
      handlePickAvatar();
    } else {
      Alert.alert(
        'Profile Picture',
        'Choose how you want to update your profile photo',
        [
          { text: 'Take Photo with Camera', onPress: handleTakeAvatarPhoto },
          { text: 'Choose from Gallery', onPress: handlePickAvatar },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
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
        academic_year: academicYear,
        avatar_url: avatarUri,
      };

      await AsyncStorage.setItem(
        '@campuswash_user_session',
        JSON.stringify(updatedProfile)
      );

      setIsEditing(false);

      if (Platform.OS === 'web') {
        window.alert('Your student profile and hostel details have been saved.');
      } else {
        Alert.alert('Profile Saved', 'Your student profile and hostel details have been saved.');
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

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
      await AsyncStorage.clear();
      signOut();
    }
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      const confirmSignout = window.confirm('Are you sure you want to sign out from DobiX?');
      if (confirmSignout) {
        signOut();
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out from DobiX?',
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
      {/* 🪪 Digital Campus Identity Card */}
      <View style={styles.idCard}>
        <View style={styles.idCardTop}>
          <Image
            source={require('../../assets/rvs_logo.png')}
            style={styles.idCardLogo}
            resizeMode="contain"
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.idCardUniversity}>RVS UNIVERSITY</Text>
            <Text style={styles.idCardSub}>Hostel Laundry Digital Pass & ID</Text>
          </View>
          <View style={styles.yearPill}>
            <Text style={styles.yearPillText}>{academicYear}</Text>
          </View>
        </View>

        <View style={styles.idCardDivider} />

        <View style={styles.idCardBody}>
          {/* Avatar with Camera Overlay */}
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={showPhotoOptions}
            activeOpacity={0.85}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>
                  {(name || profile?.email || 'S').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.cameraIconBadge}>
              <Ionicons name="camera" size={13} color="#FFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.idCardDetails}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.idCardName}>{name || 'Student'}</Text>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
            </View>
            <Text style={styles.idCardRoll}>
              Roll No: <Text style={{ fontWeight: '800', color: '#0F172A' }}>{studentId || profile?.student_id || 'N/A'}</Text>
            </Text>
            <Text style={styles.idCardRoom}>
              {hostelBlock || 'Hostel'} • Rm {roomNumber || 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.idCardFooter}>
          <Text style={styles.idCardEmail}>{profile?.email}</Text>
          <Text style={styles.idCardPhone}>{phoneNumber || profile?.phone_number || 'No Phone'}</Text>
        </View>
      </View>

      {/* 📊 Lifetime Laundry Statistics Card */}
      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>🧺 Lifetime Laundry Activity</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#4338CA' }]}>{totalClothesCleaned}</Text>
            <Text style={styles.statLabel}>Clothes Washed</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#15803D' }]}>{completedOrders}</Text>
            <Text style={styles.statLabel}>Completed Drops</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#D97706' }]}>{activeOrders}</Text>
            <Text style={styles.statLabel}>Active Bags</Text>
          </View>
        </View>
      </View>

      {/* 📝 Profile Edit Form Fields */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Student Profile & Room Details</Text>
          <TouchableOpacity
            style={[styles.editBtn, isEditing && styles.editBtnActive]}
            onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#4338CA" />
            ) : (
              <>
                <Ionicons
                  name={isEditing ? 'checkmark-circle' : 'create-outline'}
                  size={15}
                  color={isEditing ? '#FFF' : '#4338CA'}
                />
                <Text style={[styles.editBtnText, isEditing && { color: '#FFF' }]}>
                  {isEditing ? 'Save Profile' : 'Edit Information'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Change Photo Shortcut button */}
        <TouchableOpacity
          style={styles.changePhotoBtn}
          onPress={showPhotoOptions}
          activeOpacity={0.8}
        >
          <Ionicons name="image-outline" size={16} color="#4338CA" />
          <Text style={styles.changePhotoBtnText}>
            {avatarUri ? 'Change Profile Picture' : 'Upload Profile Picture'}
          </Text>
        </TouchableOpacity>

        {/* Full Name */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Full Name</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={name}
            onChangeText={setName}
            editable={isEditing}
            placeholder="Your full name"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Roll Number */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Student / Roll Number</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={studentId}
            onChangeText={setStudentId}
            editable={isEditing}
            placeholder="e.g. 21RVS045"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Academic Year Selection */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Academic Year</Text>
          {isEditing ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yearChoices}>
              {ACADEMIC_YEARS.map((yr) => (
                <TouchableOpacity
                  key={yr}
                  style={[styles.yearChoiceBtn, academicYear === yr && styles.yearChoiceBtnActive]}
                  onPress={() => setAcademicYear(yr)}
                >
                  <Text style={[styles.yearChoiceText, academicYear === yr && styles.yearChoiceTextActive]}>
                    {yr}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={academicYear}
              editable={false}
            />
          )}
        </View>

        {/* Hostel Block */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Hostel Block</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={hostelBlock}
            onChangeText={setHostelBlock}
            placeholder="e.g. Block A (Boys Hostel) or Kaveri Block"
            placeholderTextColor="#94A3B8"
            editable={isEditing}
          />
        </View>

        {/* Room Number */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Room Number</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={roomNumber}
            onChangeText={setRoomNumber}
            placeholder="e.g. 204"
            placeholderTextColor="#94A3B8"
            editable={isEditing}
          />
        </View>

        {/* Phone Number */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Mobile Number (SMS Alerts)</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.inputDisabled]}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="10-digit mobile number"
            placeholderTextColor="#94A3B8"
            editable={isEditing}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      {/* 🔒 Privacy, Security & Account Management */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Privacy & Security</Text>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => setShowPrivacyModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.actionRowLeft}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#16A34A" />
            <Text style={styles.actionRowText}>Privacy Policy & Data Safety Disclosures</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        <View style={styles.actionDivider} />

        <TouchableOpacity
          style={styles.actionRow}
          onPress={handleDeleteAccount}
          activeOpacity={0.7}
        >
          <View style={styles.actionRowLeft}>
            <Ionicons name="trash-outline" size={20} color="#DC2626" />
            <Text style={[styles.actionRowText, { color: '#DC2626' }]}>
              Delete Account & Laundry History
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* 🚪 Sign Out Button */}
      <TouchableOpacity
        style={styles.signOutBtn}
        onPress={handleSignOut}
        activeOpacity={0.85}
      >
        <Ionicons name="log-out-outline" size={20} color="#FFF" />
        <Text style={styles.signOutBtnText}>Sign Out from DobiX</Text>
      </TouchableOpacity>

      {/* App Version Info */}
      <View style={styles.footerVersion}>
        <Text style={styles.footerVersionText}>
          DobiX v1.0.0 • RVS University Hostel Laundry Portal
        </Text>
      </View>

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
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  idCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 16,
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
  },
  idCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  idCardLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  idCardUniversity: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  idCardSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  yearPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  yearPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4338CA',
  },
  idCardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  idCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#4338CA',
  },
  avatarFallback: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#4338CA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0F172A',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  idCardDetails: {
    flex: 1,
    marginLeft: 14,
  },
  idCardName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  idCardRoll: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  idCardRoom: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    marginTop: 2,
  },
  idCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  idCardEmail: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  idCardPhone: {
    fontSize: 11,
    color: '#1E293B',
    fontWeight: '700',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    gap: 5,
  },
  editBtnActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  editBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#4338CA',
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 8,
    gap: 6,
    marginBottom: 14,
  },
  changePhotoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  inputDisabled: {
    backgroundColor: '#F8FAFC',
    color: '#64748B',
    borderColor: '#E2E8F0',
  },
  yearChoices: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  yearChoiceBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  yearChoiceBtnActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  yearChoiceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  yearChoiceTextActive: {
    color: '#FFF',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  actionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  actionRowText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  actionDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
  },
  signOutBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  footerVersion: {
    alignItems: 'center',
    marginTop: 18,
  },
  footerVersionText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
});

export default ProfileScreen;
