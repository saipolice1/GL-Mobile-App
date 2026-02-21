/**
 * ForceUpdateModal.js
 *
 * Full-screen, non-dismissible modal shown when the running app version
 * is below the minimum required version. The user must tap "Update Now"
 * to open the appropriate app store listing.
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
  Image,
  SafeAreaView,
} from 'react-native';
import { theme } from '../../styles/theme';

const IOS_STORE_URL = 'https://apps.apple.com/us/app/grafton-liquor/id6758839608';
const ANDROID_STORE_URL =
  'https://play.google.com/store/apps/details?id=nz.co.graftonliquor.app';

export function ForceUpdateModal({ visible, iosUrl, androidUrl }) {
  const storeUrl =
    Platform.OS === 'ios'
      ? (iosUrl || IOS_STORE_URL)
      : (androidUrl || ANDROID_STORE_URL);

  const handleUpdate = () => {
    Linking.openURL(storeUrl).catch(() => {
      // Fallback to store root if deep link fails
      const fallback =
        Platform.OS === 'ios'
          ? 'https://apps.apple.com'
          : 'https://play.google.com/store';
      Linking.openURL(fallback);
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
      // Prevent Android back button from dismissing
      onRequestClose={() => {}}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Logo / brand mark */}
          <View style={styles.iconWrapper}>
            <Text style={styles.iconEmoji}>🍷</Text>
          </View>

          <Text style={styles.heading}>Update Required</Text>

          <Text style={styles.body}>
            A new version of Grafton Liquor is available with important
            improvements. Please update the app to continue.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={handleUpdate}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Update Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
  },
  iconEmoji: {
    fontSize: 52,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  body: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 48,
  },
  button: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: theme.colors.textLight,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
