import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

const WAVE_PATHS = {
  1: 'M 24 6 C 58 1, 102 10, 136 6 C 152 4, 158 18, 155 45 C 158 72, 150 96, 134 102 C 98 98, 58 106, 24 102 C 8 98, 2 80, 5 52 C 2 26, 8 10, 24 6 Z',
  2: 'M 22 8 C 62 12, 102 2, 136 8 C 154 12, 158 30, 154 55 C 158 80, 148 100, 130 104 C 96 102, 56 96, 22 100 C 6 96, 2 76, 5 50 C 2 24, 6 10, 22 8 Z',
  3: 'M 24 5 C 54 10, 96 2, 134 8 C 152 10, 158 28, 155 54 C 158 78, 150 98, 132 103 C 98 100, 58 105, 26 100 C 8 96, 2 74, 5 48 C 1 22, 7 8, 24 5 Z',
  4: 'M 26 8 C 66 2, 106 11, 136 6 C 154 9, 158 28, 154 52 C 158 76, 148 98, 128 103 C 94 101, 54 97, 22 101 C 6 97, 2 78, 6 52 C 3 26, 8 10, 26 8 Z',
};

const THEME_PALETTES = {
  iceBlue: {
    bg: '#DDF1FB',
    border: '#A5DCF6',
    icon: '#0F4C5C',
  },
  sunsetPeach: {
    bg: '#FEE8D6',
    border: '#FBC5A2',
    icon: '#C2410C',
  },
  freshMint: {
    bg: '#D6F6E4',
    border: '#A0EBC0',
    icon: '#059669',
  },
  blushPink: {
    bg: '#FCE0E9',
    border: '#F9B5C9',
    icon: '#E11D48',
  },
};

export const WavyServiceCard = ({
  title,
  subtitle,
  icon,
  iconSize = 25,
  iconColor,
  colorTheme = 'iceBlue',
  variant = 1,
  onPress,
  style,
}) => {
  const theme = THEME_PALETTES[colorTheme] || THEME_PALETTES.iceBlue;
  const activeIconColor = iconColor || theme.icon || '#0F4C5C';
  const pathD = WAVE_PATHS[variant] || WAVE_PATHS[1];

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {/* 🌊 Organic Fluid Wavy Vector Background */}
      <Svg
        style={StyleSheet.absoluteFillObject}
        viewBox="0 0 160 110"
        preserveAspectRatio="none"
      >
        <Path
          d={pathD}
          fill={theme.bg}
          stroke={theme.border}
          strokeWidth="1.8"
        />
      </Svg>

      {/* 📝 Card Content centered comfortably inside the wave box */}
      <View style={styles.contentWrap}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={iconSize} color={activeIconColor} />
        </View>

        <View style={styles.textWrap}>
          <Text style={styles.titleText} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subText} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    height: 114,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#0F4C5C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
      },
      android: {
        elevation: 2.5,
      },
      web: {
        boxShadow: '0 4px 14px rgba(15, 76, 92, 0.06)',
      },
    }),
  },
  contentWrap: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  textWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  titleText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F4C5C',
    letterSpacing: -0.2,
    textAlign: 'center',
    marginBottom: 2,
  },
  subText: {
    fontSize: 11,
    color: '#526477',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default WavyServiceCard;
