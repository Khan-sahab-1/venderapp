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
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';

export const LoginScreen: React.FC = () => {
  const { login, isLoading, apiBaseUrl, setApiBaseUrl } = useAuth();
  const [email, setEmail] = useState('aditya@gmail.com');
  const [password, setPassword] = useState('9090');
  const [error, setError] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [customUrl, setCustomUrl] = useState(apiBaseUrl);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both vendor email and password');
      return;
    }
    setError('');
    try {
      await login(email.trim(), password.trim());
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    }
  };

  const handleQuickVendorSelect = (selectedEmail: string, selectedPass: string) => {
    setEmail(selectedEmail);
    setPassword(selectedPass);
    setError('');
  };

  const handleSaveApiUrl = () => {
    const clean = customUrl.trim();
    if (clean) {
      setApiBaseUrl(clean);
      setShowConfig(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Logo & Header */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Icon name="package" size={32} color={colors.primary} />
            </View>
            <Text style={styles.brandTitle}>Independent ERP Portal</Text>
            <Text style={styles.brandSubtitle}>
              Multi-Tenant Architecture • Private Database Scope
            </Text>
            <TouchableOpacity
              onPress={() => setShowConfig(!showConfig)}
              activeOpacity={0.7}
              style={styles.gatewayHostBtn}
            >
              <Text style={styles.gatewayHostText}>
                API: {apiBaseUrl} ⚙️
              </Text>
            </TouchableOpacity>
          </View>

          {/* Optional Gateway Config */}
          {showConfig ? (
            <View style={styles.configCard}>
              <Text style={styles.configLabel}>Change API Base URL:</Text>
              <TextInput
                style={styles.configInput}
                value={customUrl}
                onChangeText={setCustomUrl}
                placeholder="http://10.0.2.2:4000/api"
                autoCapitalize="none"
              />
              <Button title="Apply URL" size="sm" variant="outline" onPress={handleSaveApiUrl} />
            </View>
          ) : null}

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Sign In to Tenant ERP</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vendor Login Email</Text>
              <View style={styles.inputWrapper}>
                <Icon name="user" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="e.g. aditya@gmail.com"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                <Text style={styles.initialPasswordTip}>Initial temp pass: 9090</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Icon name="file-text" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                />
              </View>
            </View>

            <Button
              title="Sign In"
              variant="primary"
              size="lg"
              loading={isLoading}
              onPress={handleLogin}
              style={styles.loginBtn}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>QUICK VENDOR TENANTS</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Quick Demo Pickers */}
            <View style={styles.quickVendorsList}>
              <TouchableOpacity
                style={styles.quickVendorItem}
                onPress={() => handleQuickVendorSelect('aditya@gmail.com', 'AdityaNewPass2026!')}
              >
                <View style={styles.quickVendorLeft}>
                  <Text style={styles.quickVendorName}>Aditya Dheeraj (Updated Pass)</Text>
                  <Text style={styles.quickVendorEmail}>aditya@gmail.com</Text>
                </View>
                <Text style={styles.quickSelectBadge}>Fill</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickVendorItem}
                onPress={() => handleQuickVendorSelect('dheeraj.ku@arkess.com', '9090')}
              >
                <View style={styles.quickVendorLeft}>
                  <Text style={styles.quickVendorName}>A.V. Engineering Works (Initial 9090)</Text>
                  <Text style={styles.quickVendorEmail}>dheeraj.ku@arkess.com</Text>
                </View>
                <Text style={styles.quickSelectBadge}>Fill</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickVendorItem}
                onPress={() => handleQuickVendorSelect('vendor@gmail.com', '9090')}
              >
                <View style={styles.quickVendorLeft}>
                  <Text style={styles.quickVendorName}>Aged Partner Balance (Initial 9090)</Text>
                  <Text style={styles.quickVendorEmail}>vendor@gmail.com</Text>
                </View>
                <Text style={styles.quickSelectBadge}>Fill</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer note */}
          <View style={styles.footer}>
            <Icon name="check-circle" size={14} color="#15803D" />
            <Text style={styles.footerText}>
              Tenant Isolation Enforced via JWT companyId
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
    justifyContent: 'center',
    padding: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  gatewayHostBtn: {
    marginTop: 8,
  },
  gatewayHostText: {
    fontSize: 11,
    color: colors.primaryDark,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    fontWeight: '600',
  },
  configCard: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  configLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  configInput: {
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    fontSize: 13,
    marginBottom: 8,
  },
  card: {
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
  cardHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 18,
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
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  initialPasswordTip: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '700',
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
  loginBtn: {
    marginTop: 6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    paddingHorizontal: 10,
  },
  quickVendorsList: {
    gap: 8,
  },
  quickVendorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickVendorLeft: {
    flex: 1,
    marginRight: 8,
  },
  quickVendorName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  quickVendorEmail: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  quickSelectBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#15803D',
    marginLeft: 6,
    fontWeight: '600',
  },
});
