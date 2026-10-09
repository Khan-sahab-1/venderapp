import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { DashboardStats, InventorySummary } from '../types';
import { MetricCard } from '../components/MetricCard';
import { OrderCard } from '../components/OrderCard';
import { OrderNotificationBanner } from '../components/OrderNotificationBanner';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';

interface DashboardScreenProps {
  navigation: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { user, company, refreshProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [invSummary, setInvSummary] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [dismissedBanner, setDismissedBanner] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [orderData, inventoryData] = await Promise.all([
        apiService.getDashboardStats().catch(() => null),
        apiService.getInventorySummary().catch(() => null),
      ]);
      setStats(orderData);
      setInvSummary(inventoryData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch live dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), refreshProfile()]);
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);

  const latestOrder = stats?.recentOrders?.[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Vendor Greeting Bar */}
        <View style={styles.topBar}>
          <View style={styles.vendorGreetingTextWrap}>
            <Text style={styles.welcomeSubtitle}>Tenant ERP Workspace</Text>
            <Text style={styles.vendorName} numberOfLines={1}>
              {company?.name || user?.companyName || user?.name || 'Tenant Company'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                User: {user?.email} • Role: {user?.role || 'admin'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <Icon name="refresh" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Live Sync Banner */}
        <View style={styles.syncBanner}>
          <View style={styles.liveDot} />
          <Text style={styles.syncText}>
            Tenant Isolated • Odoo Partner #{company?.odooPartnerId || 'Synced'}
          </Text>
        </View>

        {/* Real-time Order Arrival Banner */}
        {latestOrder && !dismissedBanner ? (
          <OrderNotificationBanner
            orderNumber={latestOrder.soNumber}
            poNumber={latestOrder.poNumber}
            customerName={latestOrder.customerName}
            amount={latestOrder.amountTotal}
            onPress={() => navigation.navigate('OrderDetail', { orderId: latestOrder.id })}
            onDismiss={() => setDismissedBanner(true)}
          />
        ) : null}

        {/* Error Alert */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchData} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ============================================================== */}
        {/* SECTION 1: ENTERPRISE INVENTORY & GODOWNS (PRIVATE DB)        */}
        {/* ============================================================== */}
        <View style={styles.sectionDividerRow}>
          <View style={styles.sectionHeaderLeft}>
            <View style={styles.sectionTagGreen}>
              <Text style={styles.sectionTagGreenText}>STANDALONE INVENTORY</Text>
            </View>
            <Text style={styles.sectionMainTitle}>Inventory & Stock Masters</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('InventoryTab')}
            activeOpacity={0.7}
          >
            <Text style={styles.viewHubText}>Open Hub →</Text>
          </TouchableOpacity>
        </View>

        {/* Inventory Valuation Card */}
        <View style={styles.inventoryHeroCard}>
          <View style={styles.invHeroTop}>
            <View>
              <Text style={styles.invHeroSub}>Total Stock Valuation</Text>
              <Text style={styles.invHeroAmount}>
                {formatCurrency(invSummary?.inventoryValuation || 0)}
              </Text>
            </View>
            <View style={styles.invUnitsBadge}>
              <Icon name="package" size={14} color="#15803D" />
              <Text style={styles.invUnitsBadgeText}>
                {invSummary?.totalStockUnits || 0} Units On-Hand
              </Text>
            </View>
          </View>
          <Text style={styles.invHeroFootnote}>
            Valuation calculated real-time across all vendor godowns
          </Text>
        </View>

        {/* Inventory KPI Metrics Row */}
        <View style={styles.invMetricsRow}>
          <TouchableOpacity
            style={styles.invMiniCard}
            onPress={() => navigation.navigate('ProductMaster')}
          >
            <Text style={styles.invMiniVal}>{invSummary?.totalProducts || 0}</Text>
            <Text style={styles.invMiniLbl}>Products</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.invMiniCard}
            onPress={() => navigation.navigate('WarehouseMaster')}
          >
            <Text style={[styles.invMiniVal, { color: colors.primary }]}>{invSummary?.totalWarehouses || 1}</Text>
            <Text style={styles.invMiniLbl}>Godowns</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.invMiniCard}
            onPress={() => navigation.navigate('ProductMaster')}
          >
            <Text style={[styles.invMiniVal, { color: (invSummary?.lowStockCount || 0) > 0 ? '#DC2626' : colors.confirmed }]}>
              {invSummary?.lowStockCount || 0}
            </Text>
            <Text style={styles.invMiniLbl}>Low Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.invMiniCard}
            onPress={() => navigation.navigate('StockLedger')}
          >
            <Text style={[styles.invMiniVal, { color: colors.dispatched }]}>{invSummary?.totalInvoicesCreated || 0}</Text>
            <Text style={styles.invMiniLbl}>Invoices</Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Master Shortcuts Grid */}
        <Text style={styles.subSectionTitle}>Master Data Management (Dynamic UIs)</Text>
        <View style={styles.mastersGrid}>
          <TouchableOpacity
            style={styles.masterTile}
            onPress={() => navigation.navigate('ProductMaster')}
            activeOpacity={0.8}
          >
            <View style={[styles.masterIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Icon name="package" size={20} color={colors.primary} />
            </View>
            <Text style={styles.masterTileTitle}>Product Master</Text>
            <Text style={styles.masterTileSub}>SKU, Pricing & Tax</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.masterTile}
            onPress={() => navigation.navigate('UomMaster')}
            activeOpacity={0.8}
          >
            <View style={[styles.masterIconBox, { backgroundColor: '#F0FDF4' }]}>
              <Icon name="filter" size={20} color="#15803D" />
            </View>
            <Text style={styles.masterTileTitle}>UOM Master</Text>
            <Text style={styles.masterTileSub}>Units & Conversion</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.masterTile}
            onPress={() => navigation.navigate('CategoryMaster')}
            activeOpacity={0.8}
          >
            <View style={[styles.masterIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Icon name="file-text" size={20} color="#B45309" />
            </View>
            <Text style={styles.masterTileTitle}>Categories</Text>
            <Text style={styles.masterTileSub}>Item Classes & Codes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.masterTile}
            onPress={() => navigation.navigate('WarehouseMaster')}
            activeOpacity={0.8}
          >
            <View style={[styles.masterIconBox, { backgroundColor: '#F5F3FF' }]}>
              <Icon name="building" size={20} color="#6D28D9" />
            </View>
            <Text style={styles.masterTileTitle}>Godowns</Text>
            <Text style={styles.masterTileSub}>Storage Facilities</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.masterTile, { width: '100%', flexDirection: 'row', alignItems: 'center', marginTop: 4 }]}
            onPress={() => navigation.navigate('StockLedger')}
            activeOpacity={0.8}
          >
            <View style={[styles.masterIconBox, { backgroundColor: '#ECFDF5', marginRight: 12 }]}>
              <Icon name="truck" size={20} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.masterTileTitle}>Stock Ledger & Operations (GRN / Dispatch)</Text>
              <Text style={styles.masterTileSub}>Live Godown Quants & Chronological Movement History</Text>
            </View>
            <Icon name="chevron-right" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ============================================================== */}
        {/* SECTION 2: BUYER PURCHASE ORDERS -> SALES ORDERS (ODOO SYNC)  */}
        {/* ============================================================== */}
        <View style={[styles.sectionDividerRow, { marginTop: 24 }]}>
          <View style={styles.sectionHeaderLeft}>
            <View style={styles.sectionTagBlue}>
              <Text style={styles.sectionTagBlueText}>ODOO ERP SYNC</Text>
            </View>
            <Text style={styles.sectionMainTitle}>Buyer PO & Sales Orders</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('OrdersTab')}
            activeOpacity={0.7}
          >
            <Text style={styles.viewHubText}>All Orders →</Text>
          </TouchableOpacity>
        </View>

        {/* Big Revenue Highlight Card */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueTop}>
            <Text style={styles.revenueLabel}>Total Order Book Value</Text>
            <View style={styles.revenueBadge}>
              <Icon name="check-circle" size={12} color={colors.confirmed} />
              <Text style={styles.revenueBadgeText}>Live Odoo Sync</Text>
            </View>
          </View>
          {loading && !stats ? (
            <ActivityIndicator size="small" color="#FFFFFF" style={styles.revenueSpinner} />
          ) : (
            <Text style={styles.revenueAmount}>{formatCurrency(stats?.totalRevenue || 0)}</Text>
          )}
          <Text style={styles.revenueSubtext}>
            Cumulative volume across all confirmed & fulfilled orders
          </Text>
        </View>

        {/* KPI 2x2 Grid for Orders */}
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Total Orders"
            value={stats?.totalOrders || 0}
            subtitle="All time orders"
            iconName="package"
            iconColor={colors.primary}
            iconBg={colors.primaryMuted}
            onPress={() => navigation.navigate('OrdersTab', { status: 'ALL' })}
          />
          <MetricCard
            title="Confirmed / Ready"
            value={stats?.confirmedCount || 0}
            subtitle="To be dispatched"
            iconName="check-circle"
            iconColor={colors.confirmed}
            iconBg={colors.confirmedBg}
            onPress={() => navigation.navigate('OrdersTab', { status: 'CONFIRMED' })}
          />
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard
            title="Pending Review"
            value={stats?.pendingCount || 0}
            subtitle="Under approval"
            iconName="clock"
            iconColor={colors.pending}
            iconBg={colors.pendingBg}
            onPress={() => navigation.navigate('OrdersTab', { status: 'PENDING' })}
          />
          <MetricCard
            title="Completed"
            value={stats?.completedCount || 0}
            subtitle="Delivered & verified"
            iconName="truck"
            iconColor={colors.dispatched}
            iconBg={colors.dispatchedBg}
            onPress={() => navigation.navigate('OrdersTab', { status: 'COMPLETED' })}
          />
        </View>

        {/* Recent Orders Section */}
        <View style={styles.recentSectionHeader}>
          <Text style={styles.subSectionTitle}>Recent Sales Orders (Odoo)</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('OrdersTab')}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All ({stats?.totalOrders || 0})</Text>
          </TouchableOpacity>
        </View>

        {loading && !stats ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingSubtext}>Loading live orders from ERP...</Text>
          </View>
        ) : stats?.recentOrders && stats.recentOrders.length > 0 ? (
          stats.recentOrders.slice(0, 3).map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
            />
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Icon name="package" size={32} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Recent Orders</Text>
            <Text style={styles.emptySubtext}>
              New Purchase Orders approved in Odoo will appear here instantly as Sales Orders.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  vendorName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  gstinText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.confirmed,
    marginRight: 8,
  },
  syncText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: colors.cancelledBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.cancelled,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    color: colors.cancelled,
    flex: 1,
  },
  retryBtn: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.card,
    borderRadius: 6,
  },
  retryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.cancelled,
  },
  sectionDividerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  sectionTagGreen: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  sectionTagGreenText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  sectionTagBlue: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  sectionTagBlueText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
  },
  sectionMainTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  viewHubText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  inventoryHeroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  invHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  invHeroSub: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  invHeroAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  invUnitsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  invUnitsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4ADE80',
    marginLeft: 5,
  },
  invHeroFootnote: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 8,
  },
  invMetricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  invMiniCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
  },
  invMiniVal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  invMiniLbl: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  mastersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  masterTile: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
  },
  masterIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  masterTileTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  masterTileSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  revenueCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  revenueTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  revenueLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  revenueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  revenueBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  revenueAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  revenueSpinner: {
    marginVertical: 4,
    alignSelf: 'flex-start',
  },
  revenueSubtext: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
  },
  metricsGrid: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  recentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  viewAllText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textMuted,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
