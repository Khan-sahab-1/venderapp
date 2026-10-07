import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { apiService } from '../services/api';
import {
  InventorySummary,
  InventoryProduct,
  UomItem,
  ProductCategoryItem,
  WarehouseItem,
  StockQuantItem,
} from '../types';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';

export const InventoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [uoms, setUoms] = useState<UomItem[]>([]);
  const [categories, setCategories] = useState<ProductCategoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [stockLedger, setStockLedger] = useState<StockQuantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [sumData, prodsData, uomsData, catsData, whData, ledgerData] = await Promise.all([
        apiService.getInventorySummary().catch(() => null),
        apiService.getInventoryProducts().catch(() => []),
        apiService.getUoms().catch(() => []),
        apiService.getProductCategories().catch(() => []),
        apiService.getWarehouses().catch(() => []),
        apiService.getStockLedger().catch(() => []),
      ]);

      setSummary(sumData);
      setProducts(prodsData);
      setUoms(uomsData);
      setCategories(catsData);
      setWarehouses(whData);
      setStockLedger(ledgerData);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load inventory data');
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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);

  const lowStockItems = products.filter(
    (p) => p.stockStatus === 'LOW_STOCK' || p.stockStatus === 'OUT_OF_STOCK',
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.headerTitle}>Inventory & Masters Hub</Text>
          <Text style={styles.headerSubtitle}>Enterprise Standalone DB • Zero Odoo Dependency</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.7}>
          <Icon name="refresh" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Inventory Valuation Highlight Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroLabel}>Total Stock Valuation</Text>
              <Text style={styles.heroAmount}>
                {formatCurrency(summary?.inventoryValuation || 0)}
              </Text>
            </View>
            <View style={styles.heroUnitsBadge}>
              <Icon name="package" size={14} color="#4ADE80" />
              <Text style={styles.heroUnitsText}>
                {summary?.totalStockUnits || 0} Units On-Hand
              </Text>
            </View>
          </View>
          <Text style={styles.heroFootnote}>
            Live valuation aggregated across all godowns & storage locations
          </Text>
        </View>

        {/* 4 Quick Stat Metric Tiles */}
        <View style={styles.kpiRow}>
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => navigation.navigate('ProductMaster')}
          >
            <Text style={styles.kpiVal}>{summary?.totalProducts || products.length}</Text>
            <Text style={styles.kpiLbl}>Products</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => navigation.navigate('WarehouseMaster')}
          >
            <Text style={[styles.kpiVal, { color: colors.primary }]}>{warehouses.length || 1}</Text>
            <Text style={styles.kpiLbl}>Godowns</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => navigation.navigate('ProductMaster')}
          >
            <Text style={[styles.kpiVal, { color: lowStockItems.length > 0 ? '#DC2626' : colors.confirmed }]}>
              {lowStockItems.length}
            </Text>
            <Text style={styles.kpiLbl}>Low Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => navigation.navigate('StockLedger')}
          >
            <Text style={[styles.kpiVal, { color: colors.dispatched }]}>{stockLedger.length}</Text>
            <Text style={styles.kpiLbl}>Quants</Text>
          </TouchableOpacity>
        </View>

        {/* Action Row: Quick Operations */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('StockLedger')}
            activeOpacity={0.8}
          >
            <Icon name="truck" size={15} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>+ Inward Stock (GRN)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('StockLedger')}
            activeOpacity={0.8}
          >
            <Icon name="package" size={15} color={colors.primary} />
            <Text style={styles.secondaryBtnText}>- Issue / Outward</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION: 5 DEDICATED MASTER SCREENS */}
        <Text style={styles.sectionTitle}>Master Data Management (Dedicated UIs)</Text>
        <Text style={styles.sectionSubtitle}>
          Har master ke liye alag, dedicated dynamic screen uplabdh hai:
        </Text>

        {/* 1. Product Master Card */}
        <TouchableOpacity
          style={styles.masterCard}
          onPress={() => navigation.navigate('ProductMaster')}
          activeOpacity={0.8}
        >
          <View style={[styles.masterIconBox, { backgroundColor: '#EFF6FF' }]}>
            <Icon name="package" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.masterCardTitle}>1. Product Master Screen</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{products.length} Items</Text>
              </View>
            </View>
            <Text style={styles.masterCardSub}>
              Item SKU, name, HSN code, GST rate, cost price, sale price & live on-hand stock badges.
            </Text>
            <Text style={styles.openScreenLink}>Open Product Master UI →</Text>
          </View>
        </TouchableOpacity>

        {/* 2. UOM Master Card */}
        <TouchableOpacity
          style={styles.masterCard}
          onPress={() => navigation.navigate('UomMaster')}
          activeOpacity={0.8}
        >
          <View style={[styles.masterIconBox, { backgroundColor: '#F0FDF4' }]}>
            <Icon name="filter" size={24} color="#15803D" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.masterCardTitle}>2. UOM & Unit Master Screen</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{uoms.length} Units</Text>
              </View>
            </View>
            <Text style={styles.masterCardSub}>
              Measurement categories (Count, Weight, Volume, Length) & dynamic units with conversion ratios.
            </Text>
            <Text style={styles.openScreenLink}>Open UOM Master UI →</Text>
          </View>
        </TouchableOpacity>

        {/* 3. Product Categories Card */}
        <TouchableOpacity
          style={styles.masterCard}
          onPress={() => navigation.navigate('CategoryMaster')}
          activeOpacity={0.8}
        >
          <View style={[styles.masterIconBox, { backgroundColor: '#FEF3C7' }]}>
            <Icon name="file-text" size={24} color="#B45309" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.masterCardTitle}>3. Product Categories Screen</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{categories.length} Categories</Text>
              </View>
            </View>
            <Text style={styles.masterCardSub}>
              Raw materials, finished goods, packaging & hardware category codes with dynamic creation.
            </Text>
            <Text style={styles.openScreenLink}>Open Category Master UI →</Text>
          </View>
        </TouchableOpacity>

        {/* 4. Warehouses & Godowns Card */}
        <TouchableOpacity
          style={styles.masterCard}
          onPress={() => navigation.navigate('WarehouseMaster')}
          activeOpacity={0.8}
        >
          <View style={[styles.masterIconBox, { backgroundColor: '#F5F3FF' }]}>
            <Icon name="building" size={24} color="#6D28D9" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.masterCardTitle}>4. Warehouses & Godowns Screen</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{warehouses.length} Godowns</Text>
              </View>
            </View>
            <Text style={styles.masterCardSub}>
              Physical locations, factory godowns & shops with address and primary default badge.
            </Text>
            <Text style={styles.openScreenLink}>Open Warehouse Master UI →</Text>
          </View>
        </TouchableOpacity>

        {/* 5. Stock Operations & Ledger Card */}
        <TouchableOpacity
          style={styles.masterCard}
          onPress={() => navigation.navigate('StockLedger')}
          activeOpacity={0.8}
        >
          <View style={[styles.masterIconBox, { backgroundColor: '#ECFDF5' }]}>
            <Icon name="truck" size={24} color="#059669" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.masterCardTitle}>5. Stock Ledger & Audit Log Screen</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{stockLedger.length} Quants</Text>
              </View>
            </View>
            <Text style={styles.masterCardSub}>
              Real-time stock quants per warehouse, Goods Inward (GRN), Outward Issue & movement history.
            </Text>
            <Text style={styles.openScreenLink}>Open Stock Ledger & Operations UI →</Text>
          </View>
        </TouchableOpacity>

        {/* SECTION: LOW STOCK ALERTS */}
        {lowStockItems.length > 0 ? (
          <View style={styles.lowStockSection}>
            <View style={styles.lowStockHeader}>
              <Icon name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.lowStockTitle}>
                Low Stock Alerts ({lowStockItems.length})
              </Text>
            </View>
            {lowStockItems.slice(0, 3).map((item) => (
              <View key={item.id} style={styles.lowStockCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lowStockItemName}>{item.name}</Text>
                  <Text style={styles.lowStockItemSub}>
                    SKU: {item.sku} • Min Alert: {item.minStockAlert} {item.uomSymbol}
                  </Text>
                </View>
                <View style={styles.lowStockBadge}>
                  <Text style={styles.lowStockBadgeText}>
                    {item.stockOnHand} {item.uomSymbol}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
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
  refreshBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  heroAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  heroUnitsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  heroUnitsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4ADE80',
    marginLeft: 5,
  },
  heroFootnote: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 8,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
  },
  kpiVal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  kpiLbl: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 11,
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
    paddingVertical: 11,
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 12,
  },
  masterCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
  },
  masterIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  masterCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  countBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  masterCardSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
    lineHeight: 15,
  },
  openScreenLink: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 6,
  },
  lowStockSection: {
    marginTop: 14,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  lowStockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  lowStockTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
    marginLeft: 6,
  },
  lowStockCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  lowStockItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  lowStockItemSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  lowStockBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lowStockBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
});
