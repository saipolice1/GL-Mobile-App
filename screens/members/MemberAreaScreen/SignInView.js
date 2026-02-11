import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { useWixSession } from "../../../authentication/session";
import { LoginForm } from "../../../components/Form/LoginForm";
import { theme } from "../../../styles/theme";

export const SignInView = ({ navigation }) => {
  const { sessionLoading } = useWixSession();

  // Show a clean loading screen while login is processing
  if (sessionLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={styles.loadingText}>Signing you in...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LoginForm
        navigation={navigation}
        loading={sessionLoading}
        disabled={sessionLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
});
