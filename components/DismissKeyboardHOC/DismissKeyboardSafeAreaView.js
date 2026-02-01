import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DismissKeyboardHOC } from "./DismissKeyboardHOC";

// Use View wrapper with SafeAreaView inside to avoid layout issues
const SafeWrapper = ({ children, style, ...props }) => (
  <SafeAreaView style={style} edges={['top', 'bottom']} {...props}>
    {children}
  </SafeAreaView>
);

export const DismissKeyboardSafeAreaView = DismissKeyboardHOC(SafeWrapper);
