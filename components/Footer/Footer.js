import { Linking, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { theme } from "../../styles/theme";

export const Footer = () => {
  return (
    <View style={localStyles.view}>
      <View style={localStyles.logoContainer}>
        <Text style={localStyles.logoText}>GRAFTON LIQUOR</Text>
      </View>
      
      <View style={localStyles.linksContainer}>
        <TouchableOpacity onPress={() => Linking.openURL("https://www.graftonliquor.co.nz/privacy-policy")}>
          <Text style={localStyles.linkText}>Privacy Policy</Text>
        </TouchableOpacity>
        <Text style={localStyles.separator}>|</Text>
        <TouchableOpacity onPress={() => Linking.openURL("https://www.graftonliquor.co.nz/shipping-policy")}>
          <Text style={localStyles.linkText}>Shipping</Text>
        </TouchableOpacity>
        <Text style={localStyles.separator}>|</Text>
        <TouchableOpacity onPress={() => Linking.openURL("https://www.graftonliquor.co.nz/refund-policy")}>
          <Text style={localStyles.linkText}>Returns</Text>
        </TouchableOpacity>
      </View>
      
      <View style={localStyles.licenseContainer}>
        <Text style={localStyles.licenseText}>
          Licence: 007/OFF/9130/2022
        </Text>
        <Text style={localStyles.licenseText}>
          Guru Krupa Investments Ltd
        </Text>
      </View>
      
      <View style={localStyles.copyrightContainer}>
        <Text style={localStyles.copyrightText}>
          © 2024 Grafton Liquor. All rights reserved.
        </Text>
        <View style={localStyles.poweredBy}>
          <Text style={localStyles.copyrightText}>Powered by </Text>
          <TouchableOpacity onPress={() => Linking.openURL("https://wix.com")}>
            <Text style={localStyles.wixText}>Wix</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={localStyles.warningText}>
        Liquor Licence Act 2012: It is an offence to supply alcohol to a person under 18 years.
      </Text>
    </View>
  );
};

const localStyles = StyleSheet.create({
  view: {
    backgroundColor: theme.colors.primary,
    padding: 30,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoText: {
    color: theme.colors.gold,
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  linksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  linkText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    paddingHorizontal: 10,
  },
  separator: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  licenseContainer: {
    marginBottom: 15,
    alignItems: 'center',
  },
  licenseText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    lineHeight: 16,
  },
  copyrightContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  copyrightText: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  poweredBy: {
    flexDirection: 'row',
    marginTop: 5,
  },
  wixText: {
    color: theme.colors.gold,
    fontSize: 11,
    fontWeight: '600',
  },
  warningText: {
    color: theme.colors.textMuted,
    fontSize: 9,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10,
  },
});
