import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CreateBillPayload } from '../types';
import { Button } from './Button';
import { Icon } from './Icon';
import { colors } from '../theme/colors';

interface CreateBillModalProps {
  visible: boolean;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  onClose: () => void;
  onSubmit: (payload: CreateBillPayload) => Promise<void>;
}

export const CreateBillModal: React.FC<CreateBillModalProps> = ({
  visible,
  orderNumber,
  customerName,
  totalAmount,
  onClose,
  onSubmit,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(totalAmount);

  const handleSubmit = async () => {
    if (!billNumber.trim()) {
      setError('Invoice / Bill Number is required');
      return;
    }
    if (!billDate.trim()) {
      setError('Bill Date is required');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await onSubmit({
        vendorBillNumber: billNumber.trim(),
        billDate: billDate.trim(),
        dueDate: dueDate.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create bill in ERP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Generate Bill / Invoice</Text>
              <Text style={styles.headerSubtitle}>{orderNumber}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Bill Summary Banner */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Customer / Buyer:</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>
                  {customerName}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Bill Total Value:</Text>
                <Text style={styles.summaryAmount}>{formattedAmount}</Text>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Your Tax Invoice / Bill Number *</Text>
              <TextInput
                style={styles.input}
                value={billNumber}
                onChangeText={setBillNumber}
                placeholder="e.g. INV/2026/089 or BILL-4412"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Bill Date *</Text>
                <TextInput
                  style={styles.input}
                  value={billDate}
                  onChangeText={setBillDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Payment Due Date</Text>
                <TextInput
                  style={styles.input}
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Remarks / Terms (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Add payment terms, bank details or delivery notes..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.infoBox}>
              <Icon name="check-circle" size={14} color={colors.primary} />
              <Text style={styles.infoText}>
                Submitting this bill will create a Draft Vendor Bill in Odoo ERP linked directly to Purchase Order #{orderNumber}. The accounts team will review and approve payment.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="Cancel"
              variant="outline"
              size="md"
              onPress={onClose}
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              title="Submit Bill to ERP"
              variant="primary"
              size="md"
              loading={loading}
              iconName="file-text"
              onPress={handleSubmit}
              style={{ flex: 1.5, marginLeft: 8 }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F87171',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
  },
  body: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: colors.primaryMuted,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    maxWidth: '60%',
  },
  summaryAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.confirmed,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: colors.primary,
    marginLeft: 8,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
