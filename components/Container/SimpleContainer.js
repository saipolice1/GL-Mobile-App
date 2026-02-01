import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SimpleHeader } from "../Header/SimpleHeader";
import { theme } from "../../styles/theme";

export const SimpleContainer = ({
  children,
  navigation,
  title,
  backIcon = true,
  styles,
  onBackPress,
}) => {
  return (
    <>
      <SafeAreaView style={defaultStyles.safeArea} />
      <SimpleHeader
        navigation={navigation}
        title={title}
        backIcon={backIcon}
        onBackPress={onBackPress}
      />
      <View style={[defaultStyles.container, styles]}>{children}</View>
    </>
  );
};

const defaultStyles = StyleSheet.create({
  safeArea: {
    flex: 0,
    backgroundColor: theme.colors.surface,
  },
  container: {
    flexDirection: "column",
    height: "100%",
    backgroundColor: theme.colors.primary,
    flex: 1,
  },
});
