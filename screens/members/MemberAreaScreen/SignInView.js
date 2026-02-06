import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useWixSession } from "../../../authentication/session";
import { LoginForm } from "../../../components/Form/LoginForm";
import { theme } from "../../../styles/theme";

export const SignInView = ({ navigation }) => {
  const { sessionLoading } = useWixSession();

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
});
