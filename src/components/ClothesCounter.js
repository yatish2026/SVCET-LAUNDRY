import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import THEME from '../constants/theme';

export const ClothesCounter = ({
  item,
  count = 0,
  onIncrement,
  onDecrement,
  canIncrement = true,
}) => {
  return (
    <View style={[styles.card, count > 0 && styles.cardActive]}>
      <View style={styles.left}>
        <View style={[styles.dot, count > 0 && styles.dotActive]} />
        <View style={styles.textWrap}>
          <Text style={[styles.name, count > 0 && styles.nameActive]}>{item.name}</Text>
          {count > 0 && (
            <Text style={styles.subtext}>
              {count} {count === 1 ? 'piece' : 'pieces'} added
            </Text>
          )}
        </View>
      </View>

      <View style={styles.counterWrap}>
        <TouchableOpacity
          style={[styles.btn, count === 0 && styles.btnDisabled]}
          onPress={onDecrement}
          disabled={count === 0}
          activeOpacity={0.7}
        >
          <Ionicons
            name="remove"
            size={16}
            color={count === 0 ? '#94A3B8' : '#1D4ED8'}
          />
        </TouchableOpacity>

        <View style={[styles.countBadge, count > 0 && styles.countBadgeActive]}>
          <Text style={[styles.countText, count > 0 && styles.countTextActive]}>{count}</Text>
        </View>

        <TouchableOpacity
          style={[styles.btn, !canIncrement && styles.btnDisabled]}
          onPress={onIncrement}
          disabled={!canIncrement}
          activeOpacity={0.7}
        >
          <Ionicons
            name="add"
            size={16}
            color={!canIncrement ? '#94A3B8' : '#1D4ED8'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
    marginRight: 10,
  },
  dotActive: {
    backgroundColor: '#2563EB',
  },
  textWrap: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  nameActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  subtext: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '600',
    marginTop: 1,
  },
  counterWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.radius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.4,
    backgroundColor: '#F8FAFC',
  },
  countBadge: {
    minWidth: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countBadgeActive: {
    backgroundColor: '#EFF6FF',
    borderRadius: 4,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  countTextActive: {
    color: '#1D4ED8',
    fontWeight: '800',
  },
});

export default ClothesCounter;
