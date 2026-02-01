import React from "react";
import {
  Dimensions,
  Image,
  Pressable,
  StatusBar,
  Text,
  View,
  ImageBackground,
} from "react-native";
import { styles } from "../../styles/home/hero/styles";
import Routes from "../../routes/routes";
import { theme } from "../../styles/theme";

const windowHeight = Dimensions.get("window").height;

export const HeroSection = ({ navigation }) => {
  const [height, setHeight] = React.useState(0);

  return (
    <View
      style={[
        styles.heroSection,
        {
          height: windowHeight - height,
          backgroundColor: theme.colors.primary,
        },
      ]}
      onLayout={(event) => {
        const { y } = event.nativeEvent.layout;
        const bottomTabHeight = windowHeight * 0.1;
        setHeight(y + bottomTabHeight + (-StatusBar.currentHeight || 59));
      }}
    >
      <View style={styles.heroImageContainer}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=1200&q=80",
          }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={[styles.overlay, { backgroundColor: 'rgba(26, 26, 46, 0.7)' }]}></View>
      </View>
      <View style={styles.heroText}>
        <Text style={[styles.heroTitle, { color: theme.colors.gold, fontWeight: 'bold', letterSpacing: 3 }]}>GRAFTON</Text>
        <Text style={[styles.heroSubtitle, { color: theme.colors.text, letterSpacing: 6, fontSize: 14 }]}>
          LIQUOR
        </Text>
        <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary, fontSize: 16, marginTop: 20 }]}>
          Premium Spirits & Fine Wines{'\n'}Auckland's Trusted Liquor Store
        </Text>
      </View>
      <View style={styles.heroShopNow}>
        <Pressable
          style={[styles.heroButton, { backgroundColor: theme.colors.gold }]}
          onPress={() => navigation.navigate(Routes.Store)}
        >
          <Text style={[styles.heroButtonText, { color: theme.colors.primary }]}>Shop Now</Text>
        </Pressable>
      </View>
    </View>
  );
};
