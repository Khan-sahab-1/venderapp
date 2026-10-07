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
} from 'react-native';
import { apiService } from '../services/api';
import {
  ProductCategoryItem,
  InventoryProduct,
  CreateProductCategoryPayload,
} from '../types';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { Button } from '../components/Button';
import { colors } from '../theme/colors';

export const CategoryMasterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [categories, setCategories] = useState<ProductCategoryItem[]>([]);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [catsData, prodsData] = await Promise.all([
        apiService.getProductCategories().catch(() => []),
        apiService.getInventoryProducts().catch(() => []),
      ]);
      setCategories(catsData);
      setProducts(prodsData);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load categories');
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
      Alert.alert('Required', 'Please enter Category Name');
      return;
    }

    setSaving(true);
    try {
      const payload: CreateProductCategoryPayload = {
        name: name.trim(),
        code: code.trim().toUpperCase() || undefined,
        description: description.trim() || undefined,
      };

      await apiService.createProductCategory(payload);
      Alert.alert('Success', `Product Category "${name}" created!`);
      setModalVisible(false);
      setName('');
      setCode('');
      setDescription('');
      await loadData();
    } catch (err: any) {
      Alert.alert('Failed', err.message || 'Could not create category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Product Categories"
        subtitle={`${categories.length} Categories Defined • Dynamic Master`}
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
          <Icon name="file-text" size={16} color="#FFFFFF" />
          <Text style={styles.createBtnText}>+ Add New Product Category</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading product categories...</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Text style={styles.sectionSubtitle}>
            Categories dynamically segment your inventory for taxation, valuation and reporting.
          </Text>

          {categories.map((cat) => {
            const count = products.filter((p) => p.categoryId === cat.id).length;

            return (
              <View key={cat.id} style={styles.catCard}>
                <View style={styles.catCardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    {cat.code ? (
                      <View style={styles.codeBadge}>
                        <Text style={styles.codeBadgeText}>{cat.code}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.catTitle}>{cat.name}</Text>
                  </View>

                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{count} Products</Text>
                  </View>
                </View>

                <Text style={styles.catDesc}>
                  {cat.description || 'No description provided'}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ================= MODAL: ADD PRODUCT CATEGORY ================= */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Product Category</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.formLabel}>Category Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Electrical Components, Packaging"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.formLabel}>Short Code (Optional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. ELEC, PKG, RM"
                autoCapitalize="characters"
                value={code}
                onChangeText={setCode}
              />

              <Text style={styles.formLabel}>Description (Optional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Describe items falling in this category..."
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={styles.modalFooter}>
              <Button title="Cancel" variant="outline" size="md" onPress={() => setModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Save Category" variant="primary" size="md" loading={saving} onPress={handleCreate} style={{ flex: 1.5, marginLeft: 8 }} />
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
  catCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
  },
  catCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  codeBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  codeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  catTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  countBadge: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  catDesc: {
    fontSize: 12,
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
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
