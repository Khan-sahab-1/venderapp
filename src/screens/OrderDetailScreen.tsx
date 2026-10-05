import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { apiService } from '../services/api';
import { SalesOrderDetail, DispatchPayload } from '../types';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { DispatchModal } from '../components/DispatchModal';
import { colors } from '../theme/colors';

interface OrderDetailScreenProps {
  navigation: any;
  route: any;
}

export const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({ navigation, route }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState<SalesOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState(false);
  const [dispatchModalVisible, setDispatchModalVisible] = useState(false);
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  const fetchOrderDetail = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.getOrderById(orderId);
      setOrder(data);
      if (data.isAcknowledged || data.status === 'CONFIRMED' || data.status === 'DISPATCHED' || data.status === 'COMPLETED') {
        setIsAcknowledged(true);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not load order details');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const handleAcknowledge = async () => {
    setAcknowledging(true);
    try {
      const res = await apiService.acknowledgeOrder(orderId);
      setIsAcknowledged(true);
      Alert.alert(
        'Order Acknowledged',
        res.message || 'Your acknowledgment has been logged into Odoo ERP and the buyer has been notified.',
      );
      await fetchOrderDetail();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to acknowledge order');
    } finally {
      setAcknowledging(false);
    }
  };

  const handleDispatchSubmit = async (payload: DispatchPayload) => {
    try {
      const res = await apiService.submitDispatch(orderId, payload);
      if (order) {
        setOrder({ ...order, status: 'DISPATCHED' });
      }
      Alert.alert(
        'Dispatch Recorded!',
        res.message || `LR Number ${payload.lrNumber} via ${payload.transporterName} logged into Odoo Chatter.`,
      );
      await fetchOrderDetail();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to record dispatch');
      throw err;
    }
  };

  if (loading || !order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Order Details" showBack onBack={() => navigation.goBack()} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching order details from live Odoo API...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={order.soNumber}
        subtitle={`PO Ref: ${order.poNumber}`}
        showBack
        onBack={() => navigation.goBack()}
        rightIcon="refresh"
        onRightPress={fetchOrderDetail}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status & Date Bar */}
        <View style={styles.statusBar}>
          <View>
            <Text style={styles.statusLabel}>Current Status</Text>
            <View style={styles.statusBadgeWrap}>
              <StatusBadge status={order.status} />
            </View>
          </View>
          <View style={styles.dateBoxWrap}>
            <Text style={styles.statusLabel}>Order Date</Text>
            <Text style={styles.dateValue}>
              {order.orderDate ? order.orderDate.split(' ')[0] : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Progress Stepper */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fulfillment Stepper</Text>
          <View style={styles.stepperContainer}>
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, styles.stepCompleted]}>
                <Icon name="check-circle" size={14} color={colors.textWhite} />
              </View>
              <Text style={styles.stepText}>Approved</Text>
            </View>
            <View style={[styles.stepLine, styles.stepLineActive]} />

            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  isAcknowledged || order.status === 'CONFIRMED' || order.status === 'DISPATCHED' || order.status === 'COMPLETED'
                    ? styles.stepCompleted
                    : styles.stepPending,
                ]}
              >
                <Icon
                  name="check-circle"
                  size={14}
                  color={
                    isAcknowledged || order.status !== 'PENDING_APPROVAL'
                      ? colors.textWhite
                      : colors.textMuted
                  }
                />
              </View>
              <Text style={styles.stepText}>Acknowledged</Text>
            </View>
            <View
              style={[
                styles.stepLine,
                order.status === 'DISPATCHED' || order.status === 'COMPLETED'
                  ? styles.stepLineActive
                  : null,
              ]}
            />

            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  order.status === 'DISPATCHED' || order.status === 'COMPLETED'
                    ? styles.stepCompleted
                    : styles.stepPending,
                ]}
              >
                <Icon
                  name="truck"
                  size={14}
                  color={
                    order.status === 'DISPATCHED' || order.status === 'COMPLETED'
                      ? colors.textWhite
                      : colors.textMuted
                  }
                />
              </View>
              <Text style={styles.stepText}>Dispatched</Text>
            </View>
            <View
              style={[
                styles.stepLine,
                order.status === 'COMPLETED' ? styles.stepLineActive : null,
              ]}
            />

            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  order.status === 'COMPLETED' ? styles.stepCompleted : styles.stepPending,
                ]}
              >
                <Icon
                  name="package"
                  size={14}
                  color={order.status === 'COMPLETED' ? colors.textWhite : colors.textMuted}
                />
              </View>
              <Text style={styles.stepText}>Delivered</Text>
            </View>
          </View>
        </View>

        {/* Customer & Delivery Destination Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer & Delivery Information</Text>

          <View style={styles.infoRow}>
            <Icon name="building" size={16} color={colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Customer</Text>
              <Text style={styles.infoValue}>{order.customerName}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Icon name="truck" size={16} color={colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Shipping Destination</Text>
              <Text style={styles.infoValue}>{order.deliveryAddress || order.companyAddress || order.customerName}</Text>
            </View>
          </View>

          {order.notes ? (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Icon name="file-text" size={16} color={colors.textMuted} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Terms / Buyer Notes</Text>
                  <Text style={styles.infoValueNotes}>{order.notes}</Text>
                </View>
              </View>
            </>
          ) : null}
        </View>

        {/* Action Buttons: Acknowledge & Dispatch */}
        <View style={styles.actionContainer}>
          <Button
            title={isAcknowledged ? 'Order Acknowledged ✓' : 'Acknowledge Order'}
            variant={isAcknowledged ? 'secondary' : 'success'}
            size="md"
            loading={acknowledging}
            disabled={isAcknowledged}
            iconName="check-circle"
            onPress={handleAcknowledge}
            style={styles.btnAcknowledge}
          />

          <Button
            title="Update Dispatch / LR"
            variant="primary"
            size="md"
            iconName="truck"
            onPress={() => setDispatchModalVisible(true)}
            style={styles.btnDispatch}
          />
        </View>

        {/* Items Line Table */}
        <View style={styles.card}>
          <View style={styles.itemsHeader}>
            <Text style={styles.cardTitle}>Order Items ({order.lines?.length || 0})</Text>
            <Text style={styles.itemsHeaderSub}>Qty & Pricing</Text>
          </View>

          {order.lines && order.lines.length > 0 ? (
            order.lines.map((item, index) => (
              <View key={item.id || index} style={styles.itemRow}>
                <View style={styles.itemIndex}>
                  <Text style={styles.itemIndexText}>{index + 1}</Text>
                </View>

                <View style={styles.itemMain}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  {item.description && item.description !== item.productName ? (
                    <Text style={styles.itemDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}

                  <View style={styles.itemMeta}>
                    <Text style={styles.itemQty}>
                      Qty: <Text style={styles.boldText}>{item.quantityOrdered} {item.uom || 'Unit(s)'}</Text>
                    </Text>
                    <Text style={styles.itemPrice}>
                      Rate: {formatCurrency(item.unitPrice)}
                    </Text>
                  </View>
                </View>

                <View style={styles.itemTotal}>
                  <Text style={styles.itemTotalAmount}>{formatCurrency(item.priceTotal || item.subtotal)}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyLinesText}>No line items detailed in this purchase order.</Text>
          )}
        </View>

        {/* Financial Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Financial Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal (Untaxed)</Text>
            <Text style={styles.summaryValue}>{formatCurrency(order.amountUntaxed)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GST / Estimated Taxes</Text>
            <Text style={styles.summaryValue}>{formatCurrency(order.amountTax)}</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>Grand Total Amount</Text>
            <Text style={styles.summaryTotalValue}>{formatCurrency(order.amountTotal)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Dispatch Tracking Modal */}
      <DispatchModal
        visible={dispatchModalVisible}
        orderNumber={order.soNumber}
        onClose={() => setDispatchModalVisible(false)}
        onSubmit={handleDispatchSubmit}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCompleted: {
    backgroundColor: colors.confirmed,
  },
  stepPending: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 6,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 4,
    marginTop: -16,
  },
  stepLineActive: {
    backgroundColor: colors.confirmed,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  infoTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  infoValueNotes: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surface,
    marginVertical: 8,
  },
  actionContainer: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
    paddingBottom: 8,
  },
  itemsHeaderSub: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  itemIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  itemIndexText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  itemMain: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemDescription: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  itemQty: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 14,
  },
  boldText: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemPrice: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  itemTotal: {
    alignItems: 'flex-end',
  },
  itemTotalAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.confirmed,
  },
  emptyLinesText: {
    fontSize: 13,
    color: colors.textMuted,
    paddingVertical: 12,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.confirmed,
  },
  statusBadgeWrap: {
    marginTop: 4,
  },
  dateBoxWrap: {
    alignItems: 'flex-end',
  },
  btnAcknowledge: {
    flex: 1,
    marginRight: 8,
  },
  btnDispatch: {
    flex: 1.2,
    marginLeft: 8,
  },
});
