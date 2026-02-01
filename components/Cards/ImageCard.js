import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
import { theme } from "../../styles/theme";

const screenWidth = Dimensions.get("window").width;
const styles = StyleSheet.create({
  view: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: screenWidth * 0.8,
    height: 200,
    borderWidth: 1,
    borderColor: theme.colors.gold + "40",
    borderRadius: 20,
    overflow: "hidden",
  },
  ImageContainer: {
    position: "absolute",
    zIndex: -1,
    width: "100%",
    height: "100%",
  },
  Image: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26, 26, 46, 0.7)",
    borderRadius: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: "Fraunces-Regular",
    textAlign: "center",
    color: theme.colors.gold,
    position: "relative",
    zIndex: 1,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});

export const ImageCard = ({ imageSrc, title }) => {
  return (
    <View style={styles.view}>
      <View style={styles.ImageContainer}>
        <Image source={imageSrc} style={styles.Image} />
        <View style={styles.overlay}></View>
      </View>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};
