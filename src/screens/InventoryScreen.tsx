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
  InventorySummary,
  UomItem,
  ProductCategoryItem,
  CreateProductPayload,
  StockInwardPayload,
} from '../types';
import { Icon } from '../components/Icon';
import { Button } from '../components/Button';
import { colors } from '../theme/colors';

export const InventoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [uoms, setUoms] = useState<UomItem[]>([]);
  const [categories, setCategories] = useState<ProductCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<number | undefined>(undefined);

  // Modals state
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<InventoryProduct | null>(null);

  // New Product Form state
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
  const [savingProduct, setSavingProduct] = useState(false);

  // Stock Inward Form state
  const [inwardQty, setInwardQty] = useState('');
  const [inwardRef, setInwardRef] = useState('');
  const [inwardParty, setInwardParty] = useState('');
  const [savingStock, setSavingStock] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodsData, sumData, uomsData, catsData] = await Promise.all([
        apiService.getInventoryProducts(searchQuery, selectedCatId),
        apiService.getInventorySummary(),
        apiService.getUoms(),
        apiService.getProductCategories(),
      ]);
      setProducts(prodsData);
      setSummary(sumData);
      setUoms(uomsData);
      setCategories(catsData);
      if (catsData.length > 0 && !catId) setCatId(catsData[0].id);
      if (uomsData.length > 0 && !uomId) setUomId(uomsData[0].id);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fetch inventory');
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

  const handleCreateProduct = async () => {
    if (!sku.trim()) {
      Alert.alert('Required', 'Please enter a unique SKU / Item code');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a product title/name');
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
      Alert.alert('Success', `Product "${name}" created with live stock!`);
      setProductModalVisible(false);
      // Reset form
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

  const handleStockInward = async () => {
    if (!selectedProductForStock) return;
    const qty = Number(inwardQty);
    if (!qty || qty <= 0) {
      Alert.alert('Required', 'Please enter a valid quantity greater than 0');
      return;
    }

    setSavingStock(true);
    try {
      const payload: StockInwardPayload = {
        productId: selectedProductForStock.id,
        qty,
        referenceNo: inwardRef.trim() || undefined,
        partyName: inwardParty.trim() || undefined,
      };

      await apiService.stockInward(payload);
      Alert.alert('Stock Added!', `Successfully added +${qty} ${selectedProductForStock.uomSymbol} to Godown.`);
      setStockModalVisible(false);
      setInwardQty('');
      setInwardRef('');
      setInwardParty('');
      await loadData();
    } catch (err: any) {
      Alert.alert('Failed', err.message || 'Could not inward stock');
    } finally {
      setSavingStock(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.headerTitle}>Vendor Inventory</Text>
          <Text style={styles.headerSubtitle}>Zero Odoo Dependency • Standalone DB</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={onRefresh}>
          <Icon name="refresh" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* KPI Stats Bar */}
      {summary ? (
        <View style={styles.kpiContainer}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{summary.totalProducts}</Text>
            <Text style={styles.kpiLabel}>Products</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: colors.confirmed }]}>{summary.totalStockUnits}</Text>
            <Text style={styles.kpiLabel}>Total Units</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: colors.primary }]}>{formatCurrency(summary.inventoryValuation)}</Text>
            <Text style={styles.kpiLabel}>Valuation</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: summary.lowStockCount > 0 ? '#DC2626' : colors.textMuted }]}>
              {summary.lowStockCount}
            </Text>
            <Text style={styles.kpiLabel}>Low Stock</Text>
          </View>
        </View>
      ) : null}

      {/* Action Buttons Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => setProductModalVisible(true)}
          activeOpacity={0.8}
        >
          <Icon name="package" size={15} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>+ New Product</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => {
            if (products.length > 0) {
              setSelectedProductForStock(products[0]);
              setStockModalVisible(true);
            } else {
              Alert.alert('No Products', 'Create a product first before adding stock.');
            }
          }}
          activeOpacity={0.8}
        >
          <Icon name="truck" size={15} color={colors.primary} />
          <Text style={styles.secondaryBtnText}>+ Add Stock (GRN)</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products by SKU or name..."
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

      {/* Category Filter Pills */}
      <View style={styles.catTabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catTabsList}>
          <TouchableOpacity
            onPress={() => setSelectedCatId(undefined)}
            style={[styles.catPill, selectedCatId === undefined ? styles.catPillActive : null]}
          >
            <Text style={[styles.catPillText, selectedCatId === undefined ? styles.catPillTextActive : null]}>
              All Categories
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => {
            const isSelected = selectedCatId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCatId(cat.id)}
                style={[styles.catPill, isSelected ? styles.catPillActive : null]}
              >
                <Text style={[styles.catPillText, isSelected ? styles.catPillTextActive : null]}>
                  {cat.name}
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
          <Text style={styles.loadingText}>Loading products from standalone DB...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="package" size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Products Found</Text>
              <Text style={styles.emptySubtitle}>Tap "+ New Product" above to create your first inventory item.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isLowStock = item.stockStatus === 'LOW_STOCK';
            const isOutOfStock = item.stockStatus === 'OUT_OF_STOCK';

            return (
              <View style={styles.productCard}>
                <View style={styles.cardTopRow}>
                  <View style={{ flex: 1 }}>
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
                    <Text style={styles.tagPillText}>{item.categoryName}</Text>
                  </View>
                  <View style={styles.tagPill}>
                    <Text style={styles.tagPillText}>GST: {item.taxRate}%</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardBottomRow}>
                  <View>
                    <Text style={styles.priceSubtext}>Cost: {formatCurrency(item.costPrice)}</Text>
                    <Text style={styles.priceBold}>Sale: {formatCurrency(item.salePrice)}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.addStockMiniBtn}
                    onPress={() => {
                      setSelectedProductForStock(item);
                      setStockModalVisible(true);
                    }}
                  >
                    <Icon name="truck" size={13} color={colors.primary} />
                    <Text style={styles.addStockMiniText}>+ Stock</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* ================= MODAL: CREATE PRODUCT ================= */}
      <Modal visible={productModalVisible} animationType="slide" transparent onRequestClose={() => setProductModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Product Master</Text>
              <TouchableOpacity onPress={() => setProductModalVisible(false)}>
                <Icon name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>SKU / Item Code *</Text>
              <TextInput style={styles.formInput} placeholder="e.g. BLT-SS-M8" value={sku} onChangeText={setSku} autoCapitalize="characters" />

              <Text style={styles.formLabel}>Product Name *</Text>
              <TextInput style={styles.formInput} placeholder="e.g. Stainless Steel Hex Bolt M8x50" value={name} onChangeText={setName} />

              <Text style={styles.formLabel}>Product Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setCatId(c.id)}
                    style={[styles.selectChip, catId === c.id ? styles.selectChipActive : null]}
                  >
                    <Text style={[styles.selectChipText, catId === c.id ? styles.selectChipTextActive : null]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.formLabel}>Unit of Measure (UOM) *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {uoms.map((u) => (
                  <TouchableOpacity
                    key={u.id}
                    onPress={() => setUomId(u.id)}
                    style={[styles.selectChip, uomId === u.id ? styles.selectChipActive : null]}
                  >
                    <Text style={[styles.selectChipText, uomId === u.id ? styles.selectChipTextActive : null]}>
                      {u.name} ({u.symbol})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.twoCol}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.formLabel}>HSN Code</Text>
                  <TextInput style={styles.formInput} placeholder="73181500" value={hsnCode} onChangeText={setHsnCode} />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.formLabel}>GST Rate (%)</Text>
                  <TextInput style={styles.formInput} placeholder="18" keyboardType="numeric" value={taxRate} onChangeText={setTaxRate} />
                </View>
              </View>

              <View style={styles.twoCol}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.formLabel}>Purchase Cost (₹)</Text>
                  <TextInput style={styles.formInput} placeholder="0.00" keyboardType="numeric" value={costPrice} onChangeText={setCostPrice} />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.formLabel}>Selling Price (₹)</Text>
                  <TextInput style={styles.formInput} placeholder="0.00" keyboardType="numeric" value={salePrice} onChangeText={setSalePrice} />
                </View>
              </View>

              <View style={styles.twoCol}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.formLabel}>Min Stock Alert</Text>
                  <TextInput style={styles.formInput} placeholder="20" keyboardType="numeric" value={minStockAlert} onChangeText={setMinStockAlert} />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.formLabel}>Opening Stock Qty</Text>
                  <TextInput style={styles.formInput} placeholder="500" keyboardType="numeric" value={initialStock} onChangeText={setInitialStock} />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button title="Cancel" variant="outline" size="md" onPress={() => setProductModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Save Product" variant="primary" size="md" loading={savingProduct} onPress={handleCreateProduct} style={{ flex: 1.5, marginLeft: 8 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL: STOCK INWARD (GRN) ================= */}
      <Modal visible={stockModalVisible} animationType="slide" transparent onRequestClose={() => setStockModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Goods Inward (Add Stock)</Text>
              <TouchableOpacity onPress={() => setStockModalVisible(false)}>
                <Icon name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {selectedProductForStock ? (
                <View style={styles.selectedProdBanner}>
                  <Text style={styles.selectedProdTitle}>{selectedProductForStock.name}</Text>
                  <Text style={styles.selectedProdSub}>
                    SKU: {selectedProductForStock.sku} • Current On-Hand: {selectedProductForStock.stockOnHand} {selectedProductForStock.uomSymbol}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.formLabel}>Inward Quantity *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 200"
                keyboardType="numeric"
                value={inwardQty}
                onChangeText={setInwardQty}
              />

              <Text style={styles.formLabel}>Batch / Purchase / GRN Ref (Optional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. GRN/2026/089"
                value={inwardRef}
                onChangeText={setInwardRef}
              />

              <Text style={styles.formLabel}>Supplier / Source (Optional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Jindal Steel Ltd"
                value={inwardParty}
                onChangeText={setInwardParty}
              />
            </View>

            <View style={styles.modalFooter}>
              <Button title="Cancel" variant="outline" size="md" onPress={() => setStockModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Confirm Inward" variant="success" size="md" loading={savingStock} iconName="check-circle" onPress={handleStockInward} style={{ flex: 1.5, marginLeft: 8 }} />
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  kpiContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  kpiCard: {
    flex: 1,
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  kpiLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
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
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTopRow: {
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
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceSubtext: {
    fontSize: 11,
    color: colors.textMuted,
  },
  priceBold: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 1,
  },
  addStockMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addStockMiniText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
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
  twoCol: {
    flexDirection: 'row',
  },
  selectChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  selectChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  selectChipTextActive: {
    color: '#FFFFFF',
  },
  selectedProdBanner: {
    backgroundColor: colors.primaryMuted,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  selectedProdTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  selectedProdSub: {
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
