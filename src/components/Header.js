import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLaundry } from '../context/LaundryContext';
import NotificationModal from './NotificationModal';

export const Header = ({ onSelectBooking, onOpenMenu }) => {
  const { user, profile, signOut } = useAuth();
  const { notifications } = useLaundry();
  const [notifVisible, setNotifVisible] = useState(false);

  const isStaff = profile?.role === 'staff' || profile?.role === 'admin';

  // Count unread notifications
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        signOut();
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out from VASTRA?',
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
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="menu" size={26} color="#0F4C5C" />
          </TouchableOpacity>

          {/* Center VASTRA App Name */}
          <View style={styles.logoContainer}>
            <Text style={styles.headerAppName}>VASTRA</Text>
          </View>

          {/* Right Actions: Notifications & Quick Logout */}
          <View style={styles.rightActions}>
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => setNotifVisible(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="notifications-outline" size={24} color="#0F4C5C" />
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
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="log-out-outline" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* If Staff / Admin, show a subtle role chip */}
        {isStaff && (
          <View style={styles.staffPill}>
            <Ionicons name="shield-checkmark" size={12} color="#0F4C5C" />
            <Text style={styles.staffPillText}>Laundry Staff & Admin Portal</Text>
          </View>
        )}
      </View>

      {/* Notifications Drawer */}
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
    backgroundColor: '#F6FAF9',
    paddingTop: Platform.OS === 'ios' ? 4 : 8,
    paddingBottom: 6,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
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
  headerAppName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F4C5C',
    letterSpacing: 2.2,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-medium',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 64,
    justifyContent: 'flex-end',
  },
  bellBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 1,
    right: 1,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: '#F6FAF9',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
  },
  logoutBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#E6F4F7',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BEE3EA',
    marginTop: 2,
    gap: 4,
  },
  staffPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F4C5C',
  },
});

export default Header;
