import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  BackHandler,
  ToastAndroid,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import THEME from './src/constants/theme';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LaundryProvider, useLaundry } from './src/context/LaundryContext';
import Header from './src/components/Header';
import SideMenuDrawer from './src/components/SideMenuDrawer';
import WelcomeSplashScreen from './src/components/WelcomeSplashScreen';
import StudentAnalyticsModal from './src/components/StudentAnalyticsModal';
import MonthlyAnalyticsReportModal from './src/components/MonthlyAnalyticsReportModal';

import { useFonts, Caveat_700Bold, Caveat_600SemiBold } from '@expo-google-fonts/caveat';

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

  const [fontsLoaded] = useFonts({
    Caveat_700Bold,
    Caveat_600SemiBold,
  });

  // Inject web font for instant high-quality handwriting rendering in browser preview
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const linkId = 'google-font-caveat';
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap';
        document.head.appendChild(link);
      }
    }
  }, []);

  // Navigation states
  const [showSplash, setShowSplash] = useState(true);
  const [studentTab, setStudentTab] = useState('home'); // 'home' | 'new_booking' | 'history' | 'profile'
  const [adminTab, setAdminTab] = useState('overview'); // 'overview' | 'approvals' | 'submissions' | 'reports'
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [menuDrawerVisible, setMenuDrawerVisible] = useState(false);
  const [studentAnalyticsVisible, setStudentAnalyticsVisible] = useState(false);
  const [monthlyReportVisible, setMonthlyReportVisible] = useState(false);

  // 📱 Android Hardware Back Button Handling
  useEffect(() => {
    const handleHardwareBackPress = () => {
      // 1. If side menu drawer is open, close it
      if (menuDrawerVisible) {
        setMenuDrawerVisible(false);
        return true;
      }

      // 1b. If student analytics modal is open, close it
      if (studentAnalyticsVisible) {
        setStudentAnalyticsVisible(false);
        return true;
      }

      // 1c. If monthly report modal is open, close it
      if (monthlyReportVisible) {
        setMonthlyReportVisible(false);
        return true;
      }

      // 2. If an order detail is currently open, go back to list
      if (selectedBookingId) {
        setSelectedBookingId(null);
        return true;
      }

      // 3. If in a student sub-tab (not home), go back to home tab
      if (isStudent && studentTab !== 'home') {
        setStudentTab('home');
        return true;
      }

      // 4. If in an admin sub-tab (not overview), go back to overview tab
      if (isStaff && adminTab !== 'overview') {
        setAdminTab('overview');
        return true;
      }

      // 5. If already on root Home screen, allow natural app minimization/exit
      return false;
    };

    const backSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleHardwareBackPress
    );

    return () => backSubscription.remove();
  }, [menuDrawerVisible, studentAnalyticsVisible, monthlyReportVisible, selectedBookingId, studentTab, adminTab, isStudent, isStaff]);

  // Helper to open details modal or screen
  const handleSelectBooking = (bookingOrId) => {
    const id =
      bookingOrId && typeof bookingOrId === 'object'
        ? bookingOrId.id || bookingOrId.booking_id || bookingOrId.pickup_token
        : bookingOrId;
    setSelectedBookingId(id);
  };

  const handleBookingCreated = (bookingId) => {
    setStudentTab('home');
    if (bookingId) {
      setSelectedBookingId(bookingId);
    }
  };

  // 🌟 Render 3D Welcome Splash Screen on Initial App Launch
  if (showSplash) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ExpoStatusBar style="light" />
        <View style={styles.appContainer}>
          <WelcomeSplashScreen onFinish={() => setShowSplash(false)} />
        </View>
      </SafeAreaView>
    );
  }

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Connecting to VASTRA...</Text>
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
          onOpenAnalytics={() => {
            setStudentAnalyticsVisible(true);
          }}
          onOpenMonthlyReport={() => {
            setMonthlyReportVisible(true);
          }}
        />

        {/* 📊 Student Analytics & Wash Trends Modal */}
        <StudentAnalyticsModal
          visible={studentAnalyticsVisible}
          onClose={() => setStudentAnalyticsVisible(false)}
          onSelectBooking={handleSelectBooking}
        />

        {/* 📄 Monthly Laundry Performance Report Modal */}
        <MonthlyAnalyticsReportModal
          visible={monthlyReportVisible}
          onClose={() => setMonthlyReportVisible(false)}
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
              {studentTab === 'profile' && (
                <ProfileScreen onOpenAnalytics={() => setStudentAnalyticsVisible(true)} />
              )}
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

        {/* 🌟 ULTRA-PREMIUM GLASS CAPSULE FLOATING DOCK */}
        {!selectedBookingId && (
          <View style={styles.floatingDockContainer} pointerEvents="box-none">
            <View style={styles.glassCapsuleDock}>
              {isStudent ? (
                /* 🎓 Student Navigation */
                <>
                  {/* Home Tab */}
                  <TouchableOpacity
                    style={[
                      styles.dockItem,
                      studentTab === 'home' && styles.dockItemActive,
                    ]}
                    onPress={() => setStudentTab('home')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={studentTab === 'home' ? 'home' : 'home-outline'}
                      size={22}
                      color={studentTab === 'home' ? '#0F4C5C' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.dockLabel,
                        studentTab === 'home' && styles.dockLabelActive,
                      ]}
                    >
                      Home
                    </Text>
                  </TouchableOpacity>

                  {/* Book Tab */}
                  <TouchableOpacity
                    style={[
                      styles.dockItem,
                      studentTab === 'new_booking' && styles.dockItemActive,
                    ]}
                    onPress={() => setStudentTab('new_booking')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={studentTab === 'new_booking' ? 'clipboard' : 'clipboard-outline'}
                      size={22}
                      color={studentTab === 'new_booking' ? '#0F4C5C' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.dockLabel,
                        studentTab === 'new_booking' && styles.dockLabelActive,
                      ]}
                    >
                      Book
                    </Text>
                  </TouchableOpacity>

                  {/* History Tab */}
                  <TouchableOpacity
                    style={[
                      styles.dockItem,
                      studentTab === 'history' && styles.dockItemActive,
                    ]}
                    onPress={() => setStudentTab('history')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={studentTab === 'history' ? 'time' : 'time-outline'}
                      size={22}
                      color={studentTab === 'history' ? '#0F4C5C' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.dockLabel,
                        studentTab === 'history' && styles.dockLabelActive,
                      ]}
                    >
                      History
                    </Text>
                  </TouchableOpacity>

                  {/* Profile Tab */}
                  <TouchableOpacity
                    style={[
                      styles.dockItem,
                      studentTab === 'profile' && styles.dockItemActive,
                    ]}
                    onPress={() => setStudentTab('profile')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={studentTab === 'profile' ? 'person' : 'person-outline'}
                      size={22}
                      color={studentTab === 'profile' ? '#0F4C5C' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.dockLabel,
                        studentTab === 'profile' && styles.dockLabelActive,
                      ]}
                    >
                      Profile
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                /* 🛡️ Staff Navigation */
                <>
                  <TouchableOpacity
                    style={[
                      styles.dockItem,
                      adminTab === 'overview' && styles.dockItemActive,
                    ]}
                    onPress={() => setAdminTab('overview')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={adminTab === 'overview' ? 'stats-chart' : 'stats-chart-outline'}
                      size={21}
                      color={adminTab === 'overview' ? '#0F4C5C' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.dockLabel,
                        adminTab === 'overview' && styles.dockLabelActive,
                      ]}
                    >
                      Overview
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.dockItem,
                      adminTab === 'approvals' && styles.dockItemActive,
                    ]}
                    onPress={() => setAdminTab('approvals')}
                    activeOpacity={0.7}
                  >
                    <View style={{ position: 'relative' }}>
                      <Ionicons
                        name={adminTab === 'approvals' ? 'checkmark-done-circle' : 'checkmark-done-circle-outline'}
                        size={21}
                        color={adminTab === 'approvals' ? '#0F4C5C' : '#64748B'}
                      />
                      {pendingApprovalsCount > 0 && (
                        <View style={styles.dockBadge}>
                          <Text style={styles.dockBadgeText}>{pendingApprovalsCount}</Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.dockLabel,
                        adminTab === 'approvals' && styles.dockLabelActive,
                      ]}
                    >
                      Approvals
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.dockItem,
                      adminTab === 'submissions' && styles.dockItemActive,
                    ]}
                    onPress={() => setAdminTab('submissions')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={adminTab === 'submissions' ? 'list' : 'list-outline'}
                      size={21}
                      color={adminTab === 'submissions' ? '#0F4C5C' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.dockLabel,
                        adminTab === 'submissions' && styles.dockLabelActive,
                      ]}
                    >
                      Orders
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.dockItem,
                      adminTab === 'reports' && styles.dockItemActive,
                    ]}
                    onPress={() => setAdminTab('reports')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={adminTab === 'reports' ? 'document-text' : 'document-text-outline'}
                      size={21}
                      color={adminTab === 'reports' ? '#0F4C5C' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.dockLabel,
                        adminTab === 'reports' && styles.dockLabelActive,
                      ]}
                    >
                      Reports
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
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
    backgroundColor: Platform.OS === 'web' ? '#0F172A' : '#F1F5F9',
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
    position: 'relative',
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
    paddingBottom: 85, // Clearance for the floating glass capsule dock
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

  // 🌟 GLASS CAPSULE FLOATING DOCK STYLES
  floatingDockContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 22 : 12,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    zIndex: 999,
  },
  glassCapsuleDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(20px)',
    borderRadius: 36,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.15), 0 2px 10px rgba(37, 99, 235, 0.08)',
    elevation: 12,
  },
  dockItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 22,
    marginHorizontal: 2,
  },
  dockItemActive: {
    backgroundColor: '#E6F4F7',
    borderWidth: 1,
    borderColor: '#BEE3EA',
  },
  dockLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  dockLabelActive: {
    color: '#0F4C5C',
    fontWeight: '800',
  },
  heroOrbSmall: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  heroOrbSmallActive: {
    backgroundColor: '#1D4ED8',
  },
  dockBadge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: '#EF4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  dockBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
});
