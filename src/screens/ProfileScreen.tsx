import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';

export const ProfileScreen: React.FC = () => {
  const { user, logout, apiBaseUrl, setApiBaseUrl, refreshProfile } = useAuth();
  const [editingUrl, setEditingUrl] = useState(apiBaseUrl);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setEditingUrl(apiBaseUrl);
  }, [apiBaseUrl]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const handleSaveUrl = () => {
    const cleanUrl = editingUrl.trim();
    if (!cleanUrl) {
      Alert.alert('Invalid URL', 'Please enter a valid API URL');
      return;
    }
    setApiBaseUrl(cleanUrl);
    Alert.alert('Settings Updated', `API Gateway set to: ${cleanUrl}\nPlease pull-to-refresh or sign in again.`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vendor Profile & Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Vendor Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Icon name="building" size={28} color={colors.primary} />
          </View>
          <Text style={styles.vendorName}>{user?.name || 'Vendor Entity'}</Text>
          <Text style={styles.vendorEmail}>{user?.email || 'vendor@example.com'}</Text>
          {user?.gstin ? (
            <View style={styles.gstinBadge}>
              <Text style={styles.gstinText}>GSTIN: {user.gstin}</Text>
            </View>
          ) : null}
        </View>

        {/* Contact Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Registered Contact Info (from Odoo)</Text>

          <View style={styles.infoRow}>
            <Icon name="phone" size={16} color={colors.textSecondary} />
            <View style={styles.infoTextBlock}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{user?.phone || 'Not Registered'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Icon name="building" size={16} color={colors.textSecondary} />
            <View style={styles.infoTextBlock}>
              <Text style={styles.infoLabel}>Registered Address</Text>
              <Text style={styles.infoValue}>
                {user?.address || 'Address not configured in ERP'}
              </Text>
            </View>
          </View>
        </View>

        {/* Connection Settings Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Swagger REST API Gateway URL</Text>
          <Text style={styles.cardSubtitle}>
            Live gateway connecting Vendor Mobile App to Odoo ERP
          </Text>

          <TextInput
            style={styles.urlInput}
            value={editingUrl}
            onChangeText={setEditingUrl}
            placeholder="http://192.168.1.6:4000/api"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />

          <View style={styles.urlPresets}>
            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => setEditingUrl('http://192.168.1.6:4000/api')}
            >
              <Text style={styles.presetText}>Swagger (192.168.1.6)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => setEditingUrl('http://10.0.2.2:4000/api')}
            >
              <Text style={styles.presetText}>Android (10.0.2.2)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => setEditingUrl('http://localhost:4000/api')}
            >
              <Text style={styles.presetText}>Localhost</Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Save API URL"
            variant="outline"
            size="sm"
            onPress={handleSaveUrl}
            style={styles.saveBtn}
          />
        </View>

        {/* Logout Button */}
        <Button
          title="Sign Out"
          variant="danger"
          size="md"
          iconName="log-out"
          onPress={logout}
          style={styles.logoutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  vendorEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  gstinBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gstinText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  infoTextBlock: {
    marginLeft: 10,
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surface,
    marginVertical: 8,
  },
  urlInput: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  urlPresets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  presetChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  saveBtn: {
    marginTop: 12,
  },
  logoutBtn: {
    marginTop: 10,
  },
});
