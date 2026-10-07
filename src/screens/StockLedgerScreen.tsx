import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { apiService } from '../services/api';
import {
  StockQuantItem,
  StockMoveItem,
  InventoryProduct,
  WarehouseItem,
  StockInwardPayload,
  StockOutwardPayload,
} from '../types';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { Button } from '../components/Button';
import { colors } from '../theme/colors';

export const StockLedgerScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [subTab, setSubTab] = useState<'QUANTS' | 'AUDIT'>('QUANTS');
  const [stockLedger, setStockLedger] = useState<StockQuantItem[]>([]);
  const [stockMoves, setStockMoves] = useState<StockMoveItem[]>([]);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [inwardModalVisible, setInwardModalVisible] = useState(false);
  const [outwardModalVisible, setOutwardModalVisible] = useState(false);

  // Form: Inward
  const [inwardProduct, setInwardProduct] = useState<InventoryProduct | null>(null);
  const [inwardWhId, setInwardWhId] = useState<number>(1);
  const [inwardQty, setInwardQty] = useState('');
  const [inwardRef, setInwardRef] = useState('');
  const [inwardParty, setInwardParty] = useState('');
  const [savingInward, setSavingInward] = useState(false);

  // Form: Outward
  const [outwardProduct, setOutwardProduct] = useState<InventoryProduct | null>(null);
  const [outwardWhId, setOutwardWhId] = useState<number>(1);
  const [outwardQty, setOutwardQty] = useState('');
  const [outwardRef, setOutwardRef] = useState('');
  const [outwardParty, setOutwardParty] = useState('');
  const [savingOutward, setSavingOutward] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [ledgerData, movesData, prodsData, whData] = await Promise.all([
        apiService.getStockLedger().catch(() => []),
        apiService.getStockMoves().catch(() => []),
        apiService.getInventoryProducts().catch(() => []),
        apiService.getWarehouses().catch(() => []),
      ]);
      setStockLedger(ledgerData);
      setStockMoves(movesData);
      setProducts(prodsData);
      setWarehouses(whData);

      if (prodsData.length > 0) {
        if (!inwardProduct) setInwardProduct(prodsData[0]);
        if (!outwardProduct) setOutwardProduct(prodsData[0]);
      }
      if (whData.length > 0) {
        const def = whData.find((w: WarehouseItem) => w.isDefault) || whData[0];
        setInwardWhId(def.id);
        setOutwardWhId(def.id);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load stock data');
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

  const handleInward = async () => {
    if (!inwardProduct) {
      Alert.alert('Required', 'Please select a product');
      return;
    }
    const qty = Number(inwardQty);
    if (!qty || qty <= 0) {
      Alert.alert('Required', 'Please enter valid quantity greater than 0');
      return;
    }

    setSavingInward(true);
    try {
      const payload: StockInwardPayload = {
        productId: inwardProduct.id,
        warehouseId: inwardWhId,
        qty,
        referenceNo: inwardRef.trim() || undefined,
        partyName: inwardParty.trim() || undefined,
      };

      await apiService.stockInward(payload);
      Alert.alert('Stock Added!', `Successfully inwarded +${qty} ${inwardProduct.uomSymbol}.`);
      setInwardModalVisible(false);
      setInwardQty('');
      setInwardRef('');
      setInwardParty('');
      await loadData();
    } catch (err: any) {
      Alert.alert('Failed', err.message || 'Could not inward stock');
    } finally {
      setSavingInward(false);
    }
  };

  const handleOutward = async () => {
    if (!outwardProduct) {
      Alert.alert('Required', 'Please select a product');
      return;
    }
    const qty = Number(outwardQty);
    if (!qty || qty <= 0) {
      Alert.alert('Required', 'Please enter valid quantity greater than 0');
      return;
    }

    setSavingOutward(true);
    try {
      const payload: StockOutwardPayload = {
        productId: outwardProduct.id,
        warehouseId: outwardWhId,
        qty,
        referenceNo: outwardRef.trim() || undefined,
        partyName: outwardParty.trim() || undefined,
      };

      await apiService.stockOutward(payload);
      Alert.alert('Stock Issued!', `Successfully deducted -${qty} ${outwardProduct.uomSymbol}.`);
      setOutwardModalVisible(false);
      setOutwardQty('');
      setOutwardRef('');
      setOutwardParty('');
      await loadData();
    } catch (err: any) {
      Alert.alert('Failed', err.message || 'Could not deduct stock');
    } finally {
      setSavingOutward(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Stock Operations & Ledger"
        subtitle={`${stockLedger.length} Godown Quants • ${stockMoves.length} Audit Records`}
        showBack={true}
        onBack={() => navigation.goBack()}
        rightIcon="refresh"
        onRightPress={onRefresh}
      />

      {/* Top Action Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => setInwardModalVisible(true)}
          activeOpacity={0.8}
        >
          <Icon name="truck" size={15} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>+ Inward Stock (GRN)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dangerBtn}
          onPress={() => setOutwardModalVisible(true)}
          activeOpacity={0.8}
        >
          <Icon name="package" size={15} color="#DC2626" />
          <Text style={styles.dangerBtnText}>- Issue / Outward</Text>
        </TouchableOpacity>
      </View>

      {/* Sub-tabs Toggle */}
      <View style={styles.subToggleWrap}>
        <TouchableOpacity
          style={[styles.subToggleBtn, subTab === 'QUANTS' ? styles.subToggleBtnActive : null]}
          onPress={() => setSubTab('QUANTS')}
        >
          <Text style={[styles.subToggleText, subTab === 'QUANTS' ? styles.subToggleTextActive : null]}>
            Live Stock Ledger ({stockLedger.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subToggleBtn, subTab === 'AUDIT' ? styles.subToggleBtnActive : null]}
          onPress={() => setSubTab('AUDIT')}
        >
          <Text style={[styles.subToggleText, subTab === 'AUDIT' ? styles.subToggleTextActive : null]}>
            Movement Audit Trail ({stockMoves.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading stock operations...</Text>
        </View>
      ) : subTab === 'QUANTS' ? (
        <FlatList
          data={stockLedger}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="truck" size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Stock Quants Found</Text>
              <Text style={styles.emptySubtitle}>Tap "+ Inward Stock (GRN)" to receive material into your godown.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.quantCard}>
              <View style={styles.quantHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.quantTitle}>{item.productName}</Text>
                  <Text style={styles.quantSku}>SKU: {item.sku} • Location: {item.warehouseName}</Text>
                </View>
                <View style={styles.quantBadge}>
                  <Text style={styles.quantBadgeText}>
                    {item.qtyOnHand} {item.uomSymbol}
                  </Text>
                </View>
              </View>

              <View style={styles.quantFooter}>
                <Text style={styles.quantSub}>
                  Reserved: <Text style={{ fontWeight: '700' }}>{item.qtyReserved} {item.uomSymbol}</Text>
                </Text>
                <Text style={styles.quantSub}>
                  Available: <Text style={{ fontWeight: '700', color: colors.confirmed }}>{item.qtyAvailable} {item.uomSymbol}</Text>
                </Text>
              </View>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={stockMoves}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="clock" size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Movement History</Text>
              <Text style={styles.emptySubtitle}>All stock additions and deductions are recorded here chronologically.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isInward = item.type === 'INWARD';
            return (
              <View style={styles.moveCard}>
                <View style={styles.moveCardTop}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.moveBadge, isInward ? styles.moveBadgeGreen : styles.moveBadgeRed]}>
                      <Text style={[styles.moveBadgeText, isInward ? styles.moveTextGreen : styles.moveTextRed]}>
                        {isInward ? 'INWARD' : 'OUTWARD'}
                      </Text>
                    </View>
                    <Text style={styles.moveNumber}>{item.moveNumber}</Text>
                  </View>

                  <Text style={[styles.moveQty, isInward ? styles.moveTextGreen : styles.moveTextRed]}>
                    {isInward ? '+' : '-'}{item.qty} {item.uomSymbol}
                  </Text>
                </View>

                <Text style={styles.moveTitle}>{item.productName}</Text>
                <Text style={styles.moveRef}>
                  Ref: {item.referenceNo || 'MANUAL'} • Party: {item.partyName || 'Internal'}
                </Text>
                <Text style={styles.moveDate}>
                  Facility: {item.warehouseName} • {new Date(item.createdAt).toLocaleString()}
                </Text>
              </View>
            );
          }}
        />
      )}

      {/* ================= MODAL: INWARD (GRN) ================= */}
      <Modal visible={inwardModalVisible} animationType="slide" transparent onRequestClose={() => setInwardModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Goods Inward (GRN / Add Stock)</Text>
              <TouchableOpacity onPress={() => setInwardModalVisible(false)}>
                <Icon name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Select Dynamic Product *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {products.map((p) => {
                  const isSel = inwardProduct?.id === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => setInwardProduct(p)}
                      style={[styles.chip, isSel ? styles.chipActive : null]}
                    >
                      <Text style={[styles.chipText, isSel ? styles.chipTextActive : null]}>
                        {p.name} ({p.sku})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {inwardProduct ? (
                <View style={styles.selectedBanner}>
                  <Text style={styles.selectedTitle}>{inwardProduct.name}</Text>
                  <Text style={styles.selectedSub}>
                    Current On-Hand: {inwardProduct.stockOnHand} {inwardProduct.uomSymbol}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.formLabel}>Select Dynamic Destination Godown</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {warehouses.map((w) => (
                  <TouchableOpacity
                    key={w.id}
                    onPress={() => setInwardWhId(w.id)}
                    style={[styles.chip, inwardWhId === w.id ? styles.chipActive : null]}
                  >
                    <Text style={[styles.chipText, inwardWhId === w.id ? styles.chipTextActive : null]}>
                      {w.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.formLabel}>Inward Quantity *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 100"
                keyboardType="numeric"
                value={inwardQty}
                onChangeText={setInwardQty}
              />

              <Text style={styles.formLabel}>Batch / GRN Reference (Optional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. GRN-2026-101"
                value={inwardRef}
                onChangeText={setInwardRef}
              />

              <Text style={styles.formLabel}>Supplier / Source (Optional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Tata Steel BSL"
                value={inwardParty}
                onChangeText={setInwardParty}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button title="Cancel" variant="outline" size="md" onPress={() => setInwardModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Confirm Inward" variant="success" size="md" loading={savingInward} onPress={handleInward} style={{ flex: 1.5, marginLeft: 8 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL: OUTWARD (ISSUE) ================= */}
      <Modal visible={outwardModalVisible} animationType="slide" transparent onRequestClose={() => setOutwardModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Issue Stock (Outward Dispatch)</Text>
              <TouchableOpacity onPress={() => setOutwardModalVisible(false)}>
                <Icon name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Select Dynamic Product *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {products.map((p) => {
                  const isSel = outwardProduct?.id === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => setOutwardProduct(p)}
                      style={[styles.chip, isSel ? styles.chipActive : null]}
                    >
                      <Text style={[styles.chipText, isSel ? styles.chipTextActive : null]}>
                        {p.name} ({p.sku})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {outwardProduct ? (
                <View style={[styles.selectedBanner, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.selectedTitle, { color: '#B91C1C' }]}>{outwardProduct.name}</Text>
                  <Text style={styles.selectedSub}>
                    Available Stock: {outwardProduct.stockOnHand} {outwardProduct.uomSymbol}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.formLabel}>Select Dynamic Source Godown</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {warehouses.map((w) => (
                  <TouchableOpacity
                    key={w.id}
                    onPress={() => setOutwardWhId(w.id)}
                    style={[styles.chip, outwardWhId === w.id ? styles.chipActive : null]}
                  >
                    <Text style={[styles.chipText, outwardWhId === w.id ? styles.chipTextActive : null]}>
                      {w.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.formLabel}>Issue Quantity *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 25"
                keyboardType="numeric"
                value={outwardQty}
                onChangeText={setOutwardQty}
              />

              <Text style={styles.formLabel}>Issue / Dispatch Reference (Optional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. ISSUE-PROD-401"
                value={outwardRef}
                onChangeText={setOutwardRef}
              />

              <Text style={styles.formLabel}>Recipient / Production Line (Optional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Fabrication Line 3"
                value={outwardParty}
                onChangeText={setOutwardParty}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button title="Cancel" variant="outline" size="md" onPress={() => setOutwardModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Deduct Stock" variant="danger" size="md" loading={savingOutward} onPress={handleOutward} style={{ flex: 1.5, marginLeft: 8 }} />
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
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  dangerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  dangerBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  subToggleWrap: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 3,
  },
  subToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  subToggleBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  subToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  subToggleTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  quantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
  },
  quantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  quantTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  quantSku: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  quantBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quantBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  quantFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  quantSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  moveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
  },
  moveCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  moveBadgeGreen: {
    backgroundColor: '#DCFCE7',
  },
  moveBadgeRed: {
    backgroundColor: '#FEE2E2',
  },
  moveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  moveTextGreen: {
    color: '#15803D',
  },
  moveTextRed: {
    color: '#B91C1C',
  },
  moveNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  moveQty: {
    fontSize: 13,
    fontWeight: '800',
  },
  moveTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
  },
  moveRef: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  moveDate: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
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
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  selectedBanner: {
    backgroundColor: colors.primaryMuted,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  selectedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  selectedSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
