import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { useTheme, getTheme } from '../utils/ThemeContext';
import { Lock, Mail, ChevronRight, Activity } from 'lucide-react-native';

interface LoginScreenProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  isSignUp: boolean;
  setIsSignUp: (val: boolean) => void;
  authError: string | null;
  authLoading: boolean;
  handleAuth: () => void;
  dark: boolean;
}

export function LoginScreen({
  email, setEmail, password, setPassword,
  isSignUp, setIsSignUp, authError, authLoading, handleAuth, dark
}: LoginScreenProps) {
  const t = getTheme(dark);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: t.page }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Logo / Header */}
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.title, { color: t.ink.primary }]}>StepSense</Text>
          <Text style={[styles.subtitle, { color: t.ink.secondary }]}>
            {isSignUp ? 'Create your clinical profile' : 'Sign in to access your sessions'}
          </Text>
        </View>

        {/* Auth Form */}
        <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
          {authError && (
            <View style={[styles.errorBox, { backgroundColor: t.status.criticalBg, borderColor: t.status.critical + '44' }]}>
              <Text style={[styles.errorText, { color: t.status.critical }]}>{authError}</Text>
            </View>
          )}

          <View style={[styles.inputGroup, { backgroundColor: t.cardSubtle, borderColor: t.border }]}>
            <Mail color={t.ink.tertiary} size={18} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: t.ink.primary }]}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email Address"
              placeholderTextColor={t.ink.tertiary}
            />
          </View>

          <View style={[styles.inputGroup, { backgroundColor: t.cardSubtle, borderColor: t.border, marginTop: 12 }]}>
            <Lock color={t.ink.tertiary} size={18} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: t.ink.primary }]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Password"
              placeholderTextColor={t.ink.tertiary}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: authLoading ? t.border : t.accent.teal }]}
            onPress={handleAuth}
            disabled={authLoading}
          >
            {authLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.buttonText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
                <ChevronRight color="#FFF" size={18} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.switchButton}>
            <Text style={[styles.switchText, { color: t.ink.secondary }]}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={{ color: t.accent.teal, fontWeight: '700' }}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#FFF',
    elevation: 2,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,

    elevation: 4,
  },
  errorBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    height: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,

    elevation: 2,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  switchButton: {
    padding: 8,
  },
  switchText: {
    fontSize: 14,
  },
});
