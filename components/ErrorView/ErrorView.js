import { StyleSheet, Text, View } from "react-native";
import { theme } from "../../styles/theme";

export const ErrorView = ({ message }) => (
  <View style={styles.container}>
    <Text style={styles.errorText}>Error: {message}</Text>
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
  errorText: {
    color: "#ff6b6b",
    textAlign: "center",
  },
});
