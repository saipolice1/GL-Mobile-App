import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useWixSession } from "../../../authentication/session";
import { LoginForm } from "../../../components/Form/LoginForm";
import { theme } from "../../../styles/theme";
import Routes from "../../../routes/routes";

export const SignInView = ({ navigation }) => {
  const { sessionLoading } = useWixSession();

  return (
    <View style={styles.container}>
      <LoginForm
        navigation={navigation}
        loading={sessionLoading}
        disabled={sessionLoading}
      />
      
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
