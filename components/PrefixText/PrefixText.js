import { Text, View } from "react-native";
import { Icon } from "react-native-paper";
import { theme } from "../../styles/theme";

export const PrefixText = ({ children, icon, iconColor, style }) => {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Icon
        source={icon}
        size={20}
        color={`${iconColor ? iconColor : theme.colors.gold}`}
      />
      <Text style={[{ marginLeft: 5, color: theme.colors.textSecondary }, style]}>{children}</Text>
    </View>
  );
};
