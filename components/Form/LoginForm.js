import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { HelperText, TextInput } from "react-native-paper";
import { useLoginHandler } from "../../authentication/LoginHandler";
import { useWixSession } from "../../authentication/session";
import { DismissKeyboardSafeAreaView } from "../DismissKeyboardHOC/DismissKeyboardSafeAreaView";
import Routes from "../../routes/routes";
import { theme } from "../../styles/theme";
import { Ionicons } from "@expo/vector-icons";

export function LoginForm({ navigation, loading, disabled, onWixLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { sessionLoading } = useWixSession();
  const { login } = useLoginHandler();

  const loginHandler = async () => {
    setError(false);
    try {
      await login(email, password);
      if (navigation) {
        navigation.navigate(Routes.Home);
      }
    } catch (e) {
      setErrorMessage(e.toString());
      setError(true);
    }
  };

  return (
    <DismissKeyboardSafeAreaView style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <View style={styles.inputView}>
        <TextInput
          theme={{ colors: { primary: theme.colors.accent } }}
          style={styles.input}
          value={email}
          mode={"outlined"}
          onChangeText={(text) => {
            setEmail(text);
            setError(false);
          }}
          autoCorrect={false}
          autoCapitalize="none"
          label={"Email"}
          textColor={theme.colors.text}
        />
        <TextInput
          theme={{ colors: { primary: theme.colors.accent } }}
          mode={"outlined"}
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError(false);
          }}
          autoCorrect={false}
          autoCapitalize="none"
          label={"Password"}
          textColor={theme.colors.text}
        />
        <TouchableOpacity
          style={styles.loginButton}
          onPress={loginHandler}
          disabled={sessionLoading}
          activeOpacity={0.8}
        >
          {sessionLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>
        {!sessionLoading && (
          <HelperText type="error" visible={error}>
            {errorMessage}
          </HelperText>
        )}
        
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.divider} />
        </View>
        
        <TouchableOpacity
          style={styles.googleButton}
          onPress={onWixLogin}
          disabled={disabled || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.text} />
          ) : (
            <View style={styles.googleButtonContent}>
              <View style={styles.googleIconContainer}>
                <Text style={styles.googleG}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </DismissKeyboardSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 40,
    color: theme.colors.text,
    letterSpacing: 1,
  },
  inputView: {
    gap: 15,
    width: "100%",
    paddingHorizontal: 30,
  },
  input: {
    minWidth: "100%",
    backgroundColor: theme.colors.surface,
  },
  loginButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  wixLoginButton: {
    borderColor: theme.colors.accent,
    borderWidth: 1.5,
    backgroundColor: "transparent",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    paddingHorizontal: 12,
  },
  googleButton: {
    borderColor: theme.colors.border,
    borderWidth: 1.5,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  googleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  googleIconContainer: {
    width: 22,
    height: 22,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  googleG: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4285F4",
  },
  googleButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "500",
  },
});
