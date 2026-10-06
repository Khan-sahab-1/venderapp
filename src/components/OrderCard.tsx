import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SalesOrder } from '../types';
import { StatusBadge } from './StatusBadge';
import { Icon } from './Icon';
import { colors } from '../theme/colors';

interface OrderCardProps {
  order: SalesOrder;
  onPress: () => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onPress }) => {
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(order.amountTotal);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.soNumberBlock}>
          <Text style={styles.soNumber}>{order.soNumber}</Text>
          <Text style={styles.poSubtext}>PO Ref: {order.poNumber}</Text>
        </View>
        <View style={styles.badgeRow}>
          {order.isBilled ? (
            <View style={styles.billedBadge}>
              <Icon name="file-text" size={10} color={colors.confirmed} />
              <Text style={styles.billedBadgeText}>BILLED</Text>
            </View>
          ) : order.status === 'CONFIRMED' ? (
            <View style={styles.readyBillBadge}>
              <Icon name="file-text" size={10} color={colors.primary} />
              <Text style={styles.readyBillBadgeText}>READY TO BILL</Text>
            </View>
          ) : (
            <View style={styles.acceptPendingBadge}>
              <Icon name="alert-circle" size={10} color="#B45309" />
              <Text style={styles.acceptPendingBadgeText}>ACCEPT ORDER</Text>
            </View>
          )}
          <StatusBadge status={order.status} size="sm" />
        </View>
      </View>

      <View style={styles.customerRow}>
        <Icon name="building" size={14} color={colors.textSecondary} />
        <Text style={styles.customerName} numberOfLines={1}>
          {order.customerName}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsRow}>
        <View style={styles.metaItem}>
          <Icon name="package" size={13} color={colors.textMuted} />
          <Text style={styles.metaText}>{order.linesCount} items</Text>
        </View>
        <View style={styles.metaItem}>
          <Icon name="calendar" size={13} color={colors.textMuted} />
          <Text style={styles.metaText}>
            {order.expectedDate ? `Due: ${order.expectedDate.split(' ')[0]}` : 'No date'}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.amountLabel}>Total Order Value</Text>
          <Text style={styles.amountValue}>{formattedAmount}</Text>
        </View>
        <View style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>Details</Text>
          <Icon name="chevron-right" size={14} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  billedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  billedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.confirmed,
    marginLeft: 3,
    letterSpacing: 0.3,
  },
  readyBillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  readyBillBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    marginLeft: 3,
    letterSpacing: 0.3,
  },
  acceptPendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  acceptPendingBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
    marginLeft: 3,
    letterSpacing: 0.3,
  },
  soNumberBlock: {
    flex: 1,
    marginRight: 8,
  },
  soNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  poSubtext: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginLeft: 6,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surface,
    marginBottom: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 18,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 10,
  },
  amountLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.confirmed,
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 2,
  },
});
