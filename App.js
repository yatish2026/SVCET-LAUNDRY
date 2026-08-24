import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import THEME from './src/constants/theme';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LaundryProvider, useLaundry } from './src/context/LaundryContext';
import Header from './src/components/Header';
import SideMenuDrawer from './src/components/SideMenuDrawer';

// Auth Screen
import AuthScreen from './src/screens/auth/AuthScreen';

// Student Screens
import StudentHomeScreen from './src/screens/student/StudentHomeScreen';
import NewBookingScreen from './src/screens/student/NewBookingScreen';
import OrderDetailsScreen from './src/screens/student/OrderDetailsScreen';
import HistoryScreen from './src/screens/student/HistoryScreen';
import ProfileScreen from './src/screens/student/ProfileScreen';

// Admin / Staff Screens
import AdminDashboardScreen from './src/screens/admin/AdminDashboardScreen';
import ApprovalsScreen from './src/screens/admin/ApprovalsScreen';
import StudentSubmissionsScreen from './src/screens/admin/StudentSubmissionsScreen';
import ReportsExportScreen from './src/screens/admin/ReportsExportScreen';
import RequestDetailScreen from './src/screens/admin/RequestDetailScreen';

const MainApp = () => {
  const { isAuthenticated, isLoading: authLoading, isStudent, isStaff } = useAuth();
  const { bookings } = useLaundry();

  // Navigation states
  const [studentTab, setStudentTab] = useState('home'); // 'home' | 'new_booking' | 'history' | 'profile'
  const [adminTab, setAdminTab] = useState('overview'); // 'overview' | 'approvals' | 'submissions' | 'reports'
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [menuDrawerVisible, setMenuDrawerVisible] = useState(false);

  // Helper to open details modal or screen
  const handleSelectBooking = (bookingId) => {
    setSelectedBookingId(bookingId);
  };

  const handleBookingCreated = (bookingId) => {
    setStudentTab('home');
    if (bookingId) {
      setSelectedBookingId(bookingId);
    }
  };

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Connecting to DobiX...</Text>
      </View>
    );
  }

  // If not authenticated, render AuthScreen
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ExpoStatusBar style="dark" />
        <View style={styles.appContainer}>
          <AuthScreen />
        </View>
      </SafeAreaView>
    );
  }

  const pendingApprovalsCount = bookings.filter(
    (b) => b.status === 'pending_approval' || b.status === 'dropoff_scheduled'
  ).length;

  const activeOrdersCount = bookings.filter(
    (b) => b.status !== 'completed' && b.status !== 'cancelled'
  ).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="dark" />
      <View style={styles.appContainer}>
        {/* Top Header with SVCET Logo & Actions */}
        <Header
          onSelectBooking={handleSelectBooking}
          onOpenMenu={() => setMenuDrawerVisible(true)}
        />

        {/* ☰ Functional Side Menu Drawer */}
        <SideMenuDrawer
          visible={menuDrawerVisible}
          onClose={() => setMenuDrawerVisible(false)}
          onNavigate={(targetTab) => {
            if (isStudent) {
              setStudentTab(targetTab);
            } else {
              setAdminTab(targetTab);
            }
            setSelectedBookingId(null);
          }}
          onOpenSchedule={() => {
            if (isStudent) setStudentTab('home');
          }}
          onOpenGuidelines={() => {
            if (isStudent) setStudentTab('home');
          }}
        />

        {/* Main Screen Body */}
        <View style={styles.screenBody}>
          {/* Detail Overlay / View if an order is selected */}
          {selectedBookingId ? (
            isStudent ? (
              <OrderDetailsScreen
                bookingId={selectedBookingId}
                onBack={() => setSelectedBookingId(null)}
              />
            ) : (
              <RequestDetailScreen
                bookingId={selectedBookingId}
                onBack={() => setSelectedBookingId(null)}
              />
            )
          ) : isStudent ? (
            /* Student View Tabs */
            <>
              {studentTab === 'home' && (
                <StudentHomeScreen
                  onNavigateToNewBooking={() => setStudentTab('new_booking')}
                  onSelectBooking={handleSelectBooking}
                  onNavigateToHistory={() => setStudentTab('history')}
                  onNavigateToProfile={() => setStudentTab('profile')}
                />
              )}
              {studentTab === 'new_booking' && (
                <NewBookingScreen
                  onBack={() => setStudentTab('home')}
                  onBookingCreated={handleBookingCreated}
                />
              )}
              {studentTab === 'history' && (
                <HistoryScreen onSelectBooking={handleSelectBooking} />
              )}
              {studentTab === 'profile' && <ProfileScreen />}
            </>
          ) : (
            /* Staff View Tabs */
            <>
              {adminTab === 'overview' && (
                <AdminDashboardScreen
                  onNavigateToApprovals={() => setAdminTab('approvals')}
                  onNavigateToSubmissions={() => setAdminTab('submissions')}
                  onNavigateToReports={() => setAdminTab('reports')}
                />
              )}
              {adminTab === 'approvals' && (
                <ApprovalsScreen onSelectBooking={handleSelectBooking} />
              )}
              {adminTab === 'submissions' && (
                <StudentSubmissionsScreen
                  onSelectBooking={handleSelectBooking}
                />
              )}
              {adminTab === 'reports' && (
                <ReportsExportScreen />
              )}
            </>
          )}
        </View>

        {/* Bottom Tab Bar (Visible when not in detail view) */}
        {!selectedBookingId && (
          <View style={styles.bottomTabBar}>
            {isStudent ? (
              /* Student Navigation Tabs */
              <>
                <TouchableOpacity
                  style={styles.tabItem}
                  onPress={() => setStudentTab('home')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={studentTab === 'home' ? 'home' : 'home-outline'}
                    size={22}
                    color={studentTab === 'home' ? '#1D4ED8' : THEME.colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      studentTab === 'home' && styles.tabLabelActive,
                    ]}
                  >
                    Home
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.tabItem}
                  onPress={() => setStudentTab('new_booking')}
                  activeOpacity={0.7}
                >
                  <View style={styles.newBookingIconWrap}>
                    <Ionicons name="add" size={24} color="#FFF" />
                  </View>
                  <Text
                    style={[
                      styles.tabLabel,
                      studentTab === 'new_booking' && styles.tabLabelActive,
                    ]}
                  >
                    Book Slot
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.tabItem}
                  onPress={() => setStudentTab('history')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={studentTab === 'history' ? 'time' : 'time-outline'}
                    size={22}
                    color={studentTab === 'history' ? '#1D4ED8' : THEME.colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      studentTab === 'history' && styles.tabLabelActive,
                    ]}
                  >
                    History
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.tabItem}
                  onPress={() => setStudentTab('profile')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={studentTab === 'profile' ? 'person' : 'person-outline'}
                    size={22}
                    color={studentTab === 'profile' ? '#1D4ED8' : THEME.colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      studentTab === 'profile' && styles.tabLabelActive,
                    ]}
                  >
                    Profile
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              /* Staff Navigation Tabs */
              <>
                <TouchableOpacity
                  style={styles.tabItem}
                  onPress={() => setAdminTab('overview')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={adminTab === 'overview' ? 'stats-chart' : 'stats-chart-outline'}
                    size={22}
                    color={adminTab === 'overview' ? '#1E40AF' : THEME.colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      adminTab === 'overview' && styles.tabLabelActive,
                    ]}
                  >
                    Overview
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.tabItem}
                  onPress={() => setAdminTab('approvals')}
                  activeOpacity={0.7}
                >
                  <View>
                    <Ionicons
                      name={adminTab === 'approvals' ? 'checkmark-done-circle' : 'checkmark-done-circle-outline'}
                      size={22}
                      color={adminTab === 'approvals' ? '#7C3AED' : THEME.colors.textMuted}
                    />
                    {pendingApprovalsCount > 0 && (
                      <View style={styles.tabBadge}>
                        <Text style={styles.tabBadgeText}>{pendingApprovalsCount}</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.tabLabel,
                      adminTab === 'approvals' && { color: '#7C3AED', fontWeight: '800' },
                    ]}
                  >
                    Approvals
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.tabItem}
                  onPress={() => setAdminTab('submissions')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={adminTab === 'submissions' ? 'list' : 'list-outline'}
                    size={22}
                    color={adminTab === 'submissions' ? '#1E40AF' : THEME.colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      adminTab === 'submissions' && styles.tabLabelActive,
                    ]}
                  >
                    Submissions
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.tabItem}
                  onPress={() => setAdminTab('reports')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={adminTab === 'reports' ? 'download' : 'download-outline'}
                    size={22}
                    color={adminTab === 'reports' ? '#065F46' : THEME.colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      adminTab === 'reports' && { color: '#065F46', fontWeight: '800' },
                    ]}
                  >
                    Reports (.CSV)
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <LaundryProvider>
        <MainApp />
      </LaundryProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? '#0F172A' : '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: '#CBD5E1',
          height: '100%',
        }
      : {}),
  },
  screenBody: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  bottomTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    ...THEME.shadows.md,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 12,
    flex: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#1D4ED8',
    fontWeight: '800',
  },
  newBookingIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E40AF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#EF4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
});
