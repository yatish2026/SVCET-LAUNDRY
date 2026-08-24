import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useLaundry } from '../context/LaundryContext';

export const SideMenuDrawer = ({
  visible,
  onClose,
  onNavigate,
  onOpenSchedule,
  onOpenGuidelines,
}) => {
  const { profile, role, signOut, isStaff, setRole } = useAuth();
  const { bookings } = useLaundry();

  if (!visible) return null;

  const studentName = profile?.full_name || profile?.email?.split('@')[0] || 'Student';
  const academicYear = profile?.academic_year || '1st Year';
  const hostelBlock = profile?.hostel_block || 'Hostel Block A';
  const roomNumber = profile?.room_number || 'Room 101';
  const studentId = profile?.student_id || 'SVCET-01';

  const pendingApprovalsCount = bookings.filter(
    (b) => b.status === 'pending_approval' || b.status === 'dropoff_scheduled'
  ).length;

  const handleSignOut = () => {
    onClose();
    if (Platform.OS === 'web') {
      const confirm = window.confirm('Are you sure you want to sign out?');
      if (confirm) signOut();
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]);
    }
  };

  const handleItemPress = (action) => {
    onClose();
    if (action) action();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop Tap to Close */}
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          activeOpacity={1}
        />

        {/* Drawer Content Panel (Slides from Left) */}
        <View style={styles.drawerPanel}>
          {/* Top Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.profileRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {studentName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {studentName}
                </Text>
                <Text style={styles.profileSub}>
                  {isStaff ? 'Staff / Admin' : `${academicYear} • ID: ${studentId}`}
                </Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>
                    {isStaff ? '👑 Staff Mode' : `🏠 ${hostelBlock} - ${roomNumber}`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Navigation Links Scroll */}
          <ScrollView
            style={styles.menuScroll}
            contentContainerStyle={styles.menuContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.menuGroupHeader}>MAIN NAVIGATION</Text>

            {isStaff ? (
              /* Staff Menu Options */
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleItemPress(() => onNavigate('overview'))}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="grid-outline" size={18} color="#1D4ED8" />
                  </View>
                  <Text style={styles.menuItemText}>Dashboard Overview</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleItemPress(() => onNavigate('approvals'))}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: '#FAF5FF' }]}>
                    <Ionicons name="checkmark-done-circle-outline" size={18} color="#7C3AED" />
                  </View>
                  <Text style={styles.menuItemText}>Pending Approvals</Text>
                  {pendingApprovalsCount > 0 && (
                    <View style={styles.counterBadge}>
                      <Text style={styles.counterBadgeText}>{pendingApprovalsCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleItemPress(() => onNavigate('submissions'))}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: '#F0F9FF' }]}>
                    <Ionicons name="list-outline" size={18} color="#0284C7" />
                  </View>
                  <Text style={styles.menuItemText}>Student Submissions & Checklist</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleItemPress(() => onNavigate('reports'))}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="download-outline" size={18} color="#16A34A" />
                  </View>
                  <Text style={styles.menuItemText}>Export Reports (.CSV)</Text>
                </TouchableOpacity>
              </>
            ) : (
              /* Student Menu Options */
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleItemPress(() => onNavigate('home'))}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="home-outline" size={18} color="#1D4ED8" />
                  </View>
                  <Text style={styles.menuItemText}>Student Home</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleItemPress(() => onNavigate('new_booking'))}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: '#FAF5FF' }]}>
                    <Ionicons name="add-circle-outline" size={18} color="#7C3AED" />
                  </View>
                  <Text style={styles.menuItemText}>Book New Laundry Slot</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleItemPress(() => onNavigate('history'))}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="time-outline" size={18} color="#16A34A" />
                  </View>
                  <Text style={styles.menuItemText}>Wash History & Past Orders</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleItemPress(() => onNavigate('profile'))}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: '#FFF7ED' }]}>
                    <Ionicons name="person-outline" size={18} color="#EA580C" />
                  </View>
                  <Text style={styles.menuItemText}>My Profile & Hostel Info</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleItemPress(() => onNavigate('profile'))}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color="#DC2626" />
                  </View>
                  <Text style={[styles.menuItemText, { color: '#DC2626', fontWeight: '700' }]}>
                    Raise Ticket & Complaint Desk
                  </Text>
                </TouchableOpacity>
              </>
            )}

          </ScrollView>

          {/* Footer Info */}
          <View style={styles.drawerFooter}>
            <Image
              source={require('../../assets/rvs_logo.png')}
              style={styles.footerLogo}
              resizeMode="contain"
            />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.footerAppTitle}>VASTRA</Text>
              <Text style={styles.footerAppSub}>RVS University • Smart Laundry Portal</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  drawerPanel: {
    width: '82%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    height: '100%',
    zIndex: 10,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    ...THEME.shadows.xl,
  },
  profileHeader: {
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 18,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#4338CA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  profileSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  roleBadge: {
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4338CA',
  },
  closeBtn: {
    padding: 6,
  },
  menuScroll: {
    flex: 1,
  },
  menuContent: {
    padding: 16,
    paddingBottom: 24,
  },
  menuGroupHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 8,
    paddingLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    marginBottom: 2,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  counterBadge: {
    backgroundColor: '#EF4444',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  counterBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  drawerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerLogo: {
    width: 30,
    height: 30,
  },
  footerAppTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  footerAppSub: {
    fontSize: 9,
    color: '#64748B',
  },
});

export default SideMenuDrawer;
