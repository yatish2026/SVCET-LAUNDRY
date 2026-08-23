import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../constants/theme';

export const StatusBadge = ({ status, size = 'md' }) => {
  const config = THEME.colors.status[status] || {
    label: status?.replace('_', ' ') || 'Unknown',
    color: THEME.colors.textSecondary,
    bg: THEME.colors.surfaceSubtle,
    border: THEME.colors.border,
    icon: 'ellipse-outline',
  };

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          paddingVertical: isSmall ? 3 : isLarge ? 8 : 5,
          paddingHorizontal: isSmall ? 8 : isLarge ? 14 : 10,
        },
      ]}
    >
      <Ionicons
        name={config.icon}
        size={isSmall ? 12 : isLarge ? 16 : 14}
        color={config.color}
        style={{ marginRight: 5 }}
      />
      <Text
        style={[
          styles.text,
          {
            color: config.color,
            fontSize: isSmall ? 11 : isLarge ? 14 : 12,
            fontWeight: isLarge ? '700' : '600',
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: THEME.radius.full,
    borderWidth: 1,
  },
  text: {
    letterSpacing: 0.2,
  },
});

export default StatusBadge;
