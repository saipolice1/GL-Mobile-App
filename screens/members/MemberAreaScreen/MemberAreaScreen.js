import React from "react";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { WebView } from "react-native-webview";
import { SimpleHeader } from "../../../components/Header/SimpleHeader";
import { theme } from "../../../styles/theme";
import { HelpChatScreen } from "../../help/HelpChatScreen";
import { WebViewScreen, WIX_PAGES } from "../../webview/WebViewScreen";
import Routes from "../../../routes/routes";

const Stack = createNativeStackNavigator();

// Main Account Screen - Just shows Wix Login/Account WebView
const MemberAreaMain = ({ navigation }) => {
  const [isLoading, setIsLoading] = React.useState(true);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <SimpleHeader
        title={"My Account"}
        backIcon={false}
        navigation={navigation}
      />
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {isLoading && (
          <View style={{ 
            position: 'absolute', 
            top: 0, left: 0, right: 0, bottom: 0, 
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: theme.colors.background,
            zIndex: 1
          }}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
          </View>
        )}
        <WebView
          source={{ uri: WIX_PAGES.ACCOUNT }}
          style={{ flex: 1, backgroundColor: theme.colors.background }}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
        />
      </View>
    </SafeAreaView>
  );
};

export const MemberAreaScreen = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MemberAreaMain" component={MemberAreaMain} />
      <Stack.Screen name={Routes.HelpChat} component={HelpChatScreen} />
      <Stack.Screen name={Routes.WebView} component={WebViewScreen} />
    </Stack.Navigator>
  );
};
