import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { apiService } from '../services/api';
import {
  WarehouseItem,
  StockQuantItem,
  CreateWarehousePayload,
} from '../types';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { Button } from '../components/Button';
import { colors } from '../theme/colors';

export const WarehouseMasterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [stockLedger, setStockLedger] = useState<StockQuantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [whData, ledgerData] = await Promise.all([
        apiService.getWarehouses().catch(() => []),
        apiService.getStockLedger().catch(() => []),
      ]);
      setWarehouses(whData);
      setStockLedger(ledgerData);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter Warehouse Name');
      return;
    }
    if (!code.trim()) {
      Alert.alert('Required', 'Please enter Warehouse Code');
      return;
    }

    setSaving(true);
    try {
      const payload: CreateWarehousePayload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        address: address.trim() || undefined,
        isDefault,
      };

      await apiService.createWarehouse(payload);
      Alert.alert('Success', `Warehouse "${name}" registered!`);
      setModalVisible(false);
      setName('');
      setCode('');
      setAddress('');
      setIsDefault(false);
      await loadData();
    } catch (err: any) {
      Alert.alert('Failed', err.message || 'Could not create warehouse');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Warehouse & Godown Master"
        subtitle={`${warehouses.length} Storage Facilities • Dynamic Master`}
        showBack={true}
        onBack={() => navigation.goBack()}
        rightIcon="refresh"
        onRightPress={onRefresh}
      />

      <View style={styles.topActionBar}>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Icon name="building" size={16} color="#FFFFFF" />
          <Text style={styles.createBtnText}>+ Add New Warehouse / Godown</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading warehouses...</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Text style={styles.sectionSubtitle}>
            Physical godowns, factories and stores where on-hand inventory is stocked and tracked.
          </Text>

          {warehouses.map((wh) => {
            const quantsInWh = stockLedger.filter((q) => q.warehouseId === wh.id);
            const totalUnits = quantsInWh.reduce((sum, q) => sum + (q.qtyOnHand || 0), 0);

            return (
              <View key={wh.id} style={styles.whCard}>
                <View style={styles.whHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.whIconBox}>
                      <Icon name="building" size={20} color={colors.primary} />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.whName}>{wh.name}</Text>
                      <Text style={styles.whCode}>Code: {wh.code}</Text>
                    </View>
                  </View>

                  {wh.isDefault ? (
                    <View style={styles.defaultBadge}>
                      <Icon name="check-circle" size={11} color="#15803D" />
                      <Text style={styles.defaultBadgeText}>Primary Godown</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.whAddress}>
                  📍 {wh.address || 'Vendor Primary Facility'}
                </Text>

                <View style={styles.statsRow}>
                  <Text style={styles.statText}>
                    Unique Items: <Text style={{ fontWeight: '800' }}>{quantsInWh.length}</Text>
                  </Text>
                  <Text style={styles.statText}>
                    Total Units On-Hand: <Text style={{ fontWeight: '800', color: colors.confirmed }}>{totalUnits}</Text>
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ================= MODAL: ADD WAREHOUSE ================= */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register Godown / Warehouse</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Warehouse / Godown Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Bhiwandi Logistics Godown"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.formLabel}>Short Facility Code *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. WH-BHW, GODOWN-02"
                autoCapitalize="characters"
                value={code}
                onChangeText={setCode}
              />

              <Text style={styles.formLabel}>Physical Address (Optional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Plot 42, Industrial Area, Phase II"
                value={address}
                onChangeText={setAddress}
              />

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>Set as Primary Default Godown</Text>
                  <Text style={styles.switchSub}>Default destination for inward stock deliveries</Text>
                </View>
                <Switch
                  value={isDefault}
                  onValueChange={setIsDefault}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button title="Cancel" variant="outline" size="md" onPress={() => setModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Register Warehouse" variant="primary" size="md" loading={saving} onPress={handleCreate} style={{ flex: 1.5, marginLeft: 8 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topActionBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 11,
    borderRadius: 10,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 14,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: colors.textMuted,
  },
  whCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
  },
  whHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  whIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  whCode: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    marginLeft: 3,
  },
  whAddress: {
    fontSize: 12,
    color: colors.textSecondary,
    marginVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  statText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalBody: {
    padding: 16,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  switchSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
