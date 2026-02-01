import { StyleSheet, TextInput, View } from "react-native";
import { HelperText, Icon } from "react-native-paper";
import { theme } from "../../styles/theme";

export const InputPrefix = ({
  iconName,
  error = false,
  errorMessage = "",
  ...props
}) => {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          props.style,
          {
            borderColor: error ? "#ff6b6b" : theme.colors.gold + "60",
          },
        ]}
      >
        <Icon source={iconName} size={24} color={theme.colors.gold} />
        <TextInput 
          style={styles.input} 
          placeholderTextColor={theme.colors.textSecondary}
          {...props} 
        />
      </View>
      {error && (
        <HelperText type="error" visible={error}>
          {errorMessage}
        </HelperText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
    flexDirection: "column",
    justifyContent: "center",
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: theme.colors.gold + "60",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.surface,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 5,
  },
  error: {
    color: "#ff6b6b",
    fontSize: 12,
    paddingHorizontal: 20,
  },
});
