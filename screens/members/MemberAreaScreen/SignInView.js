import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLoginByWixManagedPages } from "../../../authentication/LoginHandler";
import { useWixSession } from "../../../authentication/session";
import { LoginForm } from "../../../components/Form/LoginForm";
import { theme } from "../../../styles/theme";
import Routes from "../../../routes/routes";
import { WIX_PAGES } from "../../webview/WebViewScreen";

export const SignInView = ({ navigation }) => {
  const { sessionLoading } = useWixSession();
  const { openBrowser } = useLoginByWixManagedPages();

  return (
    <View style={styles.container}>
      <LoginForm
        loading={sessionLoading}
        disabled={sessionLoading}
        onWixLogin={() => {
          openBrowser();
        }}
      />
      
      {/* Google Sign-In via WebView */}
      <TouchableOpacity
        style={styles.googleButton}
        onPress={() => navigation?.navigate(Routes.WebView, {
          url: WIX_PAGES.LOGIN,
          title: 'Sign In with Google'
        })}
        activeOpacity={0.7}
      >
        <View style={styles.googleIcon}>
          <Ionicons name="logo-google" size={20} color="#4285F4" />
        </View>
        <Text style={styles.googleText}>Sign in with Google</Text>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
      </TouchableOpacity>
      
      {/* Help & Support Link */}
      <TouchableOpacity
        style={styles.helpButton}
        onPress={() => navigation?.navigate(Routes.HelpChat)}
        activeOpacity={0.7}
      >
        <View style={styles.helpIcon}>
          <Ionicons name="help-circle-outline" size={22} color={theme.colors.accent} />
        </View>
        <Text style={styles.helpText}>Need Help?</Text>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 30,
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 30,
    marginBottom: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  helpIcon: {
    marginRight: 8,
  },
  helpText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
});
