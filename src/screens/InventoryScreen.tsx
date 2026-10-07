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
  Switch,
} from 'react-native';
import { apiService } from '../services/api';
import {
  InventoryProduct,
  InventorySummary,
  UomCategoryItem,
  UomItem,
  ProductCategoryItem,
  WarehouseItem,
  StockQuantItem,
  StockMoveItem,
  CreateProductPayload,
  StockInwardPayload,
  StockOutwardPayload,
  CreateUomCategoryPayload,
  CreateUomPayload,
  CreateProductCategoryPayload,
  CreateWarehousePayload,
} from '../types';
import { Icon } from '../components/Icon';
import { Button } from '../components/Button';
import { colors } from '../theme/colors';

type TabType = 'PRODUCTS' | 'UOM' | 'CATEGORIES' | 'WAREHOUSES' | 'LEDGER';

export const InventoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  // Navigation & Segmented Tabs
  const [activeTab, setActiveTab] = useState<TabType>('PRODUCTS');
  const [ledgerSubTab, setLedgerSubTab] = useState<'QUANTS' | 'AUDIT'>('QUANTS');

  // Master Data State
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [uomCategories, setUomCategories] = useState<UomCategoryItem[]>([]);
  const [uoms, setUoms] = useState<UomItem[]>([]);
  const [categories, setCategories] = useState<ProductCategoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [stockLedger, setStockLedger] = useState<StockQuantItem[]>([]);
  const [stockMoves, setStockMoves] = useState<StockMoveItem[]>([]);

  // Loading & Filtering
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<number | undefined>(undefined);
  const [selectedUomCatFilter, setSelectedUomCatFilter] = useState<number | undefined>(undefined);

  // Modal Visibility State
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [uomCategoryModalVisible, setUomCategoryModalVisible] = useState(false);
  const [uomModalVisible, setUomModalVisible] = useState(false);
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [whModalVisible, setWhModalVisible] = useState(false);
  const [inwardModalVisible, setInwardModalVisible] = useState(false);
  const [outwardModalVisible, setOutwardModalVisible] = useState(false);

  // Saving States
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingUomCat, setSavingUomCat] = useState(false);
  const [savingUom, setSavingUom] = useState(false);
  const [savingCat, setSavingCat] = useState(false);
  const [savingWh, setSavingWh] = useState(false);
  const [savingInward, setSavingInward] = useState(false);
  const [savingOutward, setSavingOutward] = useState(false);

  // 1. Form: New Product
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
  const [productWhId, setProductWhId] = useState<number>(1);

  // 2. Form: New UOM Category
  const [uomCatName, setUomCatName] = useState('');
  const [uomCatDesc, setUomCatDesc] = useState('');

  // 3. Form: New Unit of Measure (UOM)
  const [uomParentCatId, setUomParentCatId] = useState<number>(1);
  const [uomName, setUomName] = useState('');
  const [uomSymbol, setUomSymbol] = useState('');
  const [uomRatio, setUomRatio] = useState('1');
  const [uomIsBase, setUomIsBase] = useState(false);

  // 4. Form: New Product Category
  const [prodCatName, setProdCatName] = useState('');
  const [prodCatCode, setProdCatCode] = useState('');
  const [prodCatDesc, setProdCatDesc] = useState('');

  // 5. Form: New Warehouse
  const [whName, setWhName] = useState('');
  const [whCode, setWhCode] = useState('');
  const [whAddress, setWhAddress] = useState('');
  const [whIsDefault, setWhIsDefault] = useState(false);

  // 6. Form: Stock Inward
  const [selectedInwardProduct, setSelectedInwardProduct] = useState<InventoryProduct | null>(null);
  const [inwardWhId, setInwardWhId] = useState<number>(1);
  const [inwardQty, setInwardQty] = useState('');
  const [inwardRef, setInwardRef] = useState('');
  const [inwardParty, setInwardParty] = useState('');
  const [inwardRemarks, setInwardRemarks] = useState('');

  // 7. Form: Stock Outward
  const [selectedOutwardProduct, setSelectedOutwardProduct] = useState<InventoryProduct | null>(null);
  const [outwardWhId, setOutwardWhId] = useState<number>(1);
  const [outwardQty, setOutwardQty] = useState('');
  const [outwardRef, setOutwardRef] = useState('');
  const [outwardParty, setOutwardParty] = useState('');
  const [outwardRemarks, setOutwardRemarks] = useState('');

  // Data Loading Function
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        prodsData,
        sumData,
        uomCatsData,
        uomsData,
        catsData,
        whData,
        ledgerData,
        movesData,
      ] = await Promise.all([
        apiService.getInventoryProducts(searchQuery, selectedCatId).catch(() => []),
        apiService.getInventorySummary().catch(() => null),
        apiService.getUomCategories().catch(() => []),
        apiService.getUoms().catch(() => []),
        apiService.getProductCategories().catch(() => []),
        apiService.getWarehouses().catch(() => []),
        apiService.getStockLedger().catch(() => []),
        apiService.getStockMoves().catch(() => []),
      ]);

      setProducts(prodsData);
      setSummary(sumData);
      setUomCategories(uomCatsData);
      setUoms(uomsData);
      setCategories(catsData);
      setWarehouses(whData);
      setStockLedger(ledgerData);
      setStockMoves(movesData);

      // Seed defaults for form selectors
      if (catsData.length > 0 && !catId) setCatId(catsData[0].id);
      if (uomsData.length > 0 && !uomId) setUomId(uomsData[0].id);
      if (uomCatsData.length > 0 && !uomParentCatId) setUomParentCatId(uomCatsData[0].id);
      if (whData.length > 0 && !productWhId) {
        const def = whData.find((w: WarehouseItem) => w.isDefault) || whData[0];
        setProductWhId(def.id);
        setInwardWhId(def.id);
        setOutwardWhId(def.id);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fetch inventory data');
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

  // ================= SUBMISSION HANDLERS =================

  // 1. Create Product
  const handleCreateProduct = async () => {
    if (!sku.trim()) {
      Alert.alert('Validation Error', 'Please enter a unique SKU / Item code');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a product title/name');
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
      setProductModalVisible(false);
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

  // 2. Create UOM Category
  const handleCreateUomCategory = async () => {
    if (!uomCatName.trim()) {
      Alert.alert('Validation Error', 'Please enter UOM Category name (e.g. Weight, Length)');
      return;
    }

    setSavingUomCat(true);
    try {
      const payload: CreateUomCategoryPayload = {
        name: uomCatName.trim(),
        description: uomCatDesc.trim() || undefined,
      };
      await apiService.createUomCategory(payload);
      Alert.alert('Success', `UOM Category "${uomCatName}" created!`);
      setUomCategoryModalVisible(false);
      setUomCatName('');
      setUomCatDesc('');
      await loadData();
    } catch (err: any) {
      Alert.alert('Failed', err.message || 'Could not create UOM category');
    } finally {
      setSavingUomCat(false);
    }
  };

  // 3. Create Unit of Measure (UOM)
  const handleCreateUom = async () => {
    if (!uomName.trim()) {
      Alert.alert('Validation Error', 'Please enter UOM Name (e.g. Kilogram, Box 50 Pcs)');
      return;
    }
    if (!uomSymbol.trim()) {
      Alert.alert('Validation Error', 'Please enter UOM Symbol (e.g. Kg, Box)');
      return;
    }

    setSavingUom(true);
    try {
      const payload: CreateUomPayload = {
        categoryId: uomParentCatId,
        name: uomName.trim(),
        symbol: uomSymbol.trim(),
        ratio: Number(uomRatio) || 1,
        isBaseUnit: uomIsBase,
      };
      await apiService.createUom(payload);
      Alert.alert('Success', `Unit of Measure "${uomName}" created!`);
      setUomModalVisible(false);
      setUomName('');
      setUomSymbol('');
      setUomRatio('1');
      setUomIsBase(false);
      await loadData();
    } catch (err: any) {
      Alert.alert('Failed', err.message || 'Could not create unit of measure');
    } finally {
      setSavingUom(false);
    }
  };

  // 4. Create Product Category
  const handleCreateProductCategory = async () => {
    if (!prodCatName.trim()) {
      Alert.alert('Validation Error', 'Please enter Category Name');
      return;
    }

    setSavingCat(true);
    try {
      const payload: CreateProductCategoryPayload = {
        name: prodCatName.trim(),
        code: prodCatCode.trim() || undefined,
        description: prodCatDesc.trim() || undefined,
      };
      await apiService.createProductCategory(payload);
      Alert.alert('Success', `Product Category "${prodCatName}" created!`);
      setCatModalVisible(false);
      setProdCatName('');
      setProdCatCode('');
      setProdCatDesc('');
      await loadData();
    } catch (err: any) {
      Alert.alert('Failed', err.message || 'Could not create category');
    } finally {
      setSavingCat(false);
    }
  };

  // 5. Create Warehouse
  const handleCreateWarehouse = async () => {
    if (!whName.trim()) {
      Alert.alert('Validation Error', 'Please enter Warehouse Name');
      return;
    }
    if (!whCode.trim()) {
      Alert.alert('Validation Error', 'Please enter Warehouse Code (e.g. WH-NORTH)');
      return;
    }

    setSavingWh(true);
    try {
      const payload: CreateWarehousePayload = {
        name: whName.trim(),
        code: whCode.trim().toUpperCase(),
        address: whAddress.trim() || undefined,
        isDefault: whIsDefault,
      };
      await apiService.createWarehouse(payload);
      Alert.alert('Success', `Warehouse "${whName}" registered!`);
      setWhModalVisible(false);
      setWhName('');
      setWhCode('');
      setWhAddress('');
      setWhIsDefault(false);
      await loadData();
    } catch (err: any) {
      Alert.alert('Failed', err.message || 'Could not create warehouse');
    } finally {
      setSavingWh(false);
    }
  };

  // 6. Stock Inward (GRN)
  const handleStockInward = async () => {
    if (!selectedInwardProduct) {
      Alert.alert('Validation Error', 'Please select a product');
      return;
    }
    const qty = Number(inwardQty);
    if (!qty || qty <= 0) {
      Alert.alert('Validation Error', 'Please enter inward quantity greater than 0');
      return;
    }

    setSavingInward(true);
    try {
      const payload: StockInwardPayload = {
        productId: selectedInwardProduct.id,
        warehouseId: inwardWhId,
        qty,
        referenceNo: inwardRef.trim() || undefined,
        partyName: inwardParty.trim() || undefined,
        remarks: inwardRemarks.trim() || undefined,
      };
      await apiService.stockInward(payload);
      Alert.alert('Stock Added!', `Successfully inwarded +${qty} ${selectedInwardProduct.uomSymbol}.`);
      setInwardModalVisible(false);
      setInwardQty('');
      setInwardRef('');
      setInwardParty('');
      setInwardRemarks('');
      await loadData();
    } catch (err: any) {
      Alert.alert('Failed', err.message || 'Could not inward stock');
    } finally {
      setSavingInward(false);
    }
  };

  // 7. Stock Outward (Issue / Dispatch)
  const handleStockOutward = async () => {
    if (!selectedOutwardProduct) {
      Alert.alert('Validation Error', 'Please select a product');
      return;
    }
    const qty = Number(outwardQty);
    if (!qty || qty <= 0) {
      Alert.alert('Validation Error', 'Please enter outward quantity greater than 0');
      return;
    }

    setSavingOutward(true);
    try {
      const payload: StockOutwardPayload = {
        productId: selectedOutwardProduct.id,
        warehouseId: outwardWhId,
        qty,
        referenceNo: outwardRef.trim() || undefined,
        partyName: outwardParty.trim() || undefined,
        remarks: outwardRemarks.trim() || undefined,
      };
      await apiService.stockOutward(payload);
      Alert.alert('Stock Deducted!', `Successfully issued -${qty} ${selectedOutwardProduct.uomSymbol}.`);
      setOutwardModalVisible(false);
      setOutwardQty('');
      setOutwardRef('');
      setOutwardParty('');
      setOutwardRemarks('');
      await loadData();
    } catch (err: any) {
      Alert.alert('Failed', err.message || 'Could not deduct stock');
    } finally {
      setSavingOutward(false);
    }
  };

  // ================= VIEW RENDERERS =================

  // Tab 1: Products View
  const renderProductsView = () => (
    <View style={{ flex: 1 }}>
      {/* Top Action Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => setProductModalVisible(true)}
          activeOpacity={0.8}
        >
          <Icon name="package" size={15} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>+ New Product Master</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => {
            if (products.length > 0) {
              setSelectedInwardProduct(products[0]);
              setInwardModalVisible(true);
            } else {
              Alert.alert('No Products', 'Create a product first before recording GRN.');
            }
          }}
          activeOpacity={0.8}
        >
          <Icon name="truck" size={15} color={colors.primary} />
          <Text style={styles.secondaryBtnText}>+ Inward (GRN)</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products by SKU, name or HSN..."
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
              All Categories ({products.length})
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => {
            const isSelected = selectedCatId === cat.id;
            const count = products.filter((p) => p.categoryId === cat.id).length;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCatId(cat.id)}
                style={[styles.catPill, isSelected ? styles.catPillActive : null]}
              >
                <Text style={[styles.catPillText, isSelected ? styles.catPillTextActive : null]}>
                  {cat.name} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Products FlatList */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="package" size={40} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Products Found</Text>
            <Text style={styles.emptySubtitle}>Tap "+ New Product Master" above to create an item in your standalone database.</Text>
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
                <View style={styles.tagPill}>
                  <Text style={styles.tagPillText}>Min Alert: {item.minStockAlert}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.cardBottomRow}>
                <View>
                  <Text style={styles.priceSubtext}>Cost: {formatCurrency(item.costPrice)}</Text>
                  <Text style={styles.priceBold}>Sale: {formatCurrency(item.salePrice)}</Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    style={styles.addStockMiniBtn}
                    onPress={() => {
                      setSelectedInwardProduct(item);
                      setInwardModalVisible(true);
                    }}
                  >
                    <Icon name="truck" size={12} color={colors.primary} />
                    <Text style={styles.addStockMiniText}>+ Inward</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.issueStockMiniBtn}
                    onPress={() => {
                      setSelectedOutwardProduct(item);
                      setOutwardModalVisible(true);
                    }}
                  >
                    <Icon name="package" size={12} color="#DC2626" />
                    <Text style={styles.issueStockMiniText}>- Issue</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );

  // Tab 2: UOM & UOM Category Master View
  const renderUomView = () => {
    const filteredUoms = selectedUomCatFilter
      ? uoms.filter((u) => u.categoryId === selectedUomCatFilter)
      : uoms;

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Top Action Row */}
        <View style={styles.actionRowInside}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setUomCategoryModalVisible(true)}
            activeOpacity={0.8}
          >
            <Icon name="filter" size={14} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>+ Add UOM Category</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => setUomModalVisible(true)}
            activeOpacity={0.8}
          >
            <Icon name="package" size={14} color={colors.primary} />
            <Text style={styles.secondaryBtnText}>+ Add Unit (UOM)</Text>
          </TouchableOpacity>
        </View>

        {/* Section 1: UOM Categories */}
        <Text style={styles.sectionHeaderTitle}>1. UOM Categories ({uomCategories.length})</Text>
        <Text style={styles.sectionHeaderSubtitle}>Base measurement classes grouping interchangeable units</Text>

        <View style={styles.gridContainer}>
          {uomCategories.map((cat) => {
            const unitCount = uoms.filter((u) => u.categoryId === cat.id).length;
            const isSelected = selectedUomCatFilter === cat.id;

            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() =>
                  setSelectedUomCatFilter(isSelected ? undefined : cat.id)
                }
                style={[styles.uomCatCard, isSelected ? styles.uomCatCardActive : null]}
              >
                <View style={styles.uomCatHeader}>
                  <Text style={[styles.uomCatTitle, isSelected ? styles.uomCatTitleActive : null]}>{cat.name}</Text>
                  <View style={styles.badgeSmall}>
                    <Text style={styles.badgeSmallText}>{unitCount} Units</Text>
                  </View>
                </View>
                <Text style={styles.uomCatDesc} numberOfLines={2}>
                  {cat.description || 'No description provided'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Section 2: Units of Measure */}
        <View style={{ marginTop: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.sectionHeaderTitle}>
              2. Units of Measure ({filteredUoms.length})
            </Text>
            {selectedUomCatFilter ? (
              <TouchableOpacity onPress={() => setSelectedUomCatFilter(undefined)}>
                <Text style={styles.clearFilterText}>Show All Units</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <Text style={styles.sectionHeaderSubtitle}>Defined units with conversion ratios & base unit flags</Text>

          {filteredUoms.map((unit) => (
            <View key={unit.id} style={styles.uomItemCard}>
              <View style={styles.uomItemLeft}>
                <View style={styles.uomSymbolBox}>
                  <Text style={styles.uomSymbolText}>{unit.symbol}</Text>
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.uomItemName}>{unit.name}</Text>
                  <Text style={styles.uomItemCategory}>Category: {unit.categoryName}</Text>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                {unit.isBaseUnit ? (
                  <View style={styles.baseUnitBadge}>
                    <Icon name="check-circle" size={11} color="#15803D" />
                    <Text style={styles.baseUnitBadgeText}>Base Unit</Text>
                  </View>
                ) : (
                  <View style={styles.ratioBadge}>
                    <Text style={styles.ratioBadgeText}>
                      Ratio: {unit.ratio}x
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  // Tab 3: Product Category Master View
  const renderCategoriesView = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.actionRowInside}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => setCatModalVisible(true)}
          activeOpacity={0.8}
        >
          <Icon name="file-text" size={15} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>+ Add Product Category</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeaderTitle}>Product Categories ({categories.length})</Text>
      <Text style={styles.sectionHeaderSubtitle}>Classify products for catalog grouping, GST codes and valuation</Text>

      {categories.map((cat) => {
        const prodCount = products.filter((p) => p.categoryId === cat.id).length;
        return (
          <View key={cat.id} style={styles.categoryCard}>
            <View style={styles.categoryCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {cat.code ? (
                  <View style={styles.catCodeBadge}>
                    <Text style={styles.catCodeText}>{cat.code}</Text>
                  </View>
                ) : null}
                <Text style={styles.categoryCardTitle}>{cat.name}</Text>
              </View>
              <View style={styles.catCountBadge}>
                <Text style={styles.catCountBadgeText}>{prodCount} Products</Text>
              </View>
            </View>

            <Text style={styles.categoryCardDesc}>
              {cat.description || 'No specific description recorded'}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );

  // Tab 4: Warehouse / Godown Master View
  const renderWarehousesView = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.actionRowInside}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => setWhModalVisible(true)}
          activeOpacity={0.8}
        >
          <Icon name="building" size={15} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>+ Add Warehouse / Godown</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeaderTitle}>Warehouses & Godowns ({warehouses.length})</Text>
      <Text style={styles.sectionHeaderSubtitle}>Physical storage locations, shops and scrap godowns</Text>

      {warehouses.map((wh) => {
        const quantsInWh = stockLedger.filter((q) => q.warehouseId === wh.id);
        const totalUnits = quantsInWh.reduce((sum, q) => sum + (q.qtyOnHand || 0), 0);

        return (
          <View key={wh.id} style={styles.warehouseCard}>
            <View style={styles.warehouseCardTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.whIconBox}>
                  <Icon name="building" size={18} color={colors.primary} />
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.warehouseName}>{wh.name}</Text>
                  <Text style={styles.warehouseCode}>Code: {wh.code}</Text>
                </View>
              </View>

              {wh.isDefault ? (
                <View style={styles.defaultWhBadge}>
                  <Icon name="check-circle" size={11} color="#15803D" />
                  <Text style={styles.defaultWhBadgeText}>Primary Godown</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.warehouseAddress}>
              📍 {wh.address || 'Vendor Primary Facility'}
            </Text>

            <View style={styles.warehouseStatsRow}>
              <Text style={styles.warehouseStatText}>
                Items Stored: <Text style={{ fontWeight: '800' }}>{quantsInWh.length}</Text>
              </Text>
              <Text style={styles.warehouseStatText}>
                On-Hand Units: <Text style={{ fontWeight: '800', color: colors.confirmed }}>{totalUnits}</Text>
              </Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );

  // Tab 5: Stock Ledger & Audit Trail View
  const renderLedgerView = () => (
    <View style={{ flex: 1 }}>
      {/* Top Action Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            if (products.length > 0) {
              setSelectedInwardProduct(products[0]);
              setInwardModalVisible(true);
            } else {
              Alert.alert('No Products', 'Create products first.');
            }
          }}
          activeOpacity={0.8}
        >
          <Icon name="truck" size={14} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>+ Inward (GRN)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dangerBtn}
          onPress={() => {
            if (products.length > 0) {
              setSelectedOutwardProduct(products[0]);
              setOutwardModalVisible(true);
            } else {
              Alert.alert('No Products', 'Create products first.');
            }
          }}
          activeOpacity={0.8}
        >
          <Icon name="package" size={14} color="#DC2626" />
          <Text style={styles.dangerBtnText}>- Issue / Outward</Text>
        </TouchableOpacity>
      </View>

      {/* Sub-toggle: Quants vs Audit */}
      <View style={styles.subToggleWrap}>
        <TouchableOpacity
          style={[styles.subToggleBtn, ledgerSubTab === 'QUANTS' ? styles.subToggleBtnActive : null]}
          onPress={() => setLedgerSubTab('QUANTS')}
        >
          <Text style={[styles.subToggleText, ledgerSubTab === 'QUANTS' ? styles.subToggleTextActive : null]}>
            Live Stock Ledger ({stockLedger.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subToggleBtn, ledgerSubTab === 'AUDIT' ? styles.subToggleBtnActive : null]}
          onPress={() => setLedgerSubTab('AUDIT')}
        >
          <Text style={[styles.subToggleText, ledgerSubTab === 'AUDIT' ? styles.subToggleTextActive : null]}>
            Movement Audit Trail ({stockMoves.length})
          </Text>
        </TouchableOpacity>
      </View>

      {ledgerSubTab === 'QUANTS' ? (
        <FlatList
          data={stockLedger}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="truck" size={36} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Stock Quants Found</Text>
              <Text style={styles.emptySubtitle}>Perform a Goods Inward (GRN) above to populate warehouse inventory.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.quantCard}>
              <View style={styles.quantCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quantProductName}>{item.productName}</Text>
                  <Text style={styles.quantSku}>SKU: {item.sku} • Location: {item.warehouseName}</Text>
                </View>
                <View style={styles.quantBadge}>
                  <Text style={styles.quantBadgeText}>
                    {item.qtyOnHand} {item.uomSymbol}
                  </Text>
                </View>
              </View>

              <View style={styles.quantDetailRow}>
                <Text style={styles.quantDetailText}>
                  Reserved: <Text style={{ fontWeight: '700' }}>{item.qtyReserved} {item.uomSymbol}</Text>
                </Text>
                <Text style={styles.quantDetailText}>
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
              <Icon name="clock" size={36} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Movement History</Text>
              <Text style={styles.emptySubtitle}>All stock additions and deductions will be timestamped here.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isInward = item.type === 'INWARD';
            return (
              <View style={styles.moveCard}>
                <View style={styles.moveCardTop}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.moveTypeBadge, isInward ? styles.moveBadgeGreen : styles.moveBadgeRed]}>
                      <Text style={[styles.moveTypeText, isInward ? styles.moveTextGreen : styles.moveTextRed]}>
                        {isInward ? 'INWARD' : 'OUTWARD'}
                      </Text>
                    </View>
                    <Text style={styles.moveNumber}>{item.moveNumber}</Text>
                  </View>
                  <Text style={[styles.moveQty, isInward ? styles.moveTextGreen : styles.moveTextRed]}>
                    {isInward ? '+' : '-'}{item.qty} {item.uomSymbol}
                  </Text>
                </View>

                <Text style={styles.moveProductName}>{item.productName}</Text>
                <Text style={styles.moveRefSub}>
                  Ref: {item.referenceNo || 'MANUAL'} • Party: {item.partyName || 'N/A'}
                </Text>
                <Text style={styles.moveDate}>
                  Godown: {item.warehouseName} • {new Date(item.createdAt).toLocaleString()}
                </Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* App Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.headerTitle}>Vendor Inventory Hub</Text>
          <Text style={styles.headerSubtitle}>Standalone Enterprise Masters • Zero Odoo Dependency</Text>
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

      {/* Segmented Top Masters Navigation Bar */}
      <View style={styles.segmentedBarWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segmentedBar}>
          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'PRODUCTS' ? styles.segmentTabActive : null]}
            onPress={() => setActiveTab('PRODUCTS')}
          >
            <Icon name="package" size={14} color={activeTab === 'PRODUCTS' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.segmentTabText, activeTab === 'PRODUCTS' ? styles.segmentTabTextActive : null]}>
              Products ({products.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'UOM' ? styles.segmentTabActive : null]}
            onPress={() => setActiveTab('UOM')}
          >
            <Icon name="filter" size={14} color={activeTab === 'UOM' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.segmentTabText, activeTab === 'UOM' ? styles.segmentTabTextActive : null]}>
              UOM Master ({uoms.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'CATEGORIES' ? styles.segmentTabActive : null]}
            onPress={() => setActiveTab('CATEGORIES')}
          >
            <Icon name="file-text" size={14} color={activeTab === 'CATEGORIES' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.segmentTabText, activeTab === 'CATEGORIES' ? styles.segmentTabTextActive : null]}>
              Categories ({categories.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'WAREHOUSES' ? styles.segmentTabActive : null]}
            onPress={() => setActiveTab('WAREHOUSES')}
          >
            <Icon name="building" size={14} color={activeTab === 'WAREHOUSES' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.segmentTabText, activeTab === 'WAREHOUSES' ? styles.segmentTabTextActive : null]}>
              Warehouses ({warehouses.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'LEDGER' ? styles.segmentTabActive : null]}
            onPress={() => setActiveTab('LEDGER')}
          >
            <Icon name="truck" size={14} color={activeTab === 'LEDGER' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.segmentTabText, activeTab === 'LEDGER' ? styles.segmentTabTextActive : null]}>
              Stock Ledger ({stockLedger.length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Tab View Content */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading standalone inventory masters...</Text>
        </View>
      ) : (
        <>
          {activeTab === 'PRODUCTS' && renderProductsView()}
          {activeTab === 'UOM' && renderUomView()}
          {activeTab === 'CATEGORIES' && renderCategoriesView()}
          {activeTab === 'WAREHOUSES' && renderWarehousesView()}
          {activeTab === 'LEDGER' && renderLedgerView()}
        </>
      )}

      {/* ================= MODAL 1: CREATE PRODUCT ================= */}
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
                  <TextInput style={styles.formInput} placeholder="0" keyboardType="numeric" value={initialStock} onChangeText={setInitialStock} />
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

      {/* ================= MODAL 2: CREATE UOM CATEGORY ================= */}
      <Modal visible={uomCategoryModalVisible} animationType="slide" transparent onRequestClose={() => setUomCategoryModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add UOM Category</Text>
              <TouchableOpacity onPress={() => setUomCategoryModalVisible(false)}>
                <Icon name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.formLabel}>Category Name *</Text>
              <TextInput style={styles.formInput} placeholder="e.g. Area, Electric Current, Time" value={uomCatName} onChangeText={setUomCatName} />

              <Text style={styles.formLabel}>Description (Optional)</Text>
              <TextInput style={styles.formInput} placeholder="e.g. Units for measuring surface area" value={uomCatDesc} onChangeText={setUomCatDesc} />
            </View>

            <View style={styles.modalFooter}>
              <Button title="Cancel" variant="outline" size="md" onPress={() => setUomCategoryModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Create Category" variant="primary" size="md" loading={savingUomCat} onPress={handleCreateUomCategory} style={{ flex: 1.5, marginLeft: 8 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL 3: CREATE UOM ================= */}
      <Modal visible={uomModalVisible} animationType="slide" transparent onRequestClose={() => setUomModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Unit of Measure (UOM)</Text>
              <TouchableOpacity onPress={() => setUomModalVisible(false)}>
                <Icon name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Parent UOM Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {uomCategories.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setUomParentCatId(c.id)}
                    style={[styles.selectChip, uomParentCatId === c.id ? styles.selectChipActive : null]}
                  >
                    <Text style={[styles.selectChipText, uomParentCatId === c.id ? styles.selectChipTextActive : null]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.formLabel}>Unit Name *</Text>
              <TextInput style={styles.formInput} placeholder="e.g. Box (25 Pcs), Kilogram" value={uomName} onChangeText={setUomName} />

              <Text style={styles.formLabel}>Symbol / Code *</Text>
              <TextInput style={styles.formInput} placeholder="e.g. Box, Kg, Nos" value={uomSymbol} onChangeText={setUomSymbol} />

              <Text style={styles.formLabel}>Ratio relative to base unit</Text>
              <TextInput style={styles.formInput} placeholder="e.g. 25 (if 1 Box = 25 Pcs)" keyboardType="numeric" value={uomRatio} onChangeText={setUomRatio} />

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>Is Base Unit of Category?</Text>
                  <Text style={styles.switchSub}>Reference unit that other units convert to</Text>
                </View>
                <Switch value={uomIsBase} onValueChange={setUomIsBase} trackColor={{ false: colors.border, true: colors.primary }} />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button title="Cancel" variant="outline" size="md" onPress={() => setUomModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Save Unit" variant="primary" size="md" loading={savingUom} onPress={handleCreateUom} style={{ flex: 1.5, marginLeft: 8 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL 4: CREATE PRODUCT CATEGORY ================= */}
      <Modal visible={catModalVisible} animationType="slide" transparent onRequestClose={() => setCatModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Product Category</Text>
              <TouchableOpacity onPress={() => setCatModalVisible(false)}>
                <Icon name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.formLabel}>Category Name *</Text>
              <TextInput style={styles.formInput} placeholder="e.g. Electrical & Motors" value={prodCatName} onChangeText={setProdCatName} />

              <Text style={styles.formLabel}>Short Code (Optional)</Text>
              <TextInput style={styles.formInput} placeholder="e.g. ELEC" autoCapitalize="characters" value={prodCatCode} onChangeText={setProdCatCode} />

              <Text style={styles.formLabel}>Description (Optional)</Text>
              <TextInput style={styles.formInput} placeholder="e.g. Motors, transformers, wires" value={prodCatDesc} onChangeText={setProdCatDesc} />
            </View>

            <View style={styles.modalFooter}>
              <Button title="Cancel" variant="outline" size="md" onPress={() => setCatModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Save Category" variant="primary" size="md" loading={savingCat} onPress={handleCreateProductCategory} style={{ flex: 1.5, marginLeft: 8 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL 5: CREATE WAREHOUSE ================= */}
      <Modal visible={whModalVisible} animationType="slide" transparent onRequestClose={() => setWhModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Warehouse / Godown</Text>
              <TouchableOpacity onPress={() => setWhModalVisible(false)}>
                <Icon name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Warehouse Name *</Text>
              <TextInput style={styles.formInput} placeholder="e.g. Unit 2 Raw Materials Godown" value={whName} onChangeText={setWhName} />

              <Text style={styles.formLabel}>Warehouse Code *</Text>
              <TextInput style={styles.formInput} placeholder="e.g. WH-U2-RM" autoCapitalize="characters" value={whCode} onChangeText={setWhCode} />

              <Text style={styles.formLabel}>Address / Location (Optional)</Text>
              <TextInput style={styles.formInput} placeholder="e.g. Plot 88, Sector 12, GIDC" value={whAddress} onChangeText={setWhAddress} />

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>Set as Default Godown</Text>
                  <Text style={styles.switchSub}>Automatic destination for incoming stock</Text>
                </View>
                <Switch value={whIsDefault} onValueChange={setWhIsDefault} trackColor={{ false: colors.border, true: colors.primary }} />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button title="Cancel" variant="outline" size="md" onPress={() => setWhModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Register Warehouse" variant="primary" size="md" loading={savingWh} onPress={handleCreateWarehouse} style={{ flex: 1.5, marginLeft: 8 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL 6: GOODS INWARD (GRN) ================= */}
      <Modal visible={inwardModalVisible} animationType="slide" transparent onRequestClose={() => setInwardModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Goods Inward (Add Stock / GRN)</Text>
              <TouchableOpacity onPress={() => setInwardModalVisible(false)}>
                <Icon name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Select Product *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {products.map((p) => {
                  const isSel = selectedInwardProduct?.id === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => setSelectedInwardProduct(p)}
                      style={[styles.selectChip, isSel ? styles.selectChipActive : null]}
                    >
                      <Text style={[styles.selectChipText, isSel ? styles.selectChipTextActive : null]}>
                        {p.name} ({p.sku})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {selectedInwardProduct ? (
                <View style={styles.selectedProdBanner}>
                  <Text style={styles.selectedProdTitle}>{selectedInwardProduct.name}</Text>
                  <Text style={styles.selectedProdSub}>
                    Current On-Hand: {selectedInwardProduct.stockOnHand} {selectedInwardProduct.uomSymbol}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.formLabel}>Destination Godown</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {warehouses.map((w) => (
                  <TouchableOpacity
                    key={w.id}
                    onPress={() => setInwardWhId(w.id)}
                    style={[styles.selectChip, inwardWhId === w.id ? styles.selectChipActive : null]}
                  >
                    <Text style={[styles.selectChipText, inwardWhId === w.id ? styles.selectChipTextActive : null]}>
                      {w.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.formLabel}>Inward Quantity *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 200"
                keyboardType="numeric"
                value={inwardQty}
                onChangeText={setInwardQty}
              />

              <Text style={styles.formLabel}>GRN / PO Reference (Optional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. GRN-2026-90"
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
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button title="Cancel" variant="outline" size="md" onPress={() => setInwardModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Confirm Inward" variant="success" size="md" loading={savingInward} iconName="check-circle" onPress={handleStockInward} style={{ flex: 1.5, marginLeft: 8 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL 7: STOCK OUTWARD (ISSUE / DISPATCH) ================= */}
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
              <Text style={styles.formLabel}>Select Product *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {products.map((p) => {
                  const isSel = selectedOutwardProduct?.id === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => setSelectedOutwardProduct(p)}
                      style={[styles.selectChip, isSel ? styles.selectChipActive : null]}
                    >
                      <Text style={[styles.selectChipText, isSel ? styles.selectChipTextActive : null]}>
                        {p.name} ({p.sku})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {selectedOutwardProduct ? (
                <View style={[styles.selectedProdBanner, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.selectedProdTitle, { color: '#B91C1C' }]}>{selectedOutwardProduct.name}</Text>
                  <Text style={styles.selectedProdSub}>
                    Available Stock: {selectedOutwardProduct.stockOnHand} {selectedOutwardProduct.uomSymbol}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.formLabel}>Source Godown</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {warehouses.map((w) => (
                  <TouchableOpacity
                    key={w.id}
                    onPress={() => setOutwardWhId(w.id)}
                    style={[styles.selectChip, outwardWhId === w.id ? styles.selectChipActive : null]}
                  >
                    <Text style={[styles.selectChipText, outwardWhId === w.id ? styles.selectChipTextActive : null]}>
                      {w.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.formLabel}>Outward Quantity to Deduct *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 50"
                keyboardType="numeric"
                value={outwardQty}
                onChangeText={setOutwardQty}
              />

              <Text style={styles.formLabel}>Issue Ref / Job Card (Optional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. ISSUE-PROD-01"
                value={outwardRef}
                onChangeText={setOutwardRef}
              />

              <Text style={styles.formLabel}>Recipient / Destination (Optional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Assembly Line / Customer"
                value={outwardParty}
                onChangeText={setOutwardParty}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button title="Cancel" variant="outline" size="md" onPress={() => setOutwardModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Deduct Stock" variant="danger" size="md" loading={savingOutward} onPress={handleStockOutward} style={{ flex: 1.5, marginLeft: 8 }} />
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
  segmentedBarWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  segmentedBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  segmentTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentTabActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  segmentTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 5,
  },
  segmentTabTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  actionRowInside: {
    flexDirection: 'row',
    marginBottom: 14,
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
  issueStockMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  issueStockMiniText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    marginLeft: 4,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionHeaderSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  uomCatCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  uomCatCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  uomCatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  uomCatTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  uomCatTitleActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  badgeSmall: {
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeSmallText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  uomCatDesc: {
    fontSize: 11,
    color: colors.textMuted,
  },
  clearFilterText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  uomItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  uomItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uomSymbolBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uomSymbolText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  uomItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  uomItemCategory: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  baseUnitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  baseUnitBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    marginLeft: 3,
  },
  ratioBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratioBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  catCodeBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  catCodeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  categoryCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  catCountBadge: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  catCountBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  categoryCardDesc: {
    fontSize: 12,
    color: colors.textMuted,
  },
  warehouseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  warehouseCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  whIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warehouseName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  warehouseCode: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  defaultWhBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultWhBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    marginLeft: 3,
  },
  warehouseAddress: {
    fontSize: 12,
    color: colors.textSecondary,
    marginVertical: 8,
  },
  warehouseStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  warehouseStatText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  subToggleWrap: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
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
  quantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quantCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  quantProductName: {
    fontSize: 13,
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
  quantDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  quantDetailText: {
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
  },
  moveCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moveTypeBadge: {
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
  moveTypeText: {
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
  moveProductName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
  },
  moveRefSub: {
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
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
