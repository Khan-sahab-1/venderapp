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
import { DispatchPayload } from '../types';
import { Button } from './Button';
import { Icon } from './Icon';
import { colors } from '../theme/colors';

interface DispatchModalProps {
  visible: boolean;
  orderNumber: string;
  onClose: () => void;
  onSubmit: (payload: DispatchPayload) => Promise<void>;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({
  visible,
  orderNumber,
  onClose,
  onSubmit,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [transporterName, setTransporterName] = useState('VRL Logistics');
  const [lrNumber, setLrNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [numberOfBoxes, setNumberOfBoxes] = useState('5');
  const [dispatchDate, setDispatchDate] = useState(todayStr);
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!transporterName.trim()) {
      setError('Transporter Name is required');
      return;
    }
    if (!lrNumber.trim()) {
      setError('LR / Bilty Number is required');
      return;
    }
    if (!dispatchDate.trim()) {
      setError('Dispatch Date is required');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await onSubmit({
        transporterName: transporterName.trim(),
        lrNumber: lrNumber.trim(),
        vehicleNumber: vehicleNumber.trim() || undefined,
        numberOfBoxes: numberOfBoxes ? parseInt(numberOfBoxes, 10) : undefined,
        dispatchDate: dispatchDate.trim(),
        estimatedDeliveryDate: estimatedDeliveryDate.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update dispatch details');
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
              <Text style={styles.headerTitle}>Update Dispatch / LR</Text>
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
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Transporter / Courier Name *</Text>
              <TextInput
                style={styles.input}
                value={transporterName}
                onChangeText={setTransporterName}
                placeholder="e.g. VRL Logistics / Safexpress"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>LR / Bilty / Docket Number *</Text>
              <TextInput
                style={styles.input}
                value={lrNumber}
                onChangeText={setLrNumber}
                placeholder="e.g. LR-984721"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.fieldGroup, styles.fieldHalfLeft]}>
                <Text style={styles.label}>Vehicle Number</Text>
                <TextInput
                  style={styles.input}
                  value={vehicleNumber}
                  onChangeText={setVehicleNumber}
                  placeholder="MH-12-PQ-4589"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                />
              </View>

              <View style={[styles.fieldGroup, styles.fieldHalfRight]}>
                <Text style={styles.label}>Boxes / Packages</Text>
                <TextInput
                  style={styles.input}
                  value={numberOfBoxes}
                  onChangeText={setNumberOfBoxes}
                  placeholder="5"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.fieldGroup, styles.fieldHalfLeft]}>
                <Text style={styles.label}>Dispatch Date *</Text>
                <TextInput
                  style={styles.input}
                  value={dispatchDate}
                  onChangeText={setDispatchDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={[styles.fieldGroup, styles.fieldHalfRight]}>
                <Text style={styles.label}>Est. Delivery Date</Text>
                <TextInput
                  style={styles.input}
                  value={estimatedDeliveryDate}
                  onChangeText={setEstimatedDeliveryDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Driver Contact / Remarks</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Driver Contact: 9876543210. Handed over in good condition."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.infoBanner}>
              <Icon name="truck" size={16} color={colors.primary} />
              <Text style={styles.infoText}>
                This will automatically update the purchase order tracking chatter in Odoo and notify the buyer.
              </Text>
            </View>

            <View style={styles.footerBtns}>
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                onPress={onClose}
                style={styles.cancelBtn}
              />
              <Button
                title="Confirm Dispatch"
                variant="primary"
                size="md"
                loading={loading}
                iconName="truck"
                onPress={handleSubmit}
                style={styles.confirmBtn}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    backgroundColor: colors.cancelledBg,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cancelledBorder,
    marginBottom: 12,
  },
  errorText: {
    color: colors.cancelled,
    fontSize: 12,
    fontWeight: '600',
  },
  body: {
    paddingBottom: 10,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    color: colors.primaryDark,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  footerBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  fieldHalfLeft: {
    flex: 1,
    marginRight: 8,
  },
  fieldHalfRight: {
    flex: 1,
    marginLeft: 8,
  },
  cancelBtn: {
    flex: 1,
    marginRight: 8,
  },
  confirmBtn: {
    flex: 1.5,
    marginLeft: 8,
  },
});
