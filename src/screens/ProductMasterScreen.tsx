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
  InventoryProduct,
  UomItem,
  ProductCategoryItem,
  WarehouseItem,
  CreateProductPayload,
  StockInwardPayload,
  StockOutwardPayload,
} from '../types';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { Button } from '../components/Button';
import { colors } from '../theme/colors';

export const ProductMasterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [categories, setCategories] = useState<ProductCategoryItem[]>([]);
  const [uoms, setUoms] = useState<UomItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<number | undefined>(undefined);

  // Modals
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [inwardModalVisible, setInwardModalVisible] = useState(false);
  const [outwardModalVisible, setOutwardModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);

  // Form: Create Product
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [catId, setCatId] = useState<number>(1);
  const [uomId, setUomId] = useState<number>(1);
  const [hsnCode, setHsnCode] = useState('73181500');
  const [taxRate, setTaxRate] = useState('18');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [minStockAlert, setMinStockAlert] = useState('20');
  const [initialStock, setInitialStock] = useState('');
  const [warehouseId, setWarehouseId] = useState<number>(1);
  const [savingProduct, setSavingProduct] = useState(false);

  // Form: Quick Inward
  const [inwardQty, setInwardQty] = useState('');
  const [inwardRef, setInwardRef] = useState('');
  const [inwardParty, setInwardParty] = useState('');
  const [savingInward, setSavingInward] = useState(false);

  // Form: Quick Outward
  const [outwardQty, setOutwardQty] = useState('');
  const [outwardRef, setOutwardRef] = useState('');
  const [outwardParty, setOutwardParty] = useState('');
  const [savingOutward, setSavingOutward] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodsData, catsData, uomsData, whData] = await Promise.all([
        apiService.getInventoryProducts(searchQuery, selectedCatId).catch(() => []),
        apiService.getProductCategories().catch(() => []),
        apiService.getUoms().catch(() => []),
        apiService.getWarehouses().catch(() => []),
      ]);

      setProducts(prodsData);
      setCategories(catsData);
      setUoms(uomsData);
      setWarehouses(whData);

      if (catsData.length > 0 && !catId) setCatId(catsData[0].id);
      if (uomsData.length > 0 && !uomId) setUomId(uomsData[0].id);
      if (whData.length > 0 && !warehouseId) setWarehouseId(whData[0].id);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCatId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);

  const handleCreateProduct = async () => {
    if (!sku.trim()) {
      Alert.alert('Required', 'Please enter unique SKU code');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter product name');
      return;
    }

    setSavingProduct(true);
    try {
      const payload: CreateProductPayload = {
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || undefined,
        categoryId: catId,
        uomId: uomId,
        hsnCode: hsnCode.trim() || 'N/A',
        taxRate: Number(taxRate) || 0,
        costPrice: Number(costPrice) || 0,
        salePrice: Number(salePrice) || 0,
        minStockAlert: Number(minStockAlert) || 10,
        initialStock: Number(initialStock) || 0,
      };

      await apiService.createInventoryProduct(payload);
      Alert.alert('Success', `Product "${name}" successfully registered!`);
      setCreateModalVisible(false);
      setSku('');
      setName('');
      setDescription('');
      setCostPrice('');
      setSalePrice('');
      setInitialStock('');
      await loadData();
    } catch (err: any) {
      Alert.alert('Failed', err.message || 'Could not create product');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleInward = async () => {
    if (!selectedProduct) return;
    const qty = Number(inwardQty);
    if (!qty || qty <= 0) {
      Alert.alert('Required', 'Please enter valid quantity');
      return;
    }

    setSavingInward(true);
    try {
      const payload: StockInwardPayload = {
        productId: selectedProduct.id,
        warehouseId: warehouseId,
        qty,
        referenceNo: inwardRef.trim() || undefined,
        partyName: inwardParty.trim() || undefined,
      };
      await apiService.stockInward(payload);
      Alert.alert('Stock Added', `+${qty} ${selectedProduct.uomSymbol} added to warehouse.`);
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
    if (!selectedProduct) return;
    const qty = Number(outwardQty);
    if (!qty || qty <= 0) {
      Alert.alert('Required', 'Please enter valid quantity');
      return;
    }

    setSavingOutward(true);
    try {
      const payload: StockOutwardPayload = {
        productId: selectedProduct.id,
        warehouseId: warehouseId,
        qty,
        referenceNo: outwardRef.trim() || undefined,
        partyName: outwardParty.trim() || undefined,
      };
      await apiService.stockOutward(payload);
      Alert.alert('Stock Issued', `-${qty} ${selectedProduct.uomSymbol} issued.`);
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
        title="Product Master"
        subtitle={`${products.length} Products in Catalog • Dynamic Master`}
        showBack={true}
        onBack={() => navigation.goBack()}
        rightIcon="refresh"
        onRightPress={onRefresh}
      />

      {/* Top Action Bar */}
      <View style={styles.topActionBar}>
        <TouchableOpacity
          style={styles.createMasterBtn}
          onPress={() => setCreateModalVisible(true)}
          activeOpacity={0.8}
        >
          <Icon name="package" size={16} color="#FFFFFF" />
          <Text style={styles.createMasterBtnText}>+ Add New Product Master</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search SKU, item name or HSN code..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category Pills Filter */}
      <View style={styles.catTabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catTabsList}>
          <TouchableOpacity
            onPress={() => setSelectedCatId(undefined)}
            style={[styles.catPill, selectedCatId === undefined ? styles.catPillActive : null]}
          >
            <Text style={[styles.catPillText, selectedCatId === undefined ? styles.catPillTextActive : null]}>
              All ({products.length})
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => {
            const isSel = selectedCatId === cat.id;
            const count = products.filter((p) => p.categoryId === cat.id).length;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCatId(cat.id)}
                style={[styles.catPill, isSel ? styles.catPillActive : null]}
              >
                <Text style={[styles.catPillText, isSel ? styles.catPillTextActive : null]}>
                  {cat.name} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Product List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="package" size={44} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Products Found</Text>
              <Text style={styles.emptySubtitle}>Tap "+ Add New Product Master" to create your first dynamic inventory item.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isLowStock = item.stockStatus === 'LOW_STOCK';
            const isOutOfStock = item.stockStatus === 'OUT_OF_STOCK';

            return (
              <View style={styles.productCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.productTitle}>{item.name}</Text>
                    <Text style={styles.productSku}>SKU: {item.sku} • HSN: {item.hsnCode}</Text>
                  </View>
                  <View
                    style={[
                      styles.stockBadge,
                      isOutOfStock ? styles.stockBadgeRed : isLowStock ? styles.stockBadgeAmber : styles.stockBadgeGreen,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stockBadgeText,
                        isOutOfStock ? styles.stockTextRed : isLowStock ? styles.stockTextAmber : styles.stockTextGreen,
                      ]}
                    >
                      {item.stockOnHand} {item.uomSymbol}
                    </Text>
                  </View>
                </View>

                <View style={styles.tagsRow}>
                  <View style={styles.tagPill}>
                    <Text style={styles.tagPillText}>Category: {item.categoryName}</Text>
                  </View>
                  <View style={styles.tagPill}>
                    <Text style={styles.tagPillText}>GST: {item.taxRate}%</Text>
                  </View>
                  <View style={styles.tagPill}>
                    <Text style={styles.tagPillText}>Min Alert: {item.minStockAlert}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.costText}>Cost: {formatCurrency(item.costPrice)}</Text>
                    <Text style={styles.salePriceText}>Sale Price: {formatCurrency(item.salePrice)}</Text>
                  </View>

                  <View style={styles.actionBtnsWrap}>
                    <TouchableOpacity
                      style={styles.inwardBtn}
                      onPress={() => {
                        setSelectedProduct(item);
                        setInwardModalVisible(true);
                      }}
                    >
                      <Icon name="truck" size={13} color={colors.primary} />
                      <Text style={styles.inwardBtnText}>+ Inward</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.outwardBtn}
                      onPress={() => {
                        setSelectedProduct(item);
                        setOutwardModalVisible(true);
                      }}
                    >
                      <Icon name="package" size={13} color="#DC2626" />
                      <Text style={styles.outwardBtnText}>- Issue</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* ================= MODAL: CREATE PRODUCT MASTER ================= */}
      <Modal visible={createModalVisible} animationType="slide" transparent onRequestClose={() => setCreateModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Product Master</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Icon name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Item SKU Code *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. MTR-IND-3HP"
                value={sku}
                onChangeText={setSku}
                autoCapitalize="characters"
              />

              <Text style={styles.formLabel}>Product Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 3-Phase Induction Motor 3HP"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.formLabel}>Select Dynamic Product Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setCatId(c.id)}
                    style={[styles.chip, catId === c.id ? styles.chipActive : null]}
                  >
                    <Text style={[styles.chipText, catId === c.id ? styles.chipTextActive : null]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.formLabel}>Select Dynamic Unit of Measure (UOM) *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {uoms.map((u) => (
                  <TouchableOpacity
                    key={u.id}
                    onPress={() => setUomId(u.id)}
                    style={[styles.chip, uomId === u.id ? styles.chipActive : null]}
                  >
                    <Text style={[styles.chipText, uomId === u.id ? styles.chipTextActive : null]}>
                      {u.name} ({u.symbol})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.formLabel}>HSN / SAC Code</Text>
                  <TextInput style={styles.formInput} placeholder="85015210" value={hsnCode} onChangeText={setHsnCode} />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.formLabel}>GST Rate (%)</Text>
                  <TextInput style={styles.formInput} placeholder="18" keyboardType="numeric" value={taxRate} onChangeText={setTaxRate} />
                </View>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.formLabel}>Purchase Cost (₹)</Text>
                  <TextInput style={styles.formInput} placeholder="0.00" keyboardType="numeric" value={costPrice} onChangeText={setCostPrice} />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.formLabel}>Selling Price (₹)</Text>
                  <TextInput style={styles.formInput} placeholder="0.00" keyboardType="numeric" value={salePrice} onChangeText={setSalePrice} />
                </View>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.formLabel}>Min Stock Alert</Text>
                  <TextInput style={styles.formInput} placeholder="20" keyboardType="numeric" value={minStockAlert} onChangeText={setMinStockAlert} />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.formLabel}>Opening Stock Qty</Text>
                  <TextInput style={styles.formInput} placeholder="0" keyboardType="numeric" value={initialStock} onChangeText={setInitialStock} />
                </View>
              </View>

              <Text style={styles.formLabel}>Description (Optional)</Text>
              <TextInput style={styles.formInput} placeholder="Detailed product specifications..." value={description} onChangeText={setDescription} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button title="Cancel" variant="outline" size="md" onPress={() => setCreateModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Save Product" variant="primary" size="md" loading={savingProduct} onPress={handleCreateProduct} style={{ flex: 1.5, marginLeft: 8 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL: QUICK INWARD ================= */}
      <Modal visible={inwardModalVisible} animationType="slide" transparent onRequestClose={() => setInwardModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Goods Inward (GRN)</Text>
              <TouchableOpacity onPress={() => setInwardModalVisible(false)}>
                <Icon name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {selectedProduct ? (
                <View style={styles.selectedBanner}>
                  <Text style={styles.selectedTitle}>{selectedProduct.name}</Text>
                  <Text style={styles.selectedSub}>
                    Current On-Hand: {selectedProduct.stockOnHand} {selectedProduct.uomSymbol}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.formLabel}>Inward Quantity *</Text>
              <TextInput style={styles.formInput} placeholder="e.g. 50" keyboardType="numeric" value={inwardQty} onChangeText={setInwardQty} />

              <Text style={styles.formLabel}>Batch / GRN Reference</Text>
              <TextInput style={styles.formInput} placeholder="e.g. GRN-2026-99" value={inwardRef} onChangeText={setInwardRef} />

              <Text style={styles.formLabel}>Supplier / Source</Text>
              <TextInput style={styles.formInput} placeholder="e.g. Jindal Steel Ltd" value={inwardParty} onChangeText={setInwardParty} />
            </View>

            <View style={styles.modalFooter}>
              <Button title="Cancel" variant="outline" size="md" onPress={() => setInwardModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Add Stock" variant="success" size="md" loading={savingInward} onPress={handleInward} style={{ flex: 1.5, marginLeft: 8 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL: QUICK OUTWARD ================= */}
      <Modal visible={outwardModalVisible} animationType="slide" transparent onRequestClose={() => setOutwardModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Issue Stock (Outward)</Text>
              <TouchableOpacity onPress={() => setOutwardModalVisible(false)}>
                <Icon name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {selectedProduct ? (
                <View style={[styles.selectedBanner, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.selectedTitle, { color: '#B91C1C' }]}>{selectedProduct.name}</Text>
                  <Text style={styles.selectedSub}>
                    Available: {selectedProduct.stockOnHand} {selectedProduct.uomSymbol}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.formLabel}>Issue Quantity *</Text>
              <TextInput style={styles.formInput} placeholder="e.g. 10" keyboardType="numeric" value={outwardQty} onChangeText={setOutwardQty} />

              <Text style={styles.formLabel}>Issue / Job Order Reference</Text>
              <TextInput style={styles.formInput} placeholder="e.g. ISSUE-PROD-01" value={outwardRef} onChangeText={setOutwardRef} />

              <Text style={styles.formLabel}>Recipient / Destination</Text>
              <TextInput style={styles.formInput} placeholder="e.g. Line 2 Assembly" value={outwardParty} onChangeText={setOutwardParty} />
            </View>

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
  topActionBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  createMasterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 11,
    borderRadius: 10,
  },
  createMasterBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    marginLeft: 8,
  },
  catTabsWrap: {
    marginTop: 10,
  },
  catTabsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  catPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  productSku: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockBadgeGreen: {
    backgroundColor: '#DCFCE7',
  },
  stockBadgeAmber: {
    backgroundColor: '#FEF3C7',
  },
  stockBadgeRed: {
    backgroundColor: '#FEE2E2',
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  stockTextGreen: {
    color: '#15803D',
  },
  stockTextAmber: {
    color: '#B45309',
  },
  stockTextRed: {
    color: '#B91C1C',
  },
  tagsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 6,
  },
  tagPill: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagPillText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.surface,
    marginVertical: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  salePriceText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 1,
  },
  actionBtnsWrap: {
    flexDirection: 'row',
    gap: 6,
  },
  inwardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  inwardBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 4,
  },
  outwardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  outwardBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    marginLeft: 4,
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
  row: {
    flexDirection: 'row',
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
