import { Text, View, StyleSheet } from "react-native";
import { styles } from "../../styles/home/mission/styles";
import { theme } from "../../styles/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const ServiceIcon = ({ name, label }) => (
  <View style={localStyles.iconContainer}>
    <View style={localStyles.iconCircle}>
      <MaterialCommunityIcons name={name} size={40} color={theme.colors.gold} />
    </View>
    <Text style={localStyles.iconLabel}>{label}</Text>
  </View>
);

export const MissionSectionHome = () => {
  return (
    <View style={[styles.view, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.missionTitle, { color: theme.colors.gold }]}>Why Choose Us</Text>
      <Text style={[styles.missionText, { color: theme.colors.textSecondary }]}>
        At Grafton Liquor, we're committed to providing premium spirits, fine wines, 
        and exceptional service to Auckland and all of New Zealand.
      </Text>
      <View style={localStyles.servicesGrid}>
        <ServiceIcon name="truck-delivery" label="Fast Delivery" />
        <ServiceIcon name="store" label="Click & Collect" />
        <ServiceIcon name="shield-check" label="Quality Assured" />
        <ServiceIcon name="headset" label="Expert Support" />
      </View>
      <View style={localStyles.storeInfo}>
        <Text style={localStyles.storeInfoTitle}>Visit Our Store</Text>
        <Text style={localStyles.storeInfoText}>35 Park Road, Grafton, Auckland</Text>
        <Text style={localStyles.storeInfoText}>Open Daily: 11am - 9pm</Text>
        <Text style={localStyles.storeInfoText}>Ph: +64 22 303 9580</Text>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  iconContainer: {
    alignItems: 'center',
    width: '45%',
    marginBottom: 25,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: theme.colors.gold,
  },
  iconLabel: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  storeInfo: {
    backgroundColor: theme.colors.primary,
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  storeInfoTitle: {
    color: theme.colors.gold,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  storeInfoText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
});
