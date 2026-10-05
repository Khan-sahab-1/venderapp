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
import { DashboardStats } from '../types';
import { MetricCard } from '../components/MetricCard';
import { OrderCard } from '../components/OrderCard';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';

interface DashboardScreenProps {
  navigation: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { user, refreshProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      setError('');
      const data = await apiService.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch live dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), refreshProfile()]);
    setRefreshing(false);
  };

  const formattedRevenue = stats
    ? new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(stats.totalRevenue)
    : '₹ 0';

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
            <Text style={styles.welcomeSubtitle}>Welcome back,</Text>
            <Text style={styles.vendorName} numberOfLines={1}>
              {user?.name || 'Vendor Partner'}
            </Text>
            {user?.gstin ? (
              <Text style={styles.gstinText}>GSTIN: {user.gstin}</Text>
            ) : null}
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
            Connected Live to Swagger Gateway (192.168.1.6:4000)
          </Text>
        </View>

        {/* Error Alert */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchStats} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

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
            <Text style={styles.revenueAmount}>{formattedRevenue}</Text>
          )}
          <Text style={styles.revenueSubtext}>
            Cumulative volume across all confirmed & fulfilled orders
          </Text>
        </View>

        {/* KPI 2x2 Grid */}
        <Text style={styles.sectionTitle}>Order Metrics</Text>
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
          <Text style={styles.sectionTitle}>Recent Sales Orders</Text>
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
          stats.recentOrders.map((order) => (
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
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
    marginRight: 8,
  },
  syncText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cancelledBg,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cancelledBorder,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: colors.cancelled,
    fontWeight: '600',
    flex: 1,
  },
  retryBtn: {
    backgroundColor: colors.cancelled,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  revenueCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  revenueTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  revenueLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  revenueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  revenueBadgeText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  revenueAmount: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  revenueSubtext: {
    color: '#94A3B8',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textMuted,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  vendorGreetingTextWrap: {
    flex: 1,
    marginRight: 10,
  },
  revenueSpinner: {
    marginVertical: 8,
  },
});
