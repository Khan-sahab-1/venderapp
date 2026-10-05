import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OrderStatus } from '../types';
import { colors } from '../theme/colors';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'CONFIRMED':
        return {
          bg: colors.confirmedBg,
          border: colors.confirmedBorder,
          text: colors.confirmed,
          label: 'CONFIRMED',
        };
      case 'DISPATCHED':
        return {
          bg: colors.dispatchedBg,
          border: colors.dispatchedBorder,
          text: colors.dispatched,
          label: 'DISPATCHED',
        };
      case 'COMPLETED':
        return {
          bg: colors.completedBg,
          border: colors.completedBorder,
          text: colors.completed,
          label: 'COMPLETED',
        };
      case 'PENDING_APPROVAL':
        return {
          bg: colors.pendingBg,
          border: colors.pendingBorder,
          text: colors.pending,
          label: 'PENDING APPROVAL',
        };
      case 'CANCELLED':
        return {
          bg: colors.cancelledBg,
          border: colors.cancelledBorder,
          text: colors.cancelled,
          label: 'CANCELLED',
        };
      default:
        return {
          bg: colors.surface,
          border: colors.border,
          text: colors.textSecondary,
          label: status,
        };
    }
  };

  const config = getBadgeStyle();
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        isSm ? styles.badgeSm : styles.badgeMd,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.text }]} />
      <Text
        style={[
          styles.text,
          isSm ? styles.textSm : styles.textMd,
          {
            color: config.text,
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
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  badgeMd: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textSm: {
    fontSize: 10,
  },
  textMd: {
    fontSize: 11,
  },
});
