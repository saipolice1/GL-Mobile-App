import {
  Dimensions,
  Image,
  Linking,
  Pressable,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { styles } from "../../styles/home/follow-us/styles";
import Carousel from "../CustomCarousel/CustomCarousel";
import { data } from "../../data/followUs/data";
import { useCallback } from "react";
import { theme } from "../../styles/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export const FollowUsHome = (callback, deps) => {
  const width = Dimensions.get("window").width;
  const handlePress = useCallback(async (url) => {
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    }
  }, []);

  const handleonProgressChange = useCallback((progress) => {
    // detect device scroll
  }, []);
  return (
    <View style={[styles.view, localStyles.view]}>
      <Text style={[styles.title, localStyles.title]}>Follow Us</Text>
      <Text style={[styles.subtitle, localStyles.subtitle]}>{`@graftonliquor`}</Text>
      
      <View style={localStyles.socialLinks}>
        <Pressable 
          style={localStyles.socialButton}
          onPress={() => Linking.openURL('https://www.facebook.com/graftonliquor')}
        >
          <MaterialCommunityIcons name="facebook" size={28} color={theme.colors.gold} />
        </Pressable>
        <Pressable 
          style={localStyles.socialButton}
          onPress={() => Linking.openURL('https://www.instagram.com/graftonliquor')}
        >
          <MaterialCommunityIcons name="instagram" size={28} color={theme.colors.gold} />
        </Pressable>
      </View>
      
      <Carousel
        loop
        width={width * 0.7}
        height={width}
        autoPlay={false}
        data={data}
        scrollAnimationDuration={1000}
        snapEnabled={false}
        scrollEnabled={false}
        overscrollEnabled={true}
        onProgressChange={handleonProgressChange}
        mode="parallax"
        renderItem={({ index }) => {
          return (
            <View style={styles.carouselItem}>
              <Pressable onPress={handlePress.bind(this, data[index].link)}>
                <Image
                  style={[styles.carouselItemImage, localStyles.carouselImage]}
                  source={{
                    uri: data[index].uri,
                  }}
                />
              </Pressable>
            </View>
          );
        }}
      />
    </View>
  );
};

const localStyles = StyleSheet.create({
  view: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 30,
  },
  title: {
    color: theme.colors.gold,
  },
  subtitle: {
    color: theme.colors.textSecondary,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 20,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImage: {
    borderRadius: 12,
  },
});
