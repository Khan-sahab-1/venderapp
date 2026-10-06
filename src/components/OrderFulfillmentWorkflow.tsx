import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from './Icon';
import { Button } from './Button';
import { colors } from '../theme/colors';

interface OrderFulfillmentWorkflowProps {
  poNumber: string;
  orderTotal: number;
  itemCount: number;
  isAccepted: boolean;
  accepting: boolean;
  onAccept: () => void;
  isBilled: boolean;
  invoiceCount?: number;
  onOpenBillModal: () => void;
}

export const OrderFulfillmentWorkflow: React.FC<OrderFulfillmentWorkflowProps> = ({
  poNumber,
  orderTotal,
  itemCount,
  isAccepted,
  accepting,
  onAccept,
  isBilled,
  invoiceCount = 0,
  onOpenBillModal,
}) => {
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(orderTotal);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.sectionHeading}>Order Fulfillment Pipeline</Text>
          <Text style={styles.sectionSubheading}>3-Step Progressive Workflow</Text>
        </View>
        <View style={styles.progressPill}>
          <Text style={styles.progressPillText}>
            {isBilled ? 'Step 3 of 3' : isAccepted ? 'Step 2 of 3' : 'Step 1 of 3'}
          </Text>
        </View>
      </View>

      {/* Pipeline Visual Track */}
      <View style={styles.pipelineTrack}>
        {/* Step 1 Node */}
        <View style={styles.nodeItem}>
          <View style={[styles.nodeCircle, styles.nodeActive]}>
            <Icon name="check-circle" size={14} color="#FFFFFF" />
          </View>
          <Text style={styles.nodeTextActive}>1. Received</Text>
        </View>
        <View style={[styles.trackLine, isAccepted ? styles.trackLineActive : null]} />

        {/* Step 2 Node */}
        <View style={styles.nodeItem}>
          <View
            style={[
              styles.nodeCircle,
              isAccepted ? styles.nodeActive : styles.nodeCurrent,
            ]}
          >
            {isAccepted ? (
              <Icon name="check-circle" size={14} color="#FFFFFF" />
            ) : (
              <Text style={styles.nodeNumber}>2</Text>
            )}
          </View>
          <Text
            style={[
              styles.nodeText,
              isAccepted || !isBilled ? styles.nodeTextActive : null,
            ]}
          >
            2. Accept
          </Text>
        </View>
        <View style={[styles.trackLine, isBilled ? styles.trackLineActive : null]} />

        {/* Step 3 Node */}
        <View style={styles.nodeItem}>
          <View
            style={[
              styles.nodeCircle,
              isBilled
                ? styles.nodeActive
                : isAccepted
                ? styles.nodeCurrent
                : styles.nodeDisabled,
            ]}
          >
            {isBilled ? (
              <Icon name="check-circle" size={14} color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  styles.nodeNumber,
                  !isAccepted ? styles.nodeNumberMuted : null,
                ]}
              >
                3
              </Text>
            )}
          </View>
          <Text
            style={[
              styles.nodeText,
              isBilled ? styles.nodeTextActive : null,
            ]}
          >
            3. Bill
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* ================= STEP 1 CARD ================= */}
      <View style={styles.stepBlock}>
        <View style={styles.stepHeaderRow}>
          <View style={styles.stepBadgeCompleted}>
            <Icon name="check-circle" size={12} color={colors.confirmed} />
            <Text style={styles.stepBadgeTextCompleted}>STEP 1: ORDER RECEIVED ✓</Text>
          </View>
          <Text style={styles.poRefText}>PO: {poNumber}</Text>
        </View>
        <Text style={styles.stepDescription}>
          Derived automatically from confirmed Odoo Purchase Order. Review the {itemCount} items below totaling{' '}
          <Text style={styles.boldPrice}>{formattedAmount}</Text>.
        </Text>
      </View>

      {/* ================= STEP 2 CARD ================= */}
      <View
        style={[
          styles.stepBlock,
          !isAccepted ? styles.stepBlockHighlight : styles.stepBlockDone,
        ]}
      >
        <View style={styles.stepHeaderRow}>
          <View
            style={
              isAccepted ? styles.stepBadgeCompleted : styles.stepBadgeActionRequired
            }
          >
            <Icon
              name={isAccepted ? 'check-circle' : 'alert-circle'}
              size={12}
              color={isAccepted ? colors.confirmed : '#D97706'}
            />
            <Text
              style={
                isAccepted
                  ? styles.stepBadgeTextCompleted
                  : styles.stepBadgeTextActionRequired
              }
            >
              {isAccepted ? 'STEP 2: ORDER ACCEPTED ✓' : 'STEP 2: ACTION REQUIRED'}
            </Text>
          </View>
        </View>

        <Text style={styles.stepDescription}>
          {isAccepted
            ? 'Order accepted by vendor. A confirmation note has been logged into Odoo PO Chatter.'
            : 'Click accept below to acknowledge order fulfillment with the buyer. This will unlock Step 3 (Bill Generation).'}
        </Text>

        {!isAccepted && (
          <Button
            title="Acknowledge / Accept Order"
            variant="success"
            size="md"
            iconName="check-circle"
            loading={accepting}
            onPress={onAccept}
            style={styles.stepActionBtn}
          />
        )}
      </View>

      {/* ================= STEP 3 CARD ================= */}
      <View
        style={[
          styles.stepBlock,
          isBilled
            ? styles.stepBlockDone
            : isAccepted
            ? styles.stepBlockActiveStep3
            : styles.stepBlockLocked,
        ]}
      >
        <View style={styles.stepHeaderRow}>
          <View
            style={
              isBilled
                ? styles.stepBadgeCompleted
                : isAccepted
                ? styles.stepBadgeActive
                : styles.stepBadgeLocked
            }
          >
            <Icon
              name={isBilled ? 'check-circle' : isAccepted ? 'file-text' : 'lock'}
              size={12}
              color={
                isBilled
                  ? colors.confirmed
                  : isAccepted
                  ? colors.primary
                  : colors.textMuted
              }
            />
            <Text
              style={
                isBilled
                  ? styles.stepBadgeTextCompleted
                  : isAccepted
                  ? styles.stepBadgeTextActive
                  : styles.stepBadgeTextLocked
              }
            >
              {isBilled
                ? 'STEP 3: VENDOR BILL CREATED ✓'
                : isAccepted
                ? 'STEP 3: READY FOR BILLING 📄'
                : 'STEP 3: LOCKED (ACCEPT FIRST)'}
            </Text>
          </View>
          {isBilled && invoiceCount > 0 && (
            <View style={styles.billCountTag}>
              <Text style={styles.billCountTagText}>Odoo Bills: {invoiceCount}</Text>
            </View>
          )}
        </View>

        <Text style={styles.stepDescription}>
          {isBilled
            ? `Draft Vendor Bill created in Odoo ERP! PO smart button "Vendor Bills (${invoiceCount})" is now active for buyer accounts verification.`
            : isAccepted
            ? 'Order is confirmed! Enter your tax invoice number & date to submit bill directly into Odoo ERP as a Draft Vendor Bill.'
            : 'Bill generation is locked. Please accept the order in Step 2 above first.'}
        </Text>

        {isAccepted && !isBilled && (
          <Button
            title="Generate / Submit Bill"
            variant="primary"
            size="md"
            iconName="file-text"
            onPress={onOpenBillModal}
            style={styles.stepActionBtn}
          />
        )}

        {isBilled && (
          <View style={styles.billedInfoRow}>
            <View style={styles.billedStatusPill}>
              <View style={styles.greenPulseDot} />
              <Text style={styles.billedStatusText}>In Odoo ERP: Draft (Awaiting Accounts Review)</Text>
            </View>
            <TouchableOpacity
              onPress={onOpenBillModal}
              style={styles.anotherBillBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.anotherBillText}>+ Add Another Bill</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionSubheading: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  progressPill: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  pipelineTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  nodeItem: {
    alignItems: 'center',
    width: 68,
  },
  nodeCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  nodeActive: {
    backgroundColor: colors.confirmed,
  },
  nodeCurrent: {
    backgroundColor: colors.primary,
  },
  nodeDisabled: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nodeNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  nodeNumberMuted: {
    color: colors.textMuted,
  },
  nodeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  nodeTextActive: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  trackLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  trackLineActive: {
    backgroundColor: colors.confirmed,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surface,
    marginVertical: 10,
  },
  stepBlock: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  stepBlockHighlight: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  stepBlockActiveStep3: {
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
  },
  stepBlockDone: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  stepBlockLocked: {
    opacity: 0.65,
    backgroundColor: '#F1F5F9',
  },
  stepHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepBadgeCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stepBadgeTextCompleted: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.confirmed,
    marginLeft: 4,
    letterSpacing: 0.3,
  },
  stepBadgeActionRequired: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stepBadgeTextActionRequired: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    marginLeft: 4,
    letterSpacing: 0.3,
  },
  stepBadgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stepBadgeTextActive: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    marginLeft: 4,
    letterSpacing: 0.3,
  },
  stepBadgeLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stepBadgeTextLocked: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginLeft: 4,
  },
  poRefText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  stepDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  boldPrice: {
    fontWeight: '700',
    color: colors.confirmed,
  },
  stepActionBtn: {
    marginTop: 10,
  },
  billCountTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  billCountTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.confirmed,
  },
  billedInfoRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billedStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  greenPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.confirmed,
    marginRight: 6,
  },
  billedStatusText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  anotherBillBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.surface,
    borderRadius: 6,
    marginLeft: 8,
  },
  anotherBillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});
