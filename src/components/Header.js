import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useLaundry } from '../context/LaundryContext';
import NotificationModal from './NotificationModal';

export const Header = ({ onSelectBooking, onOpenMenu }) => {
  const { role, profile, signOut, isStaff } = useAuth();
  const { notifications, bookings } = useLaundry();
  const [notifVisible, setNotifVisible] = useState(false);

  const studentName = profile?.full_name || profile?.email?.split('@')[0] || '';
  const studentPhone = profile?.phone_number || '';
  const myBookingIds = bookings
    .filter(
      (b) =>
        (studentPhone && b.phone_number === studentPhone) ||
        (studentName && b.student_name && b.student_name.toLowerCase() === studentName.toLowerCase()) ||
        b.student_id === profile?.student_id
    )
    .map((b) => b.id);

  const myNotifs = notifications.filter((n) => {
    if (isStaff) {
      return n.recipient_role === 'staff' || n.recipient_role === 'all';
    }
    if (n.booking_id) {
      return myBookingIds.includes(n.booking_id);
    }
    return n.recipient_role === 'student' && (!n.target_user_phone || n.target_user_phone === studentPhone);
  });

  const unreadCount = myNotifs.filter((n) => !n.is_read).length;

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('Are you sure you want to sign out?');
      if (confirmLogout) {
        signOut();
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out from your account?',
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
    <>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          {/* Left Menu / Brand Icon */}
          <TouchableOpacity
            style={styles.sideBtn}
            onPress={onOpenMenu || (() => {})}
            activeOpacity={0.7}
          >
            <Ionicons name="menu-outline" size={26} color="#0F172A" />
          </TouchableOpacity>

          {/* Center College Emblem Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/college_logo.png')}
              style={styles.collegeLogo}
              resizeMode="contain"
            />
          </View>

          {/* Right Actions: Notifications & Logout */}
          <View style={styles.rightActions}>
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => setNotifVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={22} color="#0F172A" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={22} color="#475569" />
            </TouchableOpacity>
          </View>
        </View>

        {/* If Staff / Admin, show a subtle role chip */}
        {isStaff && (
          <View style={styles.staffPill}>
            <Ionicons name="shield-checkmark" size={12} color="#065F46" />
            <Text style={styles.staffPillText}>Laundry Staff & Admin Portal</Text>
          </View>
        )}
      </View>

      <NotificationModal
        visible={notifVisible}
        onClose={() => setNotifVisible(false)}
        onSelectBooking={onSelectBooking}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 4 : 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
  },
  sideBtn: {
    width: 38,
    height: 38,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collegeLogo: {
    width: 140,
    height: 48,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 76,
    justifyContent: 'flex-end',
  },
  bellBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
  },
  logoutBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginTop: 4,
    gap: 4,
  },
  staffPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
});

export default Header;
