import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HelpChatScreen } from "../../help/HelpChatScreen";
import { WebViewScreen } from "../../webview/WebViewScreen";
import { SignInView } from "./SignInView";
import { MemberView } from "./MemberView";
import { OrderDetailsScreen } from "../../store/orders/OrderDetailsScreen";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { wixCient } from "../../../authentication/wixClient";
import { useWixSession } from "../../../authentication/session";
import { LoadingIndicator } from "../../../components/LoadingIndicator/LoadingIndicator";
import Routes from "../../../routes/routes";

const Stack = createNativeStackNavigator();

// Main Account Screen - Shows SignIn or Member View based on login status
const MemberAreaMain = ({ navigation }) => {
  const { session } = useWixSession();
  const queryClient = useQueryClient();
  
  // Check if we have member tokens (not just visitor tokens)
  const hasMemberTokens = !!(session?.refreshToken);

  // If logged in, check if we can fetch member data
  const getCurrentMemberRes = useQuery({
    queryKey: ["currentMember", session?.accessToken],
    queryFn: () => wixCient.members.getCurrentMember({ fieldSet: "FULL" }),
    enabled: hasMemberTokens,
    retry: false,
  });

  // Show loading while checking member status
  if (hasMemberTokens && getCurrentMemberRes.isLoading) {
    return <LoadingIndicator />;
  }

  // If logged in and has member data, show member view
  // Otherwise show sign in view
  return hasMemberTokens && getCurrentMemberRes.data?.member ? (
    <MemberView navigation={navigation} />
  ) : (
    <SignInView navigation={navigation} />
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
      <Stack.Screen name={Routes.OrderDetails} component={OrderDetailsScreen} />
    </Stack.Navigator>
  );
};
