/**
 * AppErrorBoundary.js
 *
 * App-wide error boundary backed by Sentry. Any render crash below it is
 * reported to Sentry and replaced with a friendly fallback screen that lets
 * the user reset the boundary and keep shopping.
 */

import * as Sentry from '@sentry/react-native';
import { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { theme } from '../../styles/theme';

function CrashFallback({ resetError }) {
  // The crash may happen before the splash screen is dismissed — make sure
  // the fallback is actually visible.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: theme.colors.background,
      }}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: '700',
          color: theme.colors.text,
          marginBottom: 12,
        }}
      >
        Something went wrong
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: theme.colors.textMuted,
          textAlign: 'center',
          marginBottom: 32,
        }}
      >
        Sorry about that — the error has been reported. Tap below to keep shopping.
      </Text>
      <TouchableOpacity
        onPress={resetError}
        activeOpacity={0.8}
        style={{
          backgroundColor: theme.colors.accent,
          borderRadius: 8,
          paddingVertical: 14,
          paddingHorizontal: 32,
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

export function AppErrorBoundary({ children }) {
  return (
    <Sentry.ErrorBoundary fallback={({ resetError }) => <CrashFallback resetError={resetError} />}>
      {children}
    </Sentry.ErrorBoundary>
  );
}
