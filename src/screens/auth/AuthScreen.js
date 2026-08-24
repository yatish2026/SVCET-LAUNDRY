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

  // Dropdown visibility toggles
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

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

  const handleRegister = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }
    if (!roomNumber.trim()) {
      Alert.alert('Required Field', 'Please enter your hostel room number (e.g. 204).');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Required Field', 'Please enter your mobile phone number for pickup alerts.');
      return;
    }
    if (!email.trim() || !password) {
      Alert.alert('Required Field', 'Please enter a valid email and password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      await signUp({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        gender,
        location: stateLocation,
        academic_year: academicCourse,
        hostel_block: hostelBlock,
        room_number: roomNumber.trim(),
        phone_number: phoneNumber.trim(),
        student_id: studentId.trim(),
      });
      Alert.alert(
        'Account Registered! 🎉',
        `Welcome to DobiX! Your allocated laundry drop-off day is every ${computedSchedule.dropoffDay} with collection on ${computedSchedule.pickupDay}.`
      );
    } catch (err) {
      Alert.alert('Registration Failed', err.message || 'Unable to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* RVS University Emblem Brand Header */}
        <View style={styles.brandHero}>
          <Image
            source={require('../../assets/rvs_logo.png')}
            style={styles.collegeEmblem}
            resizeMode="contain"
          />
          <Text style={styles.brandTitle}>DobiX</Text>
          <Text style={styles.brandSub}>RVS University • Hostel Laundry Portal</Text>
        </View>

        {/* Auth Card */}
        <View style={styles.card}>
          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, authMode === 'login' && styles.tabBtnActive]}
              onPress={() => setAuthMode('login')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  authMode === 'login' && styles.tabBtnTextActive,
                ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, authMode === 'register' && styles.tabBtnActive]}
              onPress={() => setAuthMode('register')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  authMode === 'register' && styles.tabBtnTextActive,
                ]}
              >
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {authMode === 'login' ? (
            /* Login Form */
            <View style={styles.form}>
              <Text style={styles.formTitle}>Welcome to DobiX</Text>
              <Text style={styles.formSub}>Sign in with your RVS account</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="mail-outline" size={18} color={THEME.colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="student@campus.edu or staff@campus.edu"
                    placeholderTextColor={THEME.colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color={THEME.colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor={THEME.colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={THEME.colors.textMuted}
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
                  <ActivityIndicator color="#FFF" />
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
            /* Registration Form */
            <View style={styles.form}>
              <Text style={styles.formTitle}>Student Registration</Text>
              <Text style={styles.formSub}>Set up your profile to receive your laundry schedule</Text>

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

              {/* 2. 📍 State / Location Region Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Home State / Regional Location *</Text>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => {
                    setShowLocationDropdown(!showLocationDropdown);
                    setShowCourseDropdown(false);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.dropdownLeft}>
                    <Ionicons name="location-outline" size={18} color="#4338CA" />
                    <Text style={styles.dropdownSelectedText}>{stateLocation}</Text>
                  </View>
                  <Ionicons
                    name={showLocationDropdown ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#64748B"
                  />
                </TouchableOpacity>

                {showLocationDropdown && (
                  <View style={styles.dropdownMenu}>
                    {STUDENT_LOCATIONS.map((loc) => {
                      const isSelected = stateLocation === loc;
                      return (
                        <TouchableOpacity
                          key={loc}
                          style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                          onPress={() => {
                            setStateLocation(loc);
                            setShowLocationDropdown(false);
                          }}
                        >
                          <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>
                            {loc}
                          </Text>
                          {isSelected && <Ionicons name="checkmark" size={16} color="#4338CA" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* 3. 🎓 Academic Course / Branch Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Course & Year of Study *</Text>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => {
                    setShowCourseDropdown(!showCourseDropdown);
                    setShowLocationDropdown(false);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.dropdownLeft}>
                    <Ionicons name="school-outline" size={18} color="#1D4ED8" />
                    <Text style={styles.dropdownSelectedText}>{academicCourse}</Text>
                  </View>
                  <Ionicons
                    name={showCourseDropdown ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#64748B"
                  />
                </TouchableOpacity>

                {showCourseDropdown && (
                  <View style={styles.dropdownMenu}>
                    {ACADEMIC_COURSES.map((crs) => {
                      const isSelected = academicCourse === crs;
                      return (
                        <TouchableOpacity
                          key={crs}
                          style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                          onPress={() => {
                            setAcademicCourse(crs);
                            setShowCourseDropdown(false);
                          }}
                        >
                          <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>
                            {crs}
                          </Text>
                          {isSelected && <Ionicons name="checkmark" size={16} color="#1D4ED8" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* 🌟 Dynamic Laundry Slot Calculation Card */}
              <View style={[styles.slotPreviewCard, { backgroundColor: computedSchedule.badgeBg, borderColor: computedSchedule.badgeBorder }]}>
                <View style={styles.slotPreviewHeader}>
                  <Ionicons name="sparkles" size={16} color={computedSchedule.badgeColor} />
                  <Text style={[styles.slotPreviewTitle, { color: computedSchedule.badgeColor }]}>
                    Your Assigned Laundry Slot ({computedSchedule.category})
                  </Text>
                </View>
                <View style={styles.slotPreviewBody}>
                  <View style={styles.slotPreviewItem}>
                    <Text style={styles.slotPreviewLabel}>Drop-off Day</Text>
                    <Text style={[styles.slotPreviewVal, { color: computedSchedule.badgeColor }]}>
                      {computedSchedule.dropoffDay}
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color="#94A3B8" />
                  <View style={styles.slotPreviewItem}>
                    <Text style={styles.slotPreviewLabel}>Collection Day</Text>
                    <Text style={[styles.slotPreviewVal, { color: computedSchedule.badgeColor }]}>
                      {computedSchedule.pickupDay}
                    </Text>
                  </View>
                </View>
                <Text style={styles.slotPreviewNotice}>
                  ✨ Automatic schedule assigned based on RVS University official roster!
                </Text>
              </View>

              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={18} color={THEME.colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Rahul Sharma"
                    placeholderTextColor={THEME.colors.textMuted}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>
              </View>

              {/* Student ID / Roll Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Student ID / Roll Number</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="id-card-outline" size={18} color={THEME.colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 21RVS045"
                    placeholderTextColor={THEME.colors.textMuted}
                    value={studentId}
                    onChangeText={setStudentId}
                  />
                </View>
              </View>

              {/* Hostel Block */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Hostel Block *</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="business-outline" size={18} color={THEME.colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Block A (Boys) or Kaveri (Girls)"
                    placeholderTextColor={THEME.colors.textMuted}
                    value={hostelBlock}
                    onChangeText={setHostelBlock}
                  />
                </View>
              </View>

              {/* Room & Mobile */}
              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Room No *</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="home-outline" size={18} color={THEME.colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 204"
                      placeholderTextColor={THEME.colors.textMuted}
                      value={roomNumber}
                      onChangeText={setRoomNumber}
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1.4 }]}>
                  <Text style={styles.inputLabel}>Mobile Phone *</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="call-outline" size={18} color={THEME.colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      placeholder="10-digit mobile number"
                      placeholderTextColor={THEME.colors.textMuted}
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              </View>

              {/* Email Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="mail-outline" size={18} color={THEME.colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="student@campus.edu"
                    placeholderTextColor={THEME.colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password * (min 6 characters)</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color={THEME.colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Create a secure password"
                    placeholderTextColor={THEME.colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={THEME.colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>Complete Registration</Text>
                    <Ionicons name="checkmark-circle" size={18} color="#FFF" style={{ marginLeft: 6 }} />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.switchPrompt}>
                <Text style={styles.switchPromptText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => setAuthMode('login')}>
                  <Text style={styles.switchPromptLink}>Sign in here</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  brandHero: {
    alignItems: 'center',
    marginBottom: 20,
  },
  collegeEmblem: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#0F172A',
  },
  form: {
    width: '100%',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  formSub: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 16,
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
  },
  genderBtnActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  genderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  genderBtnTextActive: {
    color: '#FFF',
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
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
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
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginTop: 6,
    paddingVertical: 4,
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownItemActive: {
    backgroundColor: '#EEF2FF',
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  dropdownItemTextActive: {
    color: '#4338CA',
    fontWeight: '800',
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
});

export default AuthScreen;
