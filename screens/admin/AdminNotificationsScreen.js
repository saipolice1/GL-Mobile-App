import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

const QUICK_TEMPLATES = [
  {
    label: '🍺 Weekend Special',
    title: 'Weekend Special',
    body: 'Check out this weekend\'s deals — exclusive discounts on selected products!',
  },
  {
    label: '🚚 Free Delivery',
    title: 'Free Delivery Today',
    body: 'Order now and get free delivery on orders over $50. Today only!',
  },
  {
    label: '🆕 New Arrivals',
    title: 'New Arrivals Are Here',
    body: 'Fresh stock just landed — come check out our latest additions.',
  },
  {
    label: '🎉 Promotion',
    title: 'Special Offer',
    body: 'Don\'t miss out on our latest promotion. Limited time only!',
  },
];

export function AdminNotificationsScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const handleSend = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a notification title.');
      return;
    }
    if (!body.trim()) {
      Alert.alert('Missing Message', 'Please enter a notification message.');
      return;
    }

    Alert.alert(
      'Send Push Notification',
      `Send to ALL users?\n\n"${title}"\n${body}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          style: 'destructive',
          onPress: async () => {
            setIsSending(true);
            setLastResult(null);
            try {
              const response = await fetch(
                'https://www.graftonliquor.co.nz/_functions/sendPushNotification',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ title: title.trim(), body: body.trim() }),
                }
              );
              const result = await response.json();
              if (response.ok) {
                setLastResult({ success: true, sent: result.sent });
                setTitle('');
                setBody('');
                Alert.alert('Sent!', `Notification delivered to ${result.sent ?? 'all'} users.`);
              } else {
                setLastResult({ success: false, error: result.error || 'Unknown error' });
                Alert.alert('Failed', result.error || 'Failed to send notification.');
              }
            } catch (err) {
              setLastResult({ success: false, error: err.message });
              Alert.alert('Error', `Could not reach server: ${err.message}`);
            } finally {
              setIsSending(false);
            }
          },
        },
      ]
    );
  };

  const applyTemplate = (template) => {
    setTitle(template.title);
    setBody(template.body);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Push Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionLabel}>Quick Templates</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesRow}>
          {QUICK_TEMPLATES.map((t) => (
            <TouchableOpacity
              key={t.label}
              style={styles.templateChip}
              onPress={() => applyTemplate(t)}
              activeOpacity={0.7}
            >
              <Text style={styles.templateChipText}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionLabel}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Weekend Special 🍺"
          placeholderTextColor={theme.colors.textMuted}
          value={title}
          onChangeText={setTitle}
          maxLength={65}
        />
        <Text style={styles.charCount}>{title.length}/65</Text>

        <Text style={styles.sectionLabel}>Message</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="e.g. Check out this weekend's deals — exclusive discounts on selected products!"
          placeholderTextColor={theme.colors.textMuted}
          value={body}
          onChangeText={setBody}
          multiline
          numberOfLines={4}
          maxLength={178}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{body.length}/178</Text>

        {/* Preview */}
        {(title || body) ? (
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>Preview</Text>
            <View style={styles.previewNotification}>
              <View style={styles.previewIcon}>
                <Text style={{ fontSize: 18 }}>🍺</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.previewTitle} numberOfLines={1}>
                  {title || 'Title'}
                </Text>
                <Text style={styles.previewBody} numberOfLines={3}>
                  {body || 'Message body...'}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {lastResult && (
          <View style={[styles.resultBanner, lastResult.success ? styles.resultSuccess : styles.resultError]}>
            <Ionicons
              name={lastResult.success ? 'checkmark-circle' : 'alert-circle'}
              size={18}
              color={lastResult.success ? '#10B981' : '#EF4444'}
            />
            <Text style={[styles.resultText, { color: lastResult.success ? '#10B981' : '#EF4444' }]}>
              {lastResult.success
                ? `Sent to ${lastResult.sent ?? 'all'} users`
                : `Error: ${lastResult.error}`}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
          onPress={handleSend}
          activeOpacity={0.8}
          disabled={isSending}
        >
          {isSending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.sendButtonText}>Send to All Users</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 20,
  },
  templatesRow: {
    marginBottom: 4,
  },
  templateChip: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  templateChipText: {
    fontSize: 13,
    color: theme.colors.text,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.text,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  previewCard: {
    marginTop: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  previewNotification: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  previewIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  previewBody: {
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  resultSuccess: {
    backgroundColor: '#F0FDF4',
  },
  resultError: {
    backgroundColor: '#FEF2F2',
  },
  resultText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 28,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
