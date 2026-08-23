import React, { useState } from 'react';
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
import { ACADEMIC_YEARS, getYearConfig } from '../../constants/schedule';
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
  const [academicYear, setAcademicYear] = useState('1st Year');
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [hostelBlock, setHostelBlock] = useState(HOSTEL_BLOCKS[0]);
  const [roomNumber, setRoomNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const yearCfg = getYearConfig(academicYear);

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
      Alert.alert('Required Field', 'Please enter your hostel room number (e.g. B-304).');
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
        academic_year: academicYear,
        hostel_block: hostelBlock,
        room_number: roomNumber.trim(),
        phone_number: phoneNumber.trim(),
        student_id: studentId.trim(),
      });
      Alert.alert(
        'Account Registered! 🎉',
        `Welcome to CampusWash! Your allocated laundry drop-off day is every ${yearCfg.dropoffDay} with pickup on ${yearCfg.pickupDay}.`
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* College Emblem Brand Header */}
        <View style={styles.brandHero}>
          <Image
            source={require('../../assets/college_logo.png')}
            style={styles.collegeEmblem}
            resizeMode="contain"
          />
          <Text style={styles.brandSub}>Hostel Laundry Portal</Text>
        </View>

        {/* Card Container */}
        <View style={styles.card}>
          {/* Tab Switcher */}
          <View style={styles.tabBar}>
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
              <Text style={styles.formTitle}>Welcome to CampusWash</Text>
              <Text style={styles.formSub}>Sign in with your registered account</Text>

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

              {/* 🎓 Academic Year Dropdown Picker */}
              <View style={[styles.inputGroup, { marginTop: 10 }]}>
                <Text style={styles.inputLabel}>Year of Study *</Text>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => setShowYearDropdown(!showYearDropdown)}
                  activeOpacity={0.8}
                >
                  <View style={styles.dropdownLeft}>
                    <Ionicons name="school-outline" size={18} color="#1D4ED8" />
                    <Text style={styles.dropdownSelectedText}>{academicYear}</Text>
                  </View>
                  <Ionicons
                    name={showYearDropdown ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#64748B"
                  />
                </TouchableOpacity>

                {showYearDropdown && (
                  <View style={styles.dropdownMenu}>
                    {ACADEMIC_YEARS.map((yr) => {
                      const isSelected = academicYear === yr;
                      return (
                        <TouchableOpacity
                          key={yr}
                          style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                          onPress={() => {
                            setAcademicYear(yr);
                            setShowYearDropdown(false);
                          }}
                        >
                          <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>
                            {yr}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark" size={16} color="#1D4ED8" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

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

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Student ID / Roll No</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="id-card-outline" size={18} color={THEME.colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 2024CS108"
                    placeholderTextColor={THEME.colors.textMuted}
                    value={studentId}
                    onChangeText={setStudentId}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Hostel Block *</Text>
                <View style={styles.blocksPicker}>
                  {HOSTEL_BLOCKS.map((blk) => {
                    const isSelected = hostelBlock === blk;
                    return (
                      <TouchableOpacity
                        key={blk}
                        style={[styles.blockChip, isSelected && styles.blockChipActive]}
                        onPress={() => setHostelBlock(blk)}
                      >
                        <Text
                          style={[
                            styles.blockChipText,
                            isSelected && styles.blockChipTextActive,
                          ]}
                        >
                          {blk.split(' ')[0]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Room No *</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="home-outline" size={18} color={THEME.colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. B-304"
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
                      placeholder="+91 98765 43210"
                      placeholderTextColor={THEME.colors.textMuted}
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              </View>

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
                    <Text style={styles.primaryBtnText}>Register Account</Text>
                    <Ionicons name="checkmark-circle" size={18} color="#FFF" style={{ marginLeft: 6 }} />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.switchPrompt}>
                <Text style={styles.switchPromptText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => setAuthMode('login')}>
                  <Text style={styles.switchPromptLink}>Sign In</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  brandHero: {
    alignItems: 'center',
    marginVertical: 14,
  },
  collegeEmblem: {
    width: 170,
    height: 60,
    marginBottom: 4,
  },
  brandSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...THEME.shadows.sm,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    ...THEME.shadows.sm,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    fontWeight: '800',
    color: '#1E40AF',
  },
  form: {
    marginTop: 2,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  formSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 11,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownSelectedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
    overflow: 'hidden',
    ...THEME.shadows.md,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemActive: {
    backgroundColor: '#EFF6FF',
  },
  dropdownItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  dropdownItemTextActive: {
    color: '#1D4ED8',
    fontWeight: '800',
  },
  dropdownItemSub: {
    fontSize: 10,
    color: '#64748B',
  },
  yearNoticeText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 14,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 44,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  blocksPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  blockChip: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  blockChipActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  blockChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  blockChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 10,
    ...THEME.shadows.sm,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  switchPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  switchPromptText: {
    fontSize: 11,
    color: '#64748B',
  },
  switchPromptLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
  },
});

export default AuthScreen;
