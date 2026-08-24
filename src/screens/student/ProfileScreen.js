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
import {
  COUNTRY_CODES,
  STUDENT_GENDERS,
  STUDENT_LOCATIONS,
  ACADEMIC_COURSES,
  getStudentSchedule,
} from '../../constants/schedule';
import { useAuth } from '../../context/AuthContext';
import { useLaundry } from '../../context/LaundryContext';
import { apiService } from '../../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PrivacyPolicyModal from '../common/PrivacyPolicyModal';
import TermsConditionsModal from '../common/TermsConditionsModal';
import RaiseTicketModal from '../../components/RaiseTicketModal';

export const ProfileScreen = () => {
  const { profile, updateProfile, signOut } = useAuth();
  const { bookings, tickets } = useLaundry();

  // Helper to parse country code and digits
  const parsePhoneAndCountry = (rawPhone) => {
    if (!rawPhone) return { codeObj: COUNTRY_CODES[0], number: '' };
    const matched = COUNTRY_CODES.find((c) => rawPhone.startsWith(c.code));
    if (matched) {
      return { codeObj: matched, number: rawPhone.replace(matched.code, '').trim().replace(/[^0-9]/g, '') };
    }
    return { codeObj: COUNTRY_CODES[0], number: rawPhone.replace(/[^0-9]/g, '') };
  };

  const initialParsedPhone = parsePhoneAndCountry(profile?.phone_number);

  // Profile fields
  const [name, setName] = useState(profile?.full_name || '');
  const [gender, setGender] = useState(profile?.gender || 'male');
  const [stateLocation, setStateLocation] = useState(profile?.location || STUDENT_LOCATIONS[0]);
  const [studentId, setStudentId] = useState(profile?.student_id || '');
  const [roomNumber, setRoomNumber] = useState(profile?.room_number || '');
  const [countryCode, setCountryCode] = useState(initialParsedPhone.codeObj);
  const [phoneNumber, setPhoneNumber] = useState(initialParsedPhone.number);
  const [hostelBlock, setHostelBlock] = useState(profile?.hostel_block || HOSTEL_BLOCKS[0]);
  const [academicYear, setAcademicYear] = useState(profile?.academic_year || ACADEMIC_COURSES[0]);
  const [avatarUri, setAvatarUri] = useState(profile?.avatar_url || null);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Filter student tickets
  const myTickets = useMemo(() => {
    if (!tickets || !Array.isArray(tickets)) return [];
    return tickets.filter(
      (t) =>
        (profile?.email && t.student_email?.toLowerCase() === profile.email.toLowerCase()) ||
        (profile?.student_id && t.student_id === profile.student_id)
    );
  }, [tickets, profile]);

  const userAvatarKey = useMemo(() => {
    if (profile?.id) return `@laundrygo_user_avatar_${profile.id}`;
    if (profile?.email) return `@laundrygo_user_avatar_${profile.email.trim().toLowerCase()}`;
    return null;
  }, [profile?.id, profile?.email]);

  // Sync state if profile changes globally
  useEffect(() => {
    if (profile) {
      setName(profile.full_name || '');
      setGender(profile.gender || 'male');
      setStateLocation(profile.location || STUDENT_LOCATIONS[0]);
      setStudentId(profile.student_id || '');
      setRoomNumber(profile.room_number || '');
      const parsed = parsePhoneAndCountry(profile.phone_number);
      setCountryCode(parsed.codeObj);
      setPhoneNumber(parsed.number);
      setHostelBlock(profile.hostel_block || HOSTEL_BLOCKS[0]);
      setAcademicYear(profile.academic_year || ACADEMIC_COURSES[0]);

      // Load avatar strictly for THIS specific user account
      const loadUserAvatar = async () => {
        if (profile.avatar_url) {
          setAvatarUri(profile.avatar_url);
        } else if (userAvatarKey) {
          try {
            const stored = await AsyncStorage.getItem(userAvatarKey);
            setAvatarUri(stored || null);
          } catch (e) {
            setAvatarUri(null);
          }
        } else {
          setAvatarUri(null);
        }
      };
      loadUserAvatar();
    } else {
      setAvatarUri(null);
    }
  }, [profile, userAvatarKey]);

  // Edit Modal & UI State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [coursePickerVisible, setCoursePickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // 📅 Single Unified Timeframe State ('ALL' | 'MONTH' | 'DAY' | 'YEAR')
  const [calendarMode, setCalendarMode] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10)); // 'YYYY-MM-DD'
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7)); // 'YYYY-MM'
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString()); // 'YYYY'

  // Compute student-specific schedule based on official RVS rules
  const userSchedule = useMemo(() => {
    return getStudentSchedule({
      gender,
      location: stateLocation,
      academic_year: academicYear,
      hostel_block: hostelBlock,
    });
  }, [gender, stateLocation, academicYear, hostelBlock]);

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

  // Extract available months
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

  // Filtered laundry activity based on chosen timeframe
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
      return true; // 'ALL'
    });
  }, [studentBookings, calendarMode, selectedDate, selectedMonth, selectedYear]);

  // Dynamic Metrics for the selected timeframe (Single Source of Truth)
  const timeframeClothesCount = useMemo(() => {
    return calendarFilteredBookings.reduce((sum, b) => sum + (b.total_items || 0), 0);
  }, [calendarFilteredBookings]);

  const timeframeCompletedCount = useMemo(() => {
    return calendarFilteredBookings.filter((b) => b.status === 'completed').length;
  }, [calendarFilteredBookings]);

  const timeframeActiveCount = useMemo(() => {
    return calendarFilteredBookings.filter((b) => b.status !== 'completed' && b.status !== 'cancelled').length;
  }, [calendarFilteredBookings]);

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
        if (userAvatarKey) {
          await AsyncStorage.setItem(userAvatarKey, compressed);
        }
        if (updateProfile) {
          await updateProfile({ avatar_url: compressed });
        }
        await AsyncStorage.removeItem('@laundrygo_user_avatar').catch(() => {});
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
        if (userAvatarKey) {
          await AsyncStorage.setItem(userAvatarKey, compressed);
        }
        if (updateProfile) {
          await updateProfile({ avatar_url: compressed });
        }
        await AsyncStorage.removeItem('@laundrygo_user_avatar').catch(() => {});
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
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      if (countryCode.length && cleanPhone && cleanPhone.length !== countryCode.length) {
        Alert.alert(
          'Invalid Mobile Number',
          `Please enter a valid ${countryCode.length}-digit mobile number for ${countryCode.flag} ${countryCode.country} (currently ${cleanPhone.length} digits).`
        );
        setSaving(false);
        return;
      }

      const fullFormattedPhone = cleanPhone ? `${countryCode.code} ${cleanPhone}` : '';

      const updatedProfile = {
        ...profile,
        full_name: name.trim(),
        gender,
        location: stateLocation,
        student_id: studentId.trim(),
        room_number: roomNumber.trim(),
        phone_number: fullFormattedPhone,
        hostel_block: hostelBlock,
        academic_year: academicYear,
        avatar_url: avatarUri,
      };

      await updateProfile(updatedProfile);

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
      const confirmSignout = window.confirm('Are you sure you want to sign out from LaundryGo?');
      if (confirmSignout) {
        signOut();
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out from LaundryGo?',
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
          <View style={[styles.yearPill, { backgroundColor: userSchedule.badgeBg, borderColor: userSchedule.badgeBorder }]}>
            <Text style={[styles.yearPillText, { color: userSchedule.badgeColor }]}>{userSchedule.dropoffDay} Drop</Text>
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
              Roll No: <Text style={{ fontWeight: '800', color: '#0F172A' }}>{studentId || profile?.student_id || 'N/A'}</Text> • <Text style={{ fontWeight: '700', color: '#4338CA' }}>{academicYear}</Text>
            </Text>
            <Text style={styles.idCardRoom}>
              {hostelBlock || 'Hostel'} • Rm {roomNumber || 'N/A'}
            </Text>
            <View style={styles.regionBadge}>
              <Ionicons name="location-sharp" size={12} color="#4338CA" />
              <Text style={styles.regionBadgeText}>{stateLocation} • {gender === 'female' ? 'Female' : 'Male'}</Text>
            </View>
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
          <Text style={styles.editCardSub}>Update gender, state, course, room & phone details</Text>
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

      {/* 📊 SINGLE COMBINED LAUNDRY ANALYTICS & USAGE HUB */}
      <View style={styles.calendarCard}>
        <View style={styles.calendarCardHeader}>
          <View>
            <Text style={styles.cardSectionTitle}>📊 Laundry Analytics & Wash Usage</Text>
            <Text style={styles.cardSectionSub}>
              {calendarMode === 'ALL'
                ? 'All-Time total wash metrics'
                : calendarMode === 'MONTH'
                ? `Activity for ${new Date(`${selectedMonth}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })}`
                : calendarMode === 'DAY'
                ? `Activity for ${selectedDate}`
                : `Activity for Year ${selectedYear}`}
            </Text>
          </View>
        </View>

        {/* 1. Timeframe Filter Tabs */}
        <View style={styles.timeframeTabs}>
          {[
            { id: 'ALL', label: 'All-Time', icon: 'stats-chart-outline' },
            { id: 'MONTH', label: 'Month-Wise', icon: 'calendar-outline' },
            { id: 'DAY', label: 'Day-Wise', icon: 'today-outline' },
            { id: 'YEAR', label: 'Yearly', icon: 'time-outline' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.timeframeTab, calendarMode === tab.id && styles.timeframeTabActive]}
              onPress={() => setCalendarMode(tab.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={tab.icon}
                size={14}
                color={calendarMode === tab.id ? '#4338CA' : '#64748B'}
              />
              <Text style={[styles.timeframeTabText, calendarMode === tab.id && styles.timeframeTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 2. Date / Month Pickers (Only when Day, Month, or Year is active) */}
        {calendarMode === 'DAY' && (
          <View style={styles.pickerRow}>
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

        {/* 3. THE SINGLE UNIFIED STATS GRID (Updates dynamically!) */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#4338CA' }]}>{timeframeClothesCount}</Text>
            <Text style={styles.statLabel}>Clothes Washed</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#15803D' }]}>{timeframeCompletedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#D97706' }]}>{timeframeActiveCount}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
        </View>

        {/* 4. Drop-off Log in this Period */}
        {calendarFilteredBookings.length === 0 ? (
          <View style={styles.emptyLogBox}>
            <Ionicons name="calendar-outline" size={26} color="#94A3B8" />
            <Text style={styles.emptyLogTitle}>No Laundry for this Selection</Text>
            <Text style={styles.emptyLogSub}>No drop-offs recorded for the chosen timeframe.</Text>
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
          onPress={() => setShowTermsModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.actionRowLeft}>
            <Ionicons name="document-text-outline" size={20} color="#4338CA" />
            <Text style={styles.actionRowText}>Terms of Service & Hostel Rules</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        <View style={styles.actionDivider} />

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => setTicketModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.actionRowLeft}>
            <Ionicons name="warning-outline" size={20} color="#EA580C" />
            <Text style={[styles.actionRowText, { color: '#C2410C', fontWeight: '700' }]}>
              Raise a Complaint / Report Server Issue
            </Text>
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

      {/* 🎫 24/7 HELP DESK & ISSUE TICKET HUB */}
      <View style={styles.supportHubCard}>
        <View style={styles.supportHubHeader}>
          <View style={styles.supportIconWrap}>
            <Ionicons name="chatbubbles" size={20} color="#4338CA" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.supportHubTitle}>Need Help or Found a Bug?</Text>
            <Text style={styles.supportHubSub}>Report app crashes, server errors, or laundry issues</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.raiseTicketActionBtn}
          onPress={() => setTicketModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle" size={18} color="#FFF" />
          <Text style={styles.raiseTicketActionBtnText}>Raise a Ticket / Report Issue</Text>
        </TouchableOpacity>

        {/* My Submitted Tickets List */}
        {myTickets.length > 0 && (
          <View style={styles.myTicketsWrap}>
            <Text style={styles.myTicketsHeader}>My Submitted Complaints ({myTickets.length})</Text>
            {myTickets.map((tkt) => {
              const isResolved = tkt.status === 'resolved';
              return (
                <View key={tkt.id} style={styles.ticketItemRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.ticketItemTitle} numberOfLines={1}>
                      {tkt.title}
                    </Text>
                    <Text style={styles.ticketItemCat}>
                      {tkt.category} • {new Date(tkt.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.ticketStatusPill,
                      isResolved ? styles.tktPillResolved : styles.tktPillOpen,
                    ]}
                  >
                    <Text
                      style={[
                        styles.ticketStatusPillText,
                        isResolved ? styles.tktPillTextResolved : styles.tktPillTextOpen,
                      ]}
                    >
                      {isResolved ? 'Resolved' : 'In Review'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* 🚪 Sign Out Button */}
      <TouchableOpacity
        style={styles.signOutBtn}
        onPress={handleSignOut}
        activeOpacity={0.85}
      >
        <Ionicons name="log-out-outline" size={20} color="#FFF" />
        <Text style={styles.signOutBtnText}>Sign Out from LaundryGo</Text>
      </TouchableOpacity>

      {/* App Version Info */}
      <View style={styles.footerVersion}>
        <Text style={styles.footerVersionText}>
          LaundryGo v1.0.0 • RVS University Hostel Laundry Portal
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

          <ScrollView
            style={styles.editModalBody}
            contentContainerStyle={{ padding: 20, paddingBottom: Platform.OS === 'web' ? 40 : 160 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={true}
          >
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

            {/* Gender Selection */}
            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Gender / Hostel Type</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {STUDENT_GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.genderModalBtn, gender === g.id && styles.genderModalBtnActive]}
                    onPress={() => setGender(g.id)}
                  >
                    <Ionicons name={g.icon} size={16} color={gender === g.id ? '#FFF' : '#475569'} />
                    <Text style={[styles.genderModalBtnText, gender === g.id && { color: '#FFF' }]}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 📍 State Location Dropdown Picker */}
            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Home State / Region *</Text>
              <TouchableOpacity
                style={styles.dropdownPickerBtn}
                onPress={() => setLocationPickerVisible(true)}
                activeOpacity={0.8}
              >
                <View style={styles.dropdownPickerLeft}>
                  <Ionicons name="location-outline" size={18} color="#4338CA" />
                  <Text style={styles.dropdownPickerText}>{stateLocation}</Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#64748B" />
              </TouchableOpacity>
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

            {/* 🎓 Academic Course / Branch Dropdown Picker */}
            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Course & Year of Study *</Text>
              <TouchableOpacity
                style={styles.dropdownPickerBtn}
                onPress={() => setCoursePickerVisible(true)}
                activeOpacity={0.8}
              >
                <View style={styles.dropdownPickerLeft}>
                  <Ionicons name="school-outline" size={18} color="#1D4ED8" />
                  <Text style={styles.dropdownPickerText}>{academicYear}</Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalFieldLabel}>Hostel Block</Text>
              <TextInput
                style={styles.modalInput}
                value={hostelBlock}
                onChangeText={setHostelBlock}
                placeholder="e.g. Block A (Boys Hostel) or Kaveri"
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
              <View style={styles.phoneInputRow}>
                <TouchableOpacity
                  style={styles.countryCodeBtn}
                  onPress={() => setCountryPickerVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.countryFlagText}>{countryCode.flag}</Text>
                  <Text style={styles.countryCodeVal}>{countryCode.code}</Text>
                  <Ionicons name="chevron-down" size={14} color="#64748B" />
                </TouchableOpacity>

                <TextInput
                  style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
                  value={phoneNumber}
                  onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ''))}
                  placeholder={countryCode.placeholder || `${countryCode.length || 10} digits`}
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  maxLength={countryCode.length || 15}
                />
              </View>
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

      {/* 📍 EDIT MODAL: SEPARATE LOCATION SELECTION LIST SHEET */}
      <Modal
        visible={locationPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLocationPickerVisible(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <TouchableOpacity
            style={styles.pickerModalBackdrop}
            activeOpacity={1}
            onPress={() => setLocationPickerVisible(false)}
          />
          <View style={styles.pickerModalSheet}>
            <View style={styles.pickerModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="location" size={20} color="#4338CA" />
                <Text style={styles.pickerModalTitle}>Select Home State / Region</Text>
              </View>
              <TouchableOpacity
                onPress={() => setLocationPickerVisible(false)}
                style={{ padding: 4 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 380 }}
              contentContainerStyle={{ paddingVertical: 6 }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {STUDENT_LOCATIONS.map((loc) => {
                const isSelected = stateLocation === loc;
                return (
                  <TouchableOpacity
                    key={loc}
                    style={[styles.pickerItemRow, isSelected && styles.pickerItemRowActive]}
                    onPress={() => {
                      setStateLocation(loc);
                      setLocationPickerVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}>
                      {loc}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color="#4338CA" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 🎓 EDIT MODAL: SEPARATE COURSE SELECTION LIST SHEET */}
      <Modal
        visible={coursePickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCoursePickerVisible(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <TouchableOpacity
            style={styles.pickerModalBackdrop}
            activeOpacity={1}
            onPress={() => setCoursePickerVisible(false)}
          />
          <View style={styles.pickerModalSheet}>
            <View style={styles.pickerModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="school" size={20} color="#1D4ED8" />
                <Text style={styles.pickerModalTitle}>Select Course & Year</Text>
              </View>
              <TouchableOpacity
                onPress={() => setCoursePickerVisible(false)}
                style={{ padding: 4 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 380 }}
              contentContainerStyle={{ paddingVertical: 6 }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {ACADEMIC_COURSES.map((crs) => {
                const isSelected = academicYear === crs;
                return (
                  <TouchableOpacity
                    key={crs}
                    style={[styles.pickerItemRow, isSelected && styles.pickerItemRowActive]}
                    onPress={() => {
                      setAcademicYear(crs);
                      setCoursePickerVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}>
                      {crs}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color="#1D4ED8" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 🌍 EDIT MODAL: COUNTRY CODE SELECTION LIST SHEET */}
      <Modal
        visible={countryPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCountryPickerVisible(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <TouchableOpacity
            style={styles.pickerModalBackdrop}
            activeOpacity={1}
            onPress={() => setCountryPickerVisible(false)}
          />
          <View style={styles.pickerModalSheet}>
            <View style={styles.pickerModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="globe-outline" size={20} color="#4338CA" />
                <Text style={styles.pickerModalTitle}>Select Country Code</Text>
              </View>
              <TouchableOpacity
                onPress={() => setCountryPickerVisible(false)}
                style={{ padding: 4 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 380 }}
              contentContainerStyle={{ paddingVertical: 6 }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {COUNTRY_CODES.map((item) => {
                const isSelected = countryCode.code === item.code && countryCode.country === item.country;
                return (
                  <TouchableOpacity
                    key={`${item.country}-${item.code}`}
                    style={[styles.pickerItemRow, isSelected && styles.pickerItemRowActive]}
                    onPress={() => {
                      setCountryCode(item);
                      setPhoneNumber(''); // Reset digits for new country length
                      setCountryPickerVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text style={{ fontSize: 22 }}>{item.flag}</Text>
                      <View>
                        <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}>
                          {item.country}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#64748B' }}>
                          {item.length} digits • e.g. {item.placeholder}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: isSelected ? '#4338CA' : '#475569' }}>
                        {item.code}
                      </Text>
                      {isSelected && <Ionicons name="checkmark-circle" size={18} color="#4338CA" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />

      {/* Terms of Service Modal */}
      <TermsConditionsModal
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />

      {/* 🎫 Raise Support Ticket / Complaint Modal */}
      <RaiseTicketModal
        visible={ticketModalVisible}
        onClose={() => setTicketModalVisible(false)}
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  yearPillText: {
    fontSize: 11,
    fontWeight: '800',
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
  regionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    gap: 4,
  },
  regionBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#4338CA',
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
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
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
  supportHubCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
  },
  supportHubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  supportIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportHubTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  supportHubSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  raiseTicketActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4338CA',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  raiseTicketActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  myTicketsWrap: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  myTicketsHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 8,
  },
  ticketItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ticketItemTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  ticketItemCat: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  ticketStatusPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  tktPillOpen: {
    backgroundColor: '#FEF3C7',
  },
  tktPillResolved: {
    backgroundColor: '#DCFCE7',
  },
  ticketStatusPillText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  tktPillTextOpen: {
    color: '#D97706',
  },
  tktPillTextResolved: {
    color: '#15803D',
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
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 4,
  },
  countryFlagText: {
    fontSize: 16,
  },
  countryCodeVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  genderModalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 6,
  },
  genderModalBtnActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  genderModalBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  chipModalBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chipModalBtnActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  chipModalBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
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
  dropdownPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownPickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownPickerText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  pickerModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pickerModalSheet: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    boxShadow: '0 16px 36px rgba(0,0,0,0.25)',
    elevation: 12,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 6,
  },
  pickerModalTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  pickerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginVertical: 3,
    backgroundColor: '#F8FAFC',
  },
  pickerItemRowActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  pickerItemText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
  },
  pickerItemTextActive: {
    color: '#4338CA',
    fontWeight: '900',
  },
});

export default ProfileScreen;
