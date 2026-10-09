import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';

export const ChangePasswordScreen: React.FC = () => {
  const { user, changePassword, logout, isLoading } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('9090');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChangePassword = async () => {
    setError('');

    if (!currentPassword.trim()) {
      setError('Please enter your current temporary password');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please verify.');
      return;
    }

    if (newPassword === '9090') {
      setError('You cannot use the temporary initial password (9090) as your permanent password.');
      return;
    }

    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
      Alert.alert(
        'Password Updated Successfully',
        'Your account is now secured. Welcome to your custom ERP tenant dashboard!',
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Check your current password.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Warning Badge */}
          <View style={styles.headerContainer}>
            <View style={styles.securityIconBadge}>
              <Icon name="check-circle" size={32} color="#D97706" />
            </View>
            <Text style={styles.screenTitle}>First-Time Password Setup</Text>
            <Text style={styles.screenSubtitle}>
              Action Required for Tenant Security
            </Text>
          </View>

          {/* Account info card */}
          <View style={styles.accountCard}>
            <View style={styles.tenantTagRow}>
              <View style={styles.tenantBadge}>
                <Text style={styles.tenantBadgeText}>TENANT ISOLATED</Text>
              </View>
              <Text style={styles.roleText}>Role: {user?.role?.toUpperCase() || 'ADMIN'}</Text>
            </View>
            <Text style={styles.companyName} numberOfLines={1}>
              {user?.companyName || 'Vendor Company'}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.infoNotice}>
              Your account was synchronized from Odoo Vendor Master with the default temporary password{' '}
              <Text style={styles.highlightText}>9090</Text>. You must set a permanent password before accessing ERP operations.
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {success ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>Password updated! Redirecting to ERP...</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Temporary Password</Text>
              <View style={styles.inputWrapper}>
                <Icon name="file-text" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="9090"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Secure Password (min 6 characters)</Text>
              <View style={styles.inputWrapper}>
                <Icon name="file-text" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <View style={styles.inputWrapper}>
                <Icon name="file-text" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter new password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                />
              </View>
            </View>

            <Button
              title="Secure Account & Enter ERP"
              variant="primary"
              size="lg"
              loading={isLoading}
              onPress={handleChangePassword}
              style={styles.submitBtn}
            />

            <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
              <Text style={styles.logoutText}>Cancel & Sign Out</Text>
            </TouchableOpacity>
          </View>

          {/* Footer note */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Note: Manually set passwords will never be overwritten by Odoo sync.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  securityIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  screenSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  accountCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tenantTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tenantBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tenantBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  companyName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  infoNotice: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 18,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  highlightText: {
    fontWeight: '700',
    color: colors.primaryDark,
  },
  errorBox: {
    backgroundColor: colors.cancelledBg,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cancelledBorder,
    marginBottom: 16,
  },
  errorText: {
    color: colors.cancelled,
    fontSize: 13,
    fontWeight: '600',
  },
  successBox: {
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#86EFAC',
    marginBottom: 16,
  },
  successText: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: 10,
  },
  logoutBtn: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
