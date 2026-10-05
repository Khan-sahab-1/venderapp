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
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';

export const LoginScreen: React.FC = () => {
  const { login, isLoading, apiBaseUrl } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter both vendor login and password');
      return;
    }
    setError('');
    try {
      await login(username.trim(), password.trim());
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    }
  };

  const handleQuickDemo = async () => {
    setUsername('admin');
    setPassword('admin');
    setError('');
    try {
      await login('admin', 'admin');
    } catch (err: any) {
      setError(err.message || 'Quick demo login failed.');
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
            <Text style={styles.brandTitle}>Vendor Portal</Text>
            <Text style={styles.brandSubtitle}>
              Live Gateway Sync with Odoo ERP
            </Text>
            <Text style={styles.gatewayHostText}>
              Host: {apiBaseUrl}
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Sign In to Your Account</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vendor Login (Email / Username)</Text>
              <View style={styles.inputWrapper}>
                <Icon name="user" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="admin or vendor email"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Icon name="file-text" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
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
              <Text style={styles.dividerText}>QUICK CONNECT</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title="Connect via Live Vendor (admin / admin)"
              variant="outline"
              size="md"
              loading={isLoading}
              onPress={handleQuickDemo}
            />
          </View>

          {/* Footer note */}
          <View style={styles.footer}>
            <Icon name="building" size={14} color={colors.textMuted} />
            <Text style={styles.footerText}>
              Connected to Swagger API (192.168.1.6:4000)
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
    marginBottom: 24,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  gatewayHostText: {
    fontSize: 11,
    color: colors.primaryDark,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
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
    marginBottom: 20,
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
    marginBottom: 18,
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
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  loginBtn: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
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
    paddingHorizontal: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 6,
    fontWeight: '500',
  },
});
