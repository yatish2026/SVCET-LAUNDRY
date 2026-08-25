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
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
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
        {/* 🌟 Brand Header: Logo + Big RVS University Beside It (matching SignIn Page) */}
        <View style={styles.topLogoUnivRow}>
          {/* Left: 3D Logo Emblem */}
          <View style={styles.brandLogoContainer3D}>
            <Image
              source={require('../../assets/rvs_logo.png')}
              style={styles.brandLogo}
              resizeMode="cover"
            />
          </View>

          {/* Right: RVS UNIVERSITY Title */}
          <View style={styles.univTextContainer}>
            <View style={styles.rvsLettersRow}>
              <Text style={styles.rvsLetterR}>R</Text>
              <Text style={styles.rvsLetterV}>V</Text>
              <Text style={styles.rvsLetterS}>S</Text>
            </View>
            <Text style={styles.rvsUnivWord}>UNIVERSITY</Text>
            <Text style={styles.univTagline}>SMART CAMPUS PORTAL</Text>
          </View>
        </View>

        {/* Down: 3D VASTRA Brand Name & Gold Sparkle Badge */}
        <View style={styles.vastraSection}>
          <View style={styles.vastraLettersRow}>
            <Text style={styles.vastraMainTitle}>VASTRA</Text>
            <View style={styles.vastraSparkleBadge}>
              <Text style={styles.vastraSparkleText}>✨ Smart Portal</Text>
            </View>
          </View>
          <Text style={styles.brandSubtitle}>🧺 Smart Hostel Laundry Management ✨</Text>
        </View>

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
        <Text style={styles.loadingStatusText}>Welcome to RVS University VASTRA Portal...</Text>

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
    backgroundColor: '#0B1120', // Deep Obsidian Space Slate
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  glowAuraTop: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(67, 56, 202, 0.45)',
    filter: 'blur(60px)',
  },
  glowAuraBottom: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(37, 99, 235, 0.35)',
    filter: 'blur(70px)',
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(25px)',
    borderRadius: 36,
    paddingVertical: 28,
    paddingHorizontal: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.4), 0 4px 20px rgba(67, 56, 202, 0.25)',
    elevation: 20,
  },
  topLogoUnivRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 6,
  },
  brandLogoContainer3D: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#FFFFFF',
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#4338CA',
    boxShadow: '0 12px 28px rgba(67, 56, 202, 0.35)',
    elevation: 10,
    overflow: 'hidden',
  },
  brandLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 39,
    transform: [{ scale: 1.12 }],
  },
  univTextContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  rvsLettersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rvsLetterR: {
    fontSize: 40,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  rvsLetterV: {
    fontSize: 40,
    fontWeight: '900',
    color: '#7C3AED',
    letterSpacing: 0.5,
  },
  rvsLetterS: {
    fontSize: 40,
    fontWeight: '900',
    color: '#16A34A',
    letterSpacing: 0.5,
  },
  rvsUnivWord: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2563EB',
    letterSpacing: 2.2,
    marginTop: -6,
  },
  univTagline: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  vastraSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  vastraLettersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 4,
  },
  vastraMainTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 2,
  },
  vastraSparkleBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginLeft: 6,
  },
  vastraSparkleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  featuresRow: {
    width: '100%',
    marginVertical: 14,
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
    marginBottom: 14,
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
