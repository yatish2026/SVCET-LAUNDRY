import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../../constants/theme';
import { HOSTEL_BLOCKS } from '../../constants/categories';
import {
  STUDENT_GENDERS,
  STUDENT_LOCATIONS,
  ACADEMIC_COURSES,
  getStudentSchedule,
} from '../../constants/schedule';
import { useAuth } from '../../context/AuthContext';

export const AuthScreen = () => {
  const { signIn, signUp } = useAuth();

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [regStep, setRegStep] = useState(1); // 1: Room & Account Details, 2: Course & Assigned Slot
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('male'); // 'male' | 'female'
  const [stateLocation, setStateLocation] = useState(STUDENT_LOCATIONS[0]);
  const [academicCourse, setAcademicCourse] = useState(ACADEMIC_COURSES[0]);
  const [studentId, setStudentId] = useState('');
  const [hostelBlock, setHostelBlock] = useState('Block A (Boys Hostel)');
  const [roomNumber, setRoomNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Clean Modal Selectors
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [courseModalVisible, setCourseModalVisible] = useState(false);

  // Auto-switch default hostel block when gender changes
  const handleGenderChange = (selectedGender) => {
    setGender(selectedGender);
    if (selectedGender === 'female') {
      setHostelBlock('Girls Hostel (Main Block)');
    } else {
      setHostelBlock('Block A (Boys Hostel)');
    }
  };

  // 🎯 Dynamic Dobi Slot Prediction based on Gender, Location & Course
  const computedSchedule = useMemo(() => {
    return getStudentSchedule({
      gender,
      location: stateLocation,
      academic_year: academicCourse,
      hostel_block: hostelBlock,
    });
  }, [gender, stateLocation, academicCourse, hostelBlock]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Required Fields', 'Please enter your email and password.');
      return;
    }

    try {
      setLoading(true);
      await signIn({ email: email.trim(), password });
    } catch (err) {
      Alert.alert('Sign In Failed', err.message || 'Invalid credentials. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToStep2 = () => {
    if (!fullName.trim()) {
      Alert.alert('Missing Name', 'Please enter your full name.');
      return;
    }
    if (!studentId.trim()) {
      Alert.alert('Missing Roll Number', 'Please enter your student / roll number.');
      return;
    }
    if (!roomNumber.trim()) {
      Alert.alert('Missing Room', 'Please enter your room number.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Missing Email', 'Please enter your university email address.');
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert('Password Requirement', 'Password must be at least 6 characters.');
      return;
    }
    setRegStep(2);
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      await signUp({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        gender,
        location: stateLocation,
        student_id: studentId.trim(),
        hostel_block: hostelBlock,
        room_number: roomNumber.trim(),
        phone_number: phoneNumber.trim(),
        academic_year: academicCourse,
        role: 'student',
      });
    } catch (err) {
      Alert.alert('Registration Failed', err.message || 'Unable to register student account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 20}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 280 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={true}
        contentInsetAdjustmentBehavior="always"
        showsVerticalScrollIndicator={true}
      >
        {/* 🌟 3D Radiant University Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.brandLogoContainer3D}>
            <Image
              source={require('../../assets/rvs_logo.png')}
              style={styles.brandLogo}
              resizeMode="cover"
            />
          </View>
          <View style={styles.brandUnivPill}>
            <Ionicons name="school" size={13} color="#4338CA" />
            <Text style={styles.brandUnivPillText}>RVS UNIVERSITY</Text>
          </View>
          <Text style={styles.brandTitle}>DobiX</Text>
          <Text style={styles.brandSubtitle}>Smart Hostel Laundry Portal</Text>
        </View>

        {/* 🌟 Main Authentication Card */}
        <View style={styles.card}>
          {/* Mode Switcher Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, authMode === 'login' && styles.tabActive]}
              onPress={() => setAuthMode('login')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, authMode === 'login' && styles.tabTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, authMode === 'register' && styles.tabActive]}
              onPress={() => setAuthMode('register')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, authMode === 'register' && styles.tabTextActive]}>
                Student Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          {authMode === 'login' ? (
            /* Login Form */
            <View style={styles.form}>
              <Text style={styles.formTitle}>Welcome Back</Text>
              <Text style={styles.formSub}>Sign in to track your laundry orders & pickup tokens</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>University Email / Username</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="student@rvs.edu.in"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 6 }} />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.switchPrompt}>
                <Text style={styles.switchPromptText}>New hostel student? </Text>
                <TouchableOpacity onPress={() => setAuthMode('register')}>
                  <Text style={styles.switchPromptLink}>Create an account</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* 2-Step Registration Form */
            <View style={styles.form}>
              <View style={styles.stepProgressBar}>
                <TouchableOpacity
                  style={[styles.stepTab, regStep === 1 && styles.stepTabActive]}
                  onPress={() => setRegStep(1)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.stepNumberBadge, regStep === 1 && styles.stepNumberBadgeActive]}>
                    <Text style={[styles.stepNumberText, regStep === 1 && styles.stepNumberTextActive]}>1</Text>
                  </View>
                  <Text style={[styles.stepTabText, regStep === 1 && styles.stepTabTextActive]}>
                    Room & Account
                  </Text>
                </TouchableOpacity>

                <View style={styles.stepLine} />

                <TouchableOpacity
                  style={[styles.stepTab, regStep === 2 && styles.stepTabActive]}
                  onPress={handleGoToStep2}
                  activeOpacity={0.8}
                >
                  <View style={[styles.stepNumberBadge, regStep === 2 && styles.stepNumberBadgeActive]}>
                    <Text style={[styles.stepNumberText, regStep === 2 && styles.stepNumberTextActive]}>2</Text>
                  </View>
                  <Text style={[styles.stepTabText, regStep === 2 && styles.stepTabTextActive]}>
                    Course & Slot
                  </Text>
                </TouchableOpacity>
              </View>

              {/* STEP 1: PERSONAL, ROOM & ACCOUNT DETAILS */}
              {regStep === 1 && (
                <View>
                  <Text style={styles.formTitle}>Student Room & Account</Text>
                  <Text style={styles.formSub}>Enter your hostel room details and set your password</Text>

                  {/* Full Name */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your full name"
                        placeholderTextColor="#94A3B8"
                        value={fullName}
                        onChangeText={setFullName}
                      />
                    </View>
                  </View>

                  {/* Roll / Student ID */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Student / Roll Number *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="card-outline" size={18} color="#64748B" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 21RVS045"
                        placeholderTextColor="#94A3B8"
                        value={studentId}
                        onChangeText={setStudentId}
                        autoCapitalize="characters"
                      />
                    </View>
                  </View>

                  {/* Hostel Block & Room Number */}
                  <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>Hostel Block *</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="business-outline" size={18} color="#64748B" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. Block A"
                          placeholderTextColor="#94A3B8"
                          value={hostelBlock}
                          onChangeText={setHostelBlock}
                        />
                      </View>
                    </View>

                    <View style={[styles.inputGroup, { flex: 0.8 }]}>
                      <Text style={styles.inputLabel}>Room No *</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="key-outline" size={18} color="#64748B" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. 204"
                          placeholderTextColor="#94A3B8"
                          value={roomNumber}
                          onChangeText={setRoomNumber}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Mobile Number */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Mobile Number (for SMS & WhatsApp)</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="call-outline" size={18} color="#64748B" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="10-digit mobile number"
                        placeholderTextColor="#94A3B8"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>

                  {/* Email */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>University Email *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="mail-outline" size={18} color="#64748B" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="student@rvs.edu.in"
                        placeholderTextColor="#94A3B8"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                  </View>

                  {/* Password */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Create Password *</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Minimum 6 characters"
                        placeholderTextColor="#94A3B8"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeBtn}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color="#64748B"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Continue Button */}
                  <TouchableOpacity
                    style={[styles.primaryBtn, { marginTop: 16 }]}
                    onPress={handleGoToStep2}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryBtnText}>Next: Select Course & Laundry Slot</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              )}

              {/* STEP 2: DEMOGRAPHICS & ASSIGNED SLOT */}
              {regStep === 2 && (
                <View>
                  <Text style={styles.formTitle}>Select Your Course & Batch</Text>
                  <Text style={styles.formSub}>Your designated laundry days are calculated automatically</Text>

                  {/* 1. 🚻 Gender Selection */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Gender / Hostel Type *</Text>
                    <View style={styles.genderRow}>
                      {STUDENT_GENDERS.map((g) => {
                        const isSelected = gender === g.id;
                        return (
                          <TouchableOpacity
                            key={g.id}
                            style={[styles.genderBtn, isSelected && styles.genderBtnActive]}
                            onPress={() => handleGenderChange(g.id)}
                            activeOpacity={0.8}
                          >
                            <Ionicons
                              name={g.icon}
                              size={18}
                              color={isSelected ? '#FFF' : '#64748B'}
                            />
                            <Text style={[styles.genderBtnText, isSelected && styles.genderBtnTextActive]}>
                              {g.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* 2. 📍 Home State / Location Picker Button */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Home State / Region *</Text>
                    <TouchableOpacity
                      style={styles.dropdownBtn}
                      onPress={() => setLocationModalVisible(true)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.dropdownLeft}>
                        <Ionicons name="location-outline" size={18} color="#4338CA" />
                        <Text style={styles.dropdownSelectedText}>{stateLocation}</Text>
                      </View>
                      <Ionicons name="chevron-down" size={18} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  {/* 3. 🎓 Academic Course / Branch Picker Button */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Course & Year of Study *</Text>
                    <TouchableOpacity
                      style={styles.dropdownBtn}
                      onPress={() => setCourseModalVisible(true)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.dropdownLeft}>
                        <Ionicons name="school-outline" size={18} color="#1D4ED8" />
                        <Text style={styles.dropdownSelectedText}>{academicCourse}</Text>
                      </View>
                      <Ionicons name="chevron-down" size={18} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  {/* 🌟 Dynamic Laundry Slot Calculation Card */}
                  <View style={[styles.slotPreviewCard, { backgroundColor: computedSchedule.badgeBg, borderColor: computedSchedule.badgeBorder }]}>
                    <View style={styles.slotPreviewHeader}>
                      <Ionicons name="calendar" size={16} color={computedSchedule.badgeColor} />
                      <Text style={[styles.slotPreviewTitle, { color: computedSchedule.badgeColor }]}>
                        Assigned Slot: {computedSchedule.category}
                      </Text>
                    </View>

                    <View style={styles.slotPreviewBody}>
                      <View style={styles.slotPreviewItem}>
                        <Text style={styles.slotPreviewLabel}>DROP-OFF DAY</Text>
                        <Text style={[styles.slotPreviewVal, { color: computedSchedule.badgeColor }]}>
                          {computedSchedule.dropoffDay}
                        </Text>
                      </View>

                      <Ionicons name="arrow-forward" size={18} color={computedSchedule.badgeColor} />

                      <View style={styles.slotPreviewItem}>
                        <Text style={styles.slotPreviewLabel}>RETURN / PICKUP</Text>
                        <Text style={[styles.slotPreviewVal, { color: computedSchedule.badgeColor }]}>
                          {computedSchedule.pickupDay}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.slotPreviewNotice}>{computedSchedule.description}</Text>
                  </View>

                  {/* Complete Registration Button */}
                  <TouchableOpacity
                    style={[styles.primaryBtn, loading && styles.btnDisabled]}
                    onPress={handleRegister}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <>
                        <Text style={styles.primaryBtnText}>Complete Registration</Text>
                        <Ionicons name="checkmark-circle" size={18} color="#FFF" style={{ marginLeft: 6 }} />
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Back to Step 1 */}
                  <TouchableOpacity
                    style={styles.backStepBtn}
                    onPress={() => setRegStep(1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="arrow-back" size={16} color="#64748B" />
                    <Text style={styles.backStepBtnText}>Back to Room & Account Details</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.switchPrompt}>
                <Text style={styles.switchPromptText}>Already registered? </Text>
                <TouchableOpacity onPress={() => setAuthMode('login')}>
                  <Text style={styles.switchPromptLink}>Sign In here</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Extra bottom spacer for mobile keyboard clearance */}
        <View style={{ height: 180 }} />
      </ScrollView>

      {/* 📍 CLEAN LOCATION SELECTION MODAL */}
      <Modal
        visible={locationModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Tap outside to close */}
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setLocationModalVisible(false)}
          />

          <View style={styles.modalSheet}>
            <View style={styles.modalSheetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="location" size={20} color="#4338CA" />
                <Text style={styles.modalSheetTitle}>Select Home State / Region</Text>
              </View>
              <TouchableOpacity
                onPress={() => setLocationModalVisible(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close-circle" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              {STUDENT_LOCATIONS.map((loc) => {
                const isSelected = stateLocation === loc;
                return (
                  <TouchableOpacity
                    key={loc}
                    style={[styles.modalItemRow, isSelected && styles.modalItemRowActive]}
                    onPress={() => {
                      setStateLocation(loc);
                      setLocationModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextActive]}>
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

      {/* 🎓 CLEAN COURSE SELECTION MODAL */}
      <Modal
        visible={courseModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCourseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Tap outside to close */}
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setCourseModalVisible(false)}
          />

          <View style={styles.modalSheet}>
            <View style={styles.modalSheetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="school" size={20} color="#1D4ED8" />
                <Text style={styles.modalSheetTitle}>Select Course & Year</Text>
              </View>
              <TouchableOpacity
                onPress={() => setCourseModalVisible(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close-circle" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              {ACADEMIC_COURSES.map((crs) => {
                const isSelected = academicCourse === crs;
                return (
                  <TouchableOpacity
                    key={crs}
                    style={[styles.modalItemRow, isSelected && styles.modalItemRowActive]}
                    onPress={() => {
                      setAcademicCourse(crs);
                      setCourseModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextActive]}>
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 40,
    alignItems: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 6,
  },
  brandLogoContainer3D: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#4338CA',
    boxShadow: '0 12px 28px rgba(67, 56, 202, 0.3)',
    elevation: 8,
    marginBottom: 12,
  },
  brandLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
    transform: [{ scale: 1.15 }],
  },
  brandUnivPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 6,
  },
  brandUnivPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#4338CA',
    letterSpacing: 0.8,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#4338CA',
  },
  stepProgressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  stepTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stepTabActive: {
    backgroundColor: '#EEF2FF',
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberBadgeActive: {
    backgroundColor: '#4338CA',
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  stepNumberTextActive: {
    color: '#FFFFFF',
  },
  stepTabText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  stepTabTextActive: {
    color: '#4338CA',
  },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 6,
  },
  form: {
    width: '100%',
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  formSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 13.5,
    color: '#0F172A',
  },
  eyeBtn: {
    padding: 6,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 6,
  },
  genderBtnActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  genderBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  genderBtnTextActive: {
    color: '#FFFFFF',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownSelectedText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  slotPreviewCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  slotPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  slotPreviewTitle: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  slotPreviewBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  slotPreviewItem: {
    alignItems: 'center',
  },
  slotPreviewLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  slotPreviewVal: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  slotPreviewNotice: {
    fontSize: 10.5,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4338CA',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
    boxShadow: '0 4px 12px rgba(67, 56, 202, 0.3)',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  backStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
  },
  backStepBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  switchPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  switchPromptText: {
    fontSize: 12.5,
    color: '#64748B',
  },
  switchPromptLink: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#4338CA',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
    elevation: 12,
  },
  modalSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 6,
  },
  modalSheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  modalScrollView: {
    flexGrow: 1,
  },
  modalScrollContent: {
    paddingVertical: 4,
    paddingBottom: 12,
  },
  modalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 3,
    backgroundColor: '#F8FAFC',
  },
  modalItemRowActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  modalItemTextActive: {
    color: '#4338CA',
    fontWeight: '900',
  },
});

export default AuthScreen;
