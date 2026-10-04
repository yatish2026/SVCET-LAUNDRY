import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

const WAVE_PATHS = {
  1: 'M 28 8 C 58 2, 98 16, 136 8 C 154 4, 160 22, 154 52 C 160 82, 148 112, 134 122 C 102 114, 62 126, 26 122 C 6 118, 0 94, 4 64 C 0 34, 8 14, 28 8 Z',
  2: 'M 24 10 C 62 16, 102 4, 134 10 C 156 16, 158 40, 152 68 C 158 96, 146 122, 128 124 C 96 126, 56 116, 24 120 C 4 116, 0 88, 6 58 C 0 28, 6 12, 24 10 Z',
  3: 'M 26 6 C 54 14, 94 4, 132 10 C 152 14, 160 38, 154 66 C 160 94, 150 120, 130 124 C 98 120, 58 126, 28 120 C 8 114, 0 86, 4 56 C -2 26, 6 8, 26 6 Z',
  4: 'M 28 10 C 66 4, 104 16, 136 8 C 156 12, 158 36, 152 64 C 158 92, 148 118, 126 124 C 94 124, 54 116, 22 122 C 4 118, 0 90, 6 60 C 2 30, 8 12, 28 10 Z',
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
  iconSize = 28,
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
        viewBox="0 0 160 130"
        preserveAspectRatio="none"
      >
        <Path
          d={pathD}
          fill={theme.bg}
          stroke={theme.border}
          strokeWidth="2"
        />
      </Svg>

      {/* 📝 Card Content sitting directly on the wavy card */}
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
    height: 138,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#0F4C5C',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 6px 16px rgba(15, 76, 92, 0.07)',
      },
    }),
  },
  contentWrap: {
    flex: 1,
    paddingTop: 18,
    paddingBottom: 16,
    paddingHorizontal: 18,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  iconWrap: {
    alignSelf: 'flex-start',
  },
  textWrap: {
    justifyContent: 'flex-end',
  },
  titleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F4C5C',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  subText: {
    fontSize: 11.5,
    color: '#526477',
    fontWeight: '600',
  },
});

export default WavyServiceCard;
