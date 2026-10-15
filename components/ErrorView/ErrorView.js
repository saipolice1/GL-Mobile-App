import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "../../styles/theme";

export const ErrorView = ({ message, onRetry }) => (
  <View style={styles.container}>
    <Text style={styles.errorTitle}>Something went wrong</Text>
    <Text style={styles.errorText}>{message || "Please try again."}</Text>
    {onRetry ? (
      <TouchableOpacity
        style={styles.retryButton}
        onPress={onRetry}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Try again"
      >
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    padding: 20,
  },
  errorTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: theme.colors.accent,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  retryText: {
    color: theme.colors.textLight,
    fontSize: 15,
    fontWeight: "600",
  },
});
