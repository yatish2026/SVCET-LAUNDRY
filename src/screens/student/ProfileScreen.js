import React, { useState, useEffect, useMemo } from 'react';
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
  Modal,
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

  // Profile fields
  const [name, setName] = useState(profile?.full_name || '');
  const [studentId, setStudentId] = useState(profile?.student_id || '');
  const [roomNumber, setRoomNumber] = useState(profile?.room_number || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || '');
  const [hostelBlock, setHostelBlock] = useState(profile?.hostel_block || HOSTEL_BLOCKS[0]);
  const [academicYear, setAcademicYear] = useState(profile?.academic_year || '1st Year');
  const [avatarUri, setAvatarUri] = useState(profile?.avatar_url || null);

  // Edit Modal & UI State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // 📅 Calendar / Timeframe Usage Analyzer State
  const [calendarMode, setCalendarMode] = useState('MONTH'); // 'DAY' | 'MONTH' | 'YEAR'
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10)); // 'YYYY-MM-DD'
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7)); // 'YYYY-MM'
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString()); // 'YYYY'

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

  // Compute student-specific laundry bookings
  const studentEmail = (profile?.email || '').trim().toLowerCase();
  const studentRollNo = (profile?.student_id || '').trim();
  const cleanStudentName = (profile?.full_name || '').trim().toLowerCase();

  const studentBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (b.user_id && profile?.id && b.user_id === profile.id) return true;
      if (b.student_email && studentEmail && b.student_email.toLowerCase() === studentEmail) return true;
      const bName = (b.student_name || '').trim().toLowerCase();
      if (cleanStudentName && bName && bName === cleanStudentName) return true;
      if (studentRollNo && studentRollNo !== 'SVCET-STD' && studentRollNo !== 'RVS-STD' && b.student_id === studentRollNo) return true;
      return false;
    });
  }, [bookings, profile, studentEmail, cleanStudentName, studentRollNo]);

  // Extract available months from student's history
  const availableMonths = useMemo(() => {
    const set = new Set();
    const currentM = new Date().toISOString().slice(0, 7);
    set.add(currentM);
    studentBookings.forEach((b) => {
      if (b.created_at) {
        set.add(b.created_at.slice(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [studentBookings]);

  // Extract available years
  const availableYears = useMemo(() => {
    const set = new Set();
    const currentY = new Date().getFullYear().toString();
    set.add(currentY);
    studentBookings.forEach((b) => {
      if (b.created_at) {
        set.add(b.created_at.slice(0, 4));
      }
    });
    return Array.from(set).sort().reverse();
  }, [studentBookings]);

  // Filtered laundry activity based on Calendar / Timeframe selection
  const calendarFilteredBookings = useMemo(() => {
    return studentBookings.filter((b) => {
      const bDate = b.created_at || '';
      if (calendarMode === 'DAY') {
        return bDate.startsWith(selectedDate);
      } else if (calendarMode === 'MONTH') {
        return bDate.startsWith(selectedMonth);
      } else if (calendarMode === 'YEAR') {
        return bDate.startsWith(selectedYear);
      }
      return true;
    });
  }, [studentBookings, calendarMode, selectedDate, selectedMonth, selectedYear]);

  // Summary Metrics for selected timeframe
  const timeframeClothesCount = useMemo(() => {
    return calendarFilteredBookings.reduce((sum, b) => sum + (b.total_items || 0), 0);
  }, [calendarFilteredBookings]);

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

  const handleSaveProfileModal = async () => {
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

      setEditModalVisible(false);

      if (Platform.OS === 'web') {
        window.alert('Your student profile details have been saved successfully.');
      } else {
        Alert.alert('Profile Updated', 'Your student profile details have been saved successfully.');
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return { label: 'Completed', color: '#16A34A', bg: '#DCFCE7' };
      case 'ready_for_pickup':
        return { label: 'Ready for Pickup', color: '#D97706', bg: '#FEF3C7' };
      case 'drying_ironing':
        return { label: 'Drying & Iron', color: '#7C3AED', bg: '#F3E8FF' };
      case 'in_wash':
        return { label: 'In Washing', color: '#2563EB', bg: '#DBEAFE' };
      default:
        return { label: 'Pending Intake', color: '#475569', bg: '#F1F5F9' };
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 🪪 Professional Digital Campus ID Card */}
      <View style={styles.idCard}>
        <View style={styles.idCardTop}>
          <Image
            source={require('../../assets/rvs_logo.png')}
            style={styles.idCardLogo}
            resizeMode="contain"
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.idCardUniversity}>RVS UNIVERSITY</Text>
            <Text style={styles.idCardSub}>Hostel Laundry Digital Identity</Text>
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

      {/* ✏️ Edit Profile Action Bar */}
      <View style={styles.editActionCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.editCardTitle}>Student Profile & Room</Text>
          <Text style={styles.editCardSub}>Update room number, phone, and name details</Text>
        </View>
        <TouchableOpacity
          style={styles.openEditBtn}
          onPress={() => setEditModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="create-outline" size={16} color="#FFF" />
          <Text style={styles.openEditBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* 📅 CALENDAR / TIMEFRAME LAUNDRY USAGE ANALYZER */}
      <View style={styles.calendarCard}>
        <View style={styles.calendarCardHeader}>
          <View>
            <Text style={styles.cardSectionTitle}>📅 Laundry Usage Calendar & Stats</Text>
            <Text style={styles.cardSectionSub}>Track clothes given for wash by day, month, or year</Text>
          </View>
        </View>

        {/* 1. Timeframe Mode Tabs (Day / Month / Year) */}
        <View style={styles.timeframeTabs}>
          {[
            { id: 'DAY', label: 'Day-Wise', icon: 'today-outline' },
            { id: 'MONTH', label: 'Month-Wise', icon: 'calendar-outline' },
            { id: 'YEAR', label: 'Yearly', icon: 'stats-chart-outline' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.timeframeTab, calendarMode === tab.id && styles.timeframeTabActive]}
              onPress={() => setCalendarMode(tab.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={tab.icon}
                size={15}
                color={calendarMode === tab.id ? '#4338CA' : '#64748B'}
              />
              <Text style={[styles.timeframeTabText, calendarMode === tab.id && styles.timeframeTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 2. Date / Month / Year Selector Row */}
        {calendarMode === 'DAY' && (
          <View style={styles.pickerRow}>
            <Text style={styles.pickerLabel}>Choose Date:</Text>
            <View style={styles.quickDatesWrap}>
              <TouchableOpacity
                style={[styles.quickDateChip, selectedDate === new Date().toISOString().slice(0, 10) && styles.quickDateChipActive]}
                onPress={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
              >
                <Text style={[styles.quickDateChipText, selectedDate === new Date().toISOString().slice(0, 10) && styles.quickDateChipTextActive]}>
                  Today
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickDateChip, selectedDate === new Date(Date.now() - 86400000).toISOString().slice(0, 10) && styles.quickDateChipActive]}
                onPress={() => setSelectedDate(new Date(Date.now() - 86400000).toISOString().slice(0, 10))}
              >
                <Text style={[styles.quickDateChipText, selectedDate === new Date(Date.now() - 86400000).toISOString().slice(0, 10) && styles.quickDateChipTextActive]}>
                  Yesterday
                </Text>
              </TouchableOpacity>

              <TextInput
                style={styles.dateInputBox}
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>
        )}

        {calendarMode === 'MONTH' && (
          <View style={styles.pickerRow}>
            <Text style={styles.pickerLabel}>Select Month:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {availableMonths.map((m) => {
                const d = new Date(`${m}-01T00:00:00Z`);
                const monthName = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
                const isSel = selectedMonth === m;

                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.quickDateChip, isSel && styles.quickDateChipActive]}
                    onPress={() => setSelectedMonth(m)}
                  >
                    <Text style={[styles.quickDateChipText, isSel && styles.quickDateChipTextActive]}>
                      {monthName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {calendarMode === 'YEAR' && (
          <View style={styles.pickerRow}>
            <Text style={styles.pickerLabel}>Select Year:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {availableYears.map((yr) => {
                const isSel = selectedYear === yr;
                return (
                  <TouchableOpacity
                    key={yr}
                    style={[styles.quickDateChip, isSel && styles.quickDateChipActive]}
                    onPress={() => setSelectedYear(yr)}
                  >
                    <Text style={[styles.quickDateChipText, isSel && styles.quickDateChipTextActive]}>
                      Year {yr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 3. Selected Period Summary Metric Card */}
        <View style={styles.periodSummaryCard}>
          <View style={styles.periodSummaryItem}>
            <Text style={styles.periodSummaryNum}>{timeframeClothesCount}</Text>
            <Text style={styles.periodSummaryLabel}>Clothes Given</Text>
          </View>
          <View style={styles.periodSummaryDivider} />
          <View style={styles.periodSummaryItem}>
            <Text style={[styles.periodSummaryNum, { color: '#059669' }]}>
              {calendarFilteredBookings.length}
            </Text>
            <Text style={styles.periodSummaryLabel}>Wash Drop-offs</Text>
          </View>
          <View style={styles.periodSummaryDivider} />
          <View style={styles.periodSummaryItem}>
            <Text style={[styles.periodSummaryNum, { color: '#D97706' }]}>
              {calendarFilteredBookings.filter((b) => b.status !== 'completed' && b.status !== 'cancelled').length}
            </Text>
            <Text style={styles.periodSummaryLabel}>In Progress</Text>
          </View>
        </View>

        {/* 4. Drop-off Log in this Period */}
        {calendarFilteredBookings.length === 0 ? (
          <View style={styles.emptyLogBox}>
            <Ionicons name="calendar-outline" size={28} color="#94A3B8" />
            <Text style={styles.emptyLogTitle}>No Laundry on this Date/Period</Text>
            <Text style={styles.emptyLogSub}>You have not submitted any laundry orders in this selection.</Text>
          </View>
        ) : (
          <View style={styles.calendarLogList}>
            {calendarFilteredBookings.map((b) => {
              const badge = getStatusBadge(b.status);
              const dropDate = b.created_at ? new Date(b.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Drop Date';

              return (
                <View key={b.id} style={styles.calendarLogRow}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.calendarLogDate}>{dropDate}</Text>
                      <Text style={styles.calendarLogToken}>#{b.pickup_token}</Text>
                    </View>
                    <Text style={styles.calendarLogItems}>
                      🧺 <Text style={{ fontWeight: '800', color: '#1E293B' }}>{b.total_items}</Text> Clothes Cleaned
                    </Text>
                  </View>

                  <View style={[styles.calendarLogBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.calendarLogBadgeText, { color: badge.color }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* 📊 Lifetime Laundry Statistics Card */}
      <View style={styles.statsCard}>
        <Text style={styles.cardSectionTitle}>📈 Lifetime Total Laundry Stats</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#4338CA' }]}>{totalClothesCleaned}</Text>
            <Text style={styles.statLabel}>Total Clothes Washed</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#15803D' }]}>{completedOrders}</Text>
            <Text style={styles.statLabel}>Completed Washes</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#D97706' }]}>{activeOrders}</Text>
            <Text style={styles.statLabel}>Active Bags</Text>
          </View>
        </View>
      </View>

      {/* 🔒 Privacy, Security & Account Management */}
      <View style={styles.settingsCard}>
        <Text style={styles.cardSectionTitle}>Privacy & Account Settings</Text>

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

      {/* 📝 SEPARATE EDIT PROFILE MODAL / SUB-PAGE */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.editModalContainer}>
          {/* Edit Modal Header */}
          <View style={styles.editModalHeader}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.editModalBackBtn}>
              <Ionicons name="arrow-back" size={22} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.editModalTitle}>Edit Student Profile</Text>
            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={handleSaveProfileModal}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.modalSaveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.editModalBody} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            {/* Avatar picker preview */}
            <View style={styles.modalAvatarCenter}>
              <TouchableOpacity onPress={showPhotoOptions} style={styles.avatarWrap} activeOpacity={0.85}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImgLarge} />
                ) : (
                  <View style={styles.avatarFallbackLarge}>
                    <Text style={styles.avatarFallbackTextLarge}>
                      {(name || profile?.email || 'S').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.cameraIconBadgeLarge}>
                  <Ionicons name="camera" size={16} color="#FFF" />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarHintText}>Tap to change profile picture</Text>
            </View>

            {/* Form Fields */}
            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Full Name</Text>
              <TextInput
                style={styles.modalInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter full name"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Student / Roll Number</Text>
              <TextInput
                style={styles.modalInput}
                value={studentId}
                onChangeText={setStudentId}
                placeholder="e.g. 21RVS045"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Academic Year</Text>
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
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Hostel Block</Text>
              <TextInput
                style={styles.modalInput}
                value={hostelBlock}
                onChangeText={setHostelBlock}
                placeholder="e.g. Block A (Boys Hostel)"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Room Number</Text>
              <TextInput
                style={styles.modalInput}
                value={roomNumber}
                onChangeText={setRoomNumber}
                placeholder="e.g. 204"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Mobile Number (for SMS & WhatsApp)</Text>
              <TextInput
                style={styles.modalInput}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="10-digit phone number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />
            </View>

            {/* Bottom Save Action */}
            <TouchableOpacity
              style={styles.saveActionBtn}
              onPress={handleSaveProfileModal}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.saveActionBtnText}>Save Profile Changes</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

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
    marginBottom: 14,
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
  editActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  editCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  editCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  openEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4338CA',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  openEditBtnText: {
    color: '#FFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  calendarCardHeader: {
    marginBottom: 12,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSectionSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  timeframeTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    gap: 4,
    marginBottom: 12,
  },
  timeframeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 7,
    gap: 4,
  },
  timeframeTabActive: {
    backgroundColor: '#FFFFFF',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  timeframeTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  timeframeTabTextActive: {
    color: '#4338CA',
  },
  pickerRow: {
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  quickDatesWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickDateChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickDateChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  quickDateChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  quickDateChipTextActive: {
    color: '#4338CA',
  },
  dateInputBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    minWidth: 100,
  },
  periodSummaryCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  periodSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  periodSummaryNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#4338CA',
  },
  periodSummaryLabel: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 2,
  },
  periodSummaryDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  emptyLogBox: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  emptyLogTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginTop: 6,
  },
  emptyLogSub: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
  },
  calendarLogList: {
    gap: 8,
  },
  calendarLogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calendarLogDate: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  calendarLogToken: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  calendarLogItems: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  calendarLogBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  calendarLogBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
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
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
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
  editModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  editModalBackBtn: {
    padding: 4,
  },
  editModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSaveBtn: {
    backgroundColor: '#4338CA',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  modalSaveBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  editModalBody: {
    flex: 1,
  },
  modalAvatarCenter: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarImgLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    borderColor: '#4338CA',
  },
  avatarFallbackLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4338CA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackTextLarge: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cameraIconBadgeLarge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0F172A',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarHintText: {
    fontSize: 12,
    color: '#4338CA',
    fontWeight: '700',
    marginTop: 8,
  },
  modalField: {
    marginBottom: 14,
  },
  modalFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 5,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#0F172A',
  },
  yearChoices: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  yearChoiceBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
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
  saveActionBtn: {
    backgroundColor: '#4338CA',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveActionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default ProfileScreen;
