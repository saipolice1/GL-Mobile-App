import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Image,
  Dimensions,
  Linking,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { theme } from '../../styles/theme';

const { width, height } = Dimensions.get('window');

const AGE_VERIFIED_KEY = 'grafton_liquor_age_verified';

export const AgeVerification = ({ children }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAgeVerification();
  }, []);

  const checkAgeVerification = async () => {
    try {
      const verified = await SecureStore.getItemAsync(AGE_VERIFIED_KEY);
      if (verified === 'true') {
        setIsVerified(true);
      }
    } catch (error) {
      console.error('Error checking age verification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      await SecureStore.setItemAsync(AGE_VERIFIED_KEY, 'true');
      setIsVerified(true);
    } catch (error) {
      console.error('Error saving age verification:', error);
      setIsVerified(true);
    }
  };

  const handleExit = () => {
    Linking.openURL('https://www.google.com');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (isVerified) {
    return children;
  }

  return (
    <Modal
      visible={!isVerified}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <View style={styles.overlay} />
        
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>GRAFTON</Text>
            <Text style={styles.logoSubtext}>LIQUOR</Text>
          </View>

          {/* Age Gate Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.ageText}>18+</Text>
          </View>

          {/* Message */}
          <Text style={styles.title}>Age Verification Required</Text>
          <Text style={styles.subtitle}>
            You must be 18 years or older to enter this site.
          </Text>
          <Text style={styles.description}>
            By entering this site, you agree that you are of legal drinking age in New Zealand.
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Pressable
              style={styles.verifyButton}
              onPress={handleVerify}
            >
              <Text style={styles.verifyButtonText}>
                I am 18 or older
              </Text>
            </Pressable>

            <Pressable
              style={styles.exitButton}
              onPress={handleExit}
            >
              <Text style={styles.exitButtonText}>
                I am under 18
              </Text>
            </Pressable>
          </View>

          {/* Legal Notice */}
          <Text style={styles.legalText}>
            It is an offence to supply alcohol to a person under the age of 18 years.
          </Text>
          
          <Text style={styles.licenseText}>
            Licence: 007/OFF/9130/2022{'\n'}
            Guru Krupa Investments Ltd
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  loadingText: {
    color: theme.colors.text,
    fontSize: 18,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  content: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.gold,
    letterSpacing: 4,
  },
  logoSubtext: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    letterSpacing: 8,
    marginTop: 4,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: theme.colors.gold,
  },
  ageText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.gold,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  verifyButton: {
    backgroundColor: theme.colors.gold,
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  verifyButtonText: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  exitButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.textMuted,
    width: '100%',
    alignItems: 'center',
  },
  exitButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  legalText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  licenseText: {
    fontSize: 10,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 16,
  },
});

export default AgeVerification;
