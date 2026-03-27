import { Modal, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../context/NotificationContext';
import { theme } from '../../styles/theme';

export const NotificationPermissionBanner = () => {
  const { showPermissionReminder, dismissReminder } = useNotifications();

  const handleEnable = async () => {
    await dismissReminder();
    Linking.openSettings();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showPermissionReminder}
      onRequestClose={dismissReminder}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="notifications" size={36} color="#000" />
          </View>

          {/* Text */}
          <Text style={styles.title}>Stay in the loop</Text>
          <Text style={styles.body}>
            Get notified about deals, new arrivals, and back-in-stock alerts from Grafton Liquor.
          </Text>

          {/* Buttons */}
          <TouchableOpacity style={styles.enableBtn} onPress={handleEnable}>
            <Text style={styles.enableText}>Turn on Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dismissBtn} onPress={dismissReminder}>
            <Text style={styles.dismissText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.surfaceVariant,
    marginBottom: 28,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  enableBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  enableText: {
    color: theme.colors.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
  dismissBtn: {
    paddingVertical: 10,
  },
  dismissText: {
    color: theme.colors.textMuted,
    fontSize: 15,
  },
});
