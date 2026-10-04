import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Rect, G } from 'react-native-svg';

export const LaundryBasketHero = ({ size = 95, style }) => {
  return (
    <View style={[{ width: size, height: size }, styles.container, style]}>
      <Svg viewBox="0 0 100 100" width={size} height={size} fill="none">
        {/* Soft Background Circular Glow */}
        <Circle cx="50" cy="50" r="42" fill="#E2F5F0" />
        
        {/* Floating Heart */}
        <Path
          d="M 72 20 C 70 16, 64 16, 62 21 C 60 16, 54 16, 52 21 C 50 26, 62 33, 62 33 C 62 33, 74 26, 72 20 Z"
          fill="#F472B6"
        />

        {/* Botanical Leaves Behind Basket */}
        <Path
          d="M 20 48 C 14 42, 16 32, 22 28 C 26 34, 25 44, 20 48 Z"
          fill="#10B981"
        />
        <Path
          d="M 80 50 C 86 44, 84 34, 78 30 C 74 36, 75 46, 80 50 Z"
          fill="#34D399"
        />

        {/* 🧺 Folded Pastel Clothes Stack */}
        {/* Layer 1 - Light Blue Fold */}
        <Path
          d="M 28 50 C 28 42, 38 40, 50 40 C 62 40, 72 42, 72 50 C 72 55, 28 55, 28 50 Z"
          fill="#93C5FD"
        />

        {/* Layer 2 - Pastel Yellow Fold */}
        <Path
          d="M 32 44 C 32 38, 40 36, 50 36 C 60 36, 68 38, 68 44 C 68 48, 32 48, 32 44 Z"
          fill="#FDE047"
        />

        {/* Layer 3 - Soft Lavender Fold */}
        <Path
          d="M 36 38 C 36 32, 42 30, 50 30 C 58 30, 64 32, 64 38 C 64 42, 36 42, 36 38 Z"
          fill="#C4B5FD"
        />

        {/* Layer 4 - Warm Coral Peach Top Fold */}
        <Path
          d="M 40 32 C 40 26, 45 24, 50 24 C 55 24, 60 26, 60 32 C 60 36, 40 36, 40 32 Z"
          fill="#FB923C"
        />

        {/* Overhanging Clean Cloth */}
        <Path
          d="M 44 48 C 44 48, 46 62, 54 62 C 58 62, 58 52, 58 48 Z"
          fill="#FDBA74"
        />

        {/* 🧺 Laundry Basket Rim */}
        <Rect
          x="22"
          y="48"
          width="56"
          height="8"
          rx="4"
          fill="#0F4C5C"
        />
        <Rect
          x="24"
          y="50"
          width="52"
          height="4"
          rx="2"
          fill="#1E6B7B"
        />

        {/* 🧺 Laundry Basket Main Body */}
        <Path
          d="M 25 56 L 31 82 C 32 86, 36 88, 40 88 L 60 88 C 64 88, 68 86, 69 82 L 75 56 Z"
          fill="#0F4C5C"
        />

        {/* Basket Weave Pattern Lines */}
        <G stroke="#278194" strokeWidth="1.8" strokeLinecap="round">
          {/* Vertical Weaves */}
          <Path d="M 37 58 L 40 84" />
          <Path d="M 46 58 L 47 84" />
          <Path d="M 54 58 L 53 84" />
          <Path d="M 63 58 L 60 84" />
          
          {/* Horizontal Weaves */}
          <Path d="M 28 66 L 72 66" />
          <Path d="M 31 75 L 69 75" />
        </G>

        {/* Basket Side Handles */}
        <Path
          d="M 22 52 C 16 52, 16 60, 24 62"
          stroke="#0F4C5C"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <Path
          d="M 78 52 C 84 52, 84 60, 76 62"
          stroke="#0F4C5C"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Front Botanical Leaf Badge on Basket */}
        <Path
          d="M 48 54 C 44 51, 44 47, 47 45 C 50 48, 50 52, 48 54 Z"
          fill="#A7F3D0"
        />
        <Path
          d="M 52 54 C 56 51, 56 47, 53 45 C 50 48, 50 52, 52 54 Z"
          fill="#6EE7B7"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LaundryBasketHero;
