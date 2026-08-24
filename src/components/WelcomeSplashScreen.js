import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export const WelcomeSplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance Animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2200,
        useNativeDriver: false,
      }),
    ]).start();

    // Subtle 3D floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Auto-proceed after 2.4s
    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2400);

    return () => clearTimeout(timer);
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* 3D Radiant Background Auras */}
      <View style={styles.glowAuraTop} />
      <View style={styles.glowAuraBottom} />

      <Animated.View
        style={[
          styles.cardWrapper,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: floatAnim }],
          },
        ]}
      >
        {/* 🌟 3D Glowing Glass Logo Container */}
        <View style={styles.logoCard3D}>
          <Image
            source={require('../../assets/rvs_logo.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>

        {/* University Pill Badge */}
        <View style={styles.univBadge}>
          <Ionicons name="school" size={13} color="#4338CA" />
          <Text style={styles.univBadgeText}>RVS UNIVERSITY</Text>
        </View>

        {/* 3D App Name */}
        <Text style={styles.appName}>DobiX</Text>
        <Text style={styles.appSub}>Smart Hostel Laundry Portal</Text>

        {/* 🌟 3D Feature Badges */}
        <View style={styles.featuresRow}>
          <View style={styles.featurePill}>
            <Ionicons name="flash" size={14} color="#2563EB" />
            <Text style={styles.featurePillText}>24/7 Smart Slot Booking</Text>
          </View>
          <View style={styles.featurePill}>
            <Ionicons name="qr-code" size={14} color="#7C3AED" />
            <Text style={styles.featurePillText}>Instant Digital Token</Text>
          </View>
        </View>

        {/* Animated Loading Bar */}
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.loadingStatusText}>Welcome to RVS University DobiX Portal...</Text>

        {/* Quick Skip Button */}
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={onFinish}
          activeOpacity={0.8}
        >
          <Text style={styles.skipBtnText}>Continue to Portal</Text>
          <Ionicons name="arrow-forward" size={14} color="#4338CA" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  glowAuraTop: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(67, 56, 202, 0.35)',
    filter: 'blur(50px)',
  },
  glowAuraBottom: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(37, 99, 235, 0.28)',
    filter: 'blur(60px)',
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 32,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35), 0 4px 16px rgba(67, 56, 202, 0.2)',
    elevation: 16,
  },
  logoCard3D: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    overflow: 'hidden',
    borderWidth: 3.5,
    borderColor: '#4338CA',
    boxShadow: '0 16px 36px rgba(67, 56, 202, 0.35)',
    elevation: 12,
    marginBottom: 16,
  },
  logoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
    transform: [{ scale: 1.15 }],
  },
  univBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 8,
  },
  univBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4338CA',
    letterSpacing: 0.8,
  },
  appName: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  appSub: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 3,
    textAlign: 'center',
  },
  featuresRow: {
    width: '100%',
    marginVertical: 18,
    gap: 8,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  featurePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4338CA',
    borderRadius: 3,
  },
  loadingStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 16,
    textAlign: 'center',
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  skipBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#4338CA',
  },
});

export default WelcomeSplashScreen;
