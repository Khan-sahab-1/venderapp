import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from './Icon';
import { colors } from '../theme/colors';

interface OrderNotificationBannerProps {
  orderNumber: string;
  poNumber: string;
  customerName: string;
  amount: number;
  onPress: () => void;
  onDismiss?: () => void;
}

export const OrderNotificationBanner: React.FC<OrderNotificationBannerProps> = ({
  orderNumber,
  poNumber,
  customerName,
  amount,
  onPress,
  onDismiss,
}) => {
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={styles.innerTouchable}
      >
        <View style={styles.iconCol}>
          <View style={styles.bellWrap}>
            <Icon name="bell" size={16} color="#FFFFFF" />
            <View style={styles.badgeDot} />
          </View>
        </View>

        <View style={styles.contentCol}>
          <View style={styles.titleRow}>
            <Text style={styles.alertTag}>NEW ORDER RECEIVED</Text>
            <Text style={styles.timeTag}>Just now</Text>
          </View>
          <Text style={styles.orderTitle} numberOfLines={1}>
            {orderNumber}
          </Text>
          <Text style={styles.orderSubtext} numberOfLines={1}>
            {customerName} • <Text style={styles.amountBold}>{formattedAmount}</Text>
          </Text>
          <View style={styles.ctaRow}>
            <Text style={styles.ctaText}>Step 1: Review & Accept Order</Text>
            <Icon name="chevron-right" size={13} color={colors.primary} />
          </View>
        </View>
      </TouchableOpacity>

      {onDismiss ? (
        <TouchableOpacity
          onPress={onDismiss}
          style={styles.dismissBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="close" size={14} color={colors.textMuted} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  innerTouchable: {
    flexDirection: 'row',
    padding: 12,
  },
  iconCol: {
    marginRight: 10,
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  bellWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  contentCol: {
    flex: 1,
    paddingRight: 14,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  alertTag: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  timeTag: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  orderSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  amountBold: {
    fontWeight: '700',
    color: colors.confirmed,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ctaText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 2,
  },
  dismissBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
});
