import { StyleSheet, Text, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { theme } from "../../styles/theme";

export const LoadingIndicator = ({ loadingMessage = undefined, ...props }) => (
  <View style={[styles.container, props.styles]}>
    <ActivityIndicator color={theme.colors.secondary} {...props} />
    {loadingMessage && <Text style={styles.message}>{loadingMessage}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  message: {
    color: theme.colors.textSecondary,
    marginTop: 10,
  },
});
