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
  UomCategoryItem,
  UomItem,
  CreateUomCategoryPayload,
  CreateUomPayload,
} from '../types';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { Button } from '../components/Button';
import { colors } from '../theme/colors';

export const UomMasterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [subTab, setSubTab] = useState<'UNITS' | 'CATEGORIES'>('UNITS');
  const [categories, setCategories] = useState<UomCategoryItem[]>([]);
  const [uoms, setUoms] = useState<UomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCatFilter, setSelectedCatFilter] = useState<number | undefined>(undefined);

  // Modals
  const [uomModalVisible, setUomModalVisible] = useState(false);
  const [catModalVisible, setCatModalVisible] = useState(false);

  // Form: Create Unit
  const [uomCatId, setUomCatId] = useState<number>(1);
  const [uomName, setUomName] = useState('');
  const [uomSymbol, setUomSymbol] = useState('');
  const [uomRatio, setUomRatio] = useState('1');
  const [uomIsBase, setUomIsBase] = useState(false);
  const [savingUom, setSavingUom] = useState(false);

  // Form: Create Category
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [savingCat, setSavingCat] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [catsData, uomsData] = await Promise.all([
        apiService.getUomCategories().catch(() => []),
        apiService.getUoms().catch(() => []),
      ]);
      setCategories(catsData);
      setUoms(uomsData);
      if (catsData.length > 0 && !uomCatId) setUomCatId(catsData[0].id);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load UOMs');
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

  const handleCreateUom = async () => {
    if (!uomName.trim()) {
      Alert.alert('Required', 'Please enter unit name (e.g. Box 10 Pcs)');
      return;
    }
    if (!uomSymbol.trim()) {
      Alert.alert('Required', 'Please enter unit symbol (e.g. Box)');
      return;
    }

    setSavingUom(true);
    try {
      const payload: CreateUomPayload = {
        categoryId: uomCatId,
        name: uomName.trim(),
        symbol: uomSymbol.trim(),
        ratio: Number(uomRatio) || 1,
        isBaseUnit: uomIsBase,
      };

      await apiService.createUom(payload);
      Alert.alert('Success', `Unit "${uomName}" created successfully!`);
      setUomModalVisible(false);
      setUomName('');
      setUomSymbol('');
      setUomRatio('1');
      setUomIsBase(false);
      await loadData();
    } catch (err: any) {
      Alert.alert('Failed', err.message || 'Could not create UOM');
    } finally {
      setSavingUom(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!catName.trim()) {
      Alert.alert('Required', 'Please enter category name');
      return;
    }

    setSavingCat(true);
    try {
      const payload: CreateUomCategoryPayload = {
        name: catName.trim(),
        description: catDesc.trim() || undefined,
      };

      await apiService.createUomCategory(payload);
      Alert.alert('Success', `UOM Category "${catName}" created!`);
      setCatModalVisible(false);
      setCatName('');
      setCatDesc('');
      await loadData();
    } catch (err: any) {
      Alert.alert('Failed', err.message || 'Could not create category');
    } finally {
      setSavingCat(false);
    }
  };

  const filteredUoms = selectedCatFilter
    ? uoms.filter((u) => u.categoryId === selectedCatFilter)
    : uoms;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="UOM & Unit Master"
        subtitle={`${uoms.length} Units • ${categories.length} Measurement Categories`}
        showBack={true}
        onBack={() => navigation.goBack()}
        rightIcon="refresh"
        onRightPress={onRefresh}
      />

      {/* Top Action Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => setUomModalVisible(true)}
          activeOpacity={0.8}
        >
          <Icon name="package" size={15} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>+ Add New Unit (UOM)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => setCatModalVisible(true)}
          activeOpacity={0.8}
        >
          <Icon name="filter" size={15} color={colors.primary} />
          <Text style={styles.secondaryBtnText}>+ Add UOM Category</Text>
        </TouchableOpacity>
      </View>

      {/* Segmented Sub Tabs */}
      <View style={styles.subTabsWrap}>
        <TouchableOpacity
          style={[styles.subTabBtn, subTab === 'UNITS' ? styles.subTabBtnActive : null]}
          onPress={() => setSubTab('UNITS')}
        >
          <Text style={[styles.subTabText, subTab === 'UNITS' ? styles.subTabTextActive : null]}>
            Units of Measure ({uoms.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subTabBtn, subTab === 'CATEGORIES' ? styles.subTabBtnActive : null]}
          onPress={() => setSubTab('CATEGORIES')}
        >
          <Text style={[styles.subTabText, subTab === 'CATEGORIES' ? styles.subTabTextActive : null]}>
            Measurement Categories ({categories.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading UOMs...</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {subTab === 'UNITS' ? (
            <>
              {/* Category Filter Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <TouchableOpacity
                  onPress={() => setSelectedCatFilter(undefined)}
                  style={[styles.filterChip, selectedCatFilter === undefined ? styles.filterChipActive : null]}
                >
                  <Text style={[styles.filterChipText, selectedCatFilter === undefined ? styles.filterChipTextActive : null]}>
                    All ({uoms.length})
                  </Text>
                </TouchableOpacity>
                {categories.map((c) => {
                  const isSel = selectedCatFilter === c.id;
                  const count = uoms.filter((u) => u.categoryId === c.id).length;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setSelectedCatFilter(c.id)}
                      style={[styles.filterChip, isSel ? styles.filterChipActive : null]}
                    >
                      <Text style={[styles.filterChipText, isSel ? styles.filterChipTextActive : null]}>
                        {c.name} ({count})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {filteredUoms.map((unit) => (
                <View key={unit.id} style={styles.unitCard}>
                  <View style={styles.unitLeft}>
                    <View style={styles.symbolBox}>
                      <Text style={styles.symbolText}>{unit.symbol}</Text>
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.unitName}>{unit.name}</Text>
                      <Text style={styles.unitCategoryText}>Category: {unit.categoryName}</Text>
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    {unit.isBaseUnit ? (
                      <View style={styles.baseBadge}>
                        <Icon name="check-circle" size={11} color="#15803D" />
                        <Text style={styles.baseBadgeText}>Base Unit</Text>
                      </View>
                    ) : (
                      <View style={styles.ratioBadge}>
                        <Text style={styles.ratioBadgeText}>Ratio: {unit.ratio}x Base</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </>
          ) : (
            <>
              {categories.map((cat) => {
                const count = uoms.filter((u) => u.categoryId === cat.id).length;
                return (
                  <View key={cat.id} style={styles.categoryCard}>
                    <View style={styles.categoryHeader}>
                      <Text style={styles.categoryTitle}>{cat.name}</Text>
                      <View style={styles.unitCountBadge}>
                        <Text style={styles.unitCountText}>{count} Units Linked</Text>
                      </View>
                    </View>
                    <Text style={styles.categoryDesc}>
                      {cat.description || 'No description provided'}
                    </Text>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      )}

      {/* ================= MODAL: ADD UNIT ================= */}
      <Modal visible={uomModalVisible} animationType="slide" transparent onRequestClose={() => setUomModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Dynamic Unit (UOM)</Text>
              <TouchableOpacity onPress={() => setUomModalVisible(false)}>
                <Icon name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Select Measurement Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setUomCatId(c.id)}
                    style={[styles.filterChip, uomCatId === c.id ? styles.filterChipActive : null]}
                  >
                    <Text style={[styles.filterChipText, uomCatId === c.id ? styles.filterChipTextActive : null]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.formLabel}>Unit Full Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Box of 50 Pieces"
                value={uomName}
                onChangeText={setUomName}
              />

              <Text style={styles.formLabel}>Unit Symbol / Short Code *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Box, Kg, Nos, Mtr"
                value={uomSymbol}
                onChangeText={setUomSymbol}
              />

              <Text style={styles.formLabel}>Conversion Ratio relative to Base Unit</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 50 (if 1 Box = 50 Base Units)"
                keyboardType="numeric"
                value={uomRatio}
                onChangeText={setUomRatio}
              />

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>Is this the Base Unit of the Category?</Text>
                  <Text style={styles.switchSub}>Standard reference unit (Ratio = 1)</Text>
                </View>
                <Switch
                  value={uomIsBase}
                  onValueChange={setUomIsBase}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button title="Cancel" variant="outline" size="md" onPress={() => setUomModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Save Unit" variant="primary" size="md" loading={savingUom} onPress={handleCreateUom} style={{ flex: 1.5, marginLeft: 8 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL: ADD UOM CATEGORY ================= */}
      <Modal visible={catModalVisible} animationType="slide" transparent onRequestClose={() => setCatModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Measurement Category</Text>
              <TouchableOpacity onPress={() => setCatModalVisible(false)}>
                <Icon name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.formLabel}>Category Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Electric Power, Surface Area"
                value={catName}
                onChangeText={setCatName}
              />

              <Text style={styles.formLabel}>Description (Optional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Describe units under this measurement class..."
                value={catDesc}
                onChangeText={setCatDesc}
              />
            </View>

            <View style={styles.modalFooter}>
              <Button title="Cancel" variant="outline" size="md" onPress={() => setCatModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Create Category" variant="primary" size="md" loading={savingCat} onPress={handleCreateCategory} style={{ flex: 1.5, marginLeft: 8 }} />
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
  subTabsWrap: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 3,
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  subTabBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  subTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  subTabTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  content: {
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
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  unitCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
  },
  unitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symbolBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  symbolText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  unitName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  unitCategoryText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  baseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  baseBadgeText: {
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
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  unitCountBadge: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  unitCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  categoryDesc: {
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
