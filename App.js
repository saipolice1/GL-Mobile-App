import "./polyfills";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import * as React from "react";
import "react-native-gesture-handler";
import { PaperProvider, MD3LightTheme } from "react-native-paper";
import "react-native-url-polyfill/auto";
import { LoginHandler } from "./authentication/LoginHandler";
import { MemberHandler } from "./authentication/MemberHandler";
import { WixSessionProvider } from "./authentication/session";
import { initializeAuthSession } from "./authentication/wixSystemLogin";
import { LoadingIndicator } from "./components/LoadingIndicator/LoadingIndicator";
import { TabBar } from "./components/Tabs/Tabs";
import { AgeVerification } from "./components/AgeVerification/AgeVerification";
import { tabs } from "./data/tabs/data";
import { theme as appTheme } from "./styles/theme";
import { NotificationProvider } from "./context/NotificationContext";
import Routes from "./routes/routes";

// Initialize WebBrowser auth session on app startup
initializeAuthSession();

const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

// Grafton Liquor Navigation Theme - Clean Uber Eats Style
const GraftonNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: appTheme.colors.secondary,      // Black
    background: appTheme.colors.background,  // White
    card: appTheme.colors.background,        // White
    text: appTheme.colors.text,              // Black
    border: appTheme.colors.border,          // Light gray
    notification: appTheme.colors.accent,    // Green
  },
};

// Grafton Liquor Paper Theme - Light Theme
const GraftonPaperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: appTheme.colors.secondary,           // Black
    secondary: appTheme.colors.accent,            // Green
    background: appTheme.colors.background,       // White
    surface: appTheme.colors.surface,             // Light gray
    surfaceVariant: appTheme.colors.surfaceVariant,
    onPrimary: appTheme.colors.textLight,         // White on black
    onSecondary: appTheme.colors.textLight,       // White on green
    onSurface: appTheme.colors.text,              // Black
    onSurfaceVariant: appTheme.colors.textSecondary,
    outline: appTheme.colors.border,
    elevation: {
      level0: 'transparent',
      level1: appTheme.colors.surface,
      level2: appTheme.colors.surfaceVariant,
    },
  },
};

function App() {
  // System fonts are used - no custom font loading needed
  const clientId = process.env.EXPO_PUBLIC_WIX_CLIENT_ID || "";
  const navigationRef = React.useRef(null);

  // Handle notification taps - navigate to appropriate screen
  const handleNotificationTap = React.useCallback((data) => {
    if (!navigationRef.current) return;
    
    if (data?.type === 'order_update') {
      // Navigate to order details or cart
      navigationRef.current.navigate(Routes.Cart);
    } else if (data?.type === 'promo') {
      // Navigate to home or products
      navigationRef.current.navigate(Routes.Home);
    } else if (data?.type === 'cart_reminder') {
      navigationRef.current.navigate(Routes.Cart);
    }
  }, []);

  return (
    <PaperProvider theme={GraftonPaperTheme}>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider onNotificationTap={handleNotificationTap}>
          <WixSessionProvider clientId={clientId}>
            <MemberHandler>
              <AgeVerification>
                <LoginHandler>
                <NavigationContainer
                  ref={navigationRef}
                  theme={GraftonNavigationTheme}
                  linking={{
                    prefixes: [Linking.createURL("/")],
                    config: {
                      screens: {
                        Store: {
                          path: "store",
                          screens: {
                            CheckoutThankYou: "checkout/thank-you",
                            Cart: "cart",
                            Products: "products",
                            Product: "products/product",
                            Collections: "collections",
                          },
                        },
                      },
                    },
                  }}
                >
                  <Tab.Navigator
                    screenOptions={() => ({
                      headerShown: false,
                      tabBarLabelStyle: {
                        fontSize: 11,
                      },
                      tabBarStyle: {
                        backgroundColor: appTheme.colors.tabBar,
                      },
                      tabBarHideOnKeyboard: true,
                    })}
                    initialRouteName={tabs[0].name}
                    tabBar={(props) => <TabBar {...props} />}
                  >
                    {tabs.map((tab) => (
                      <Tab.Screen
                        options={{
                          tabBarIcon: tab.icon,
                        }}
                        name={tab.name}
                        component={tab.component}
                        navigationKey={tab.name}
                        key={tab.name}
                      />
                    ))}
                  </Tab.Navigator>
                </NavigationContainer>
              </LoginHandler>
            </AgeVerification>
          </MemberHandler>
          </WixSessionProvider>
        </NotificationProvider>
      </QueryClientProvider>
    </PaperProvider>
  );
}

export default App;
