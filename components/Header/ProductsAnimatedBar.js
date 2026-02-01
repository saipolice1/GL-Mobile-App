import { Animated, View } from "react-native";
import { Header } from "./Header";

export const ProductAnimatedBar = ({ translateY = 0, navigation }) => {
  // If translateY is not an animated value, just render a static view
  if (!translateY || typeof translateY === 'number') {
    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          backgroundColor: "#FEFBEF",
          width: "100%",
          height: 60,
          position: "absolute",
          top: 0,
          right: 0,
          left: 0,
          elevation: 4,
          zIndex: 1,
        }}
      >
        <Header />
      </View>
    );
  }

  return (
    <Animated.View
      style={{
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: "#FEFBEF",
        width: "100%",
        height: translateY,
        position: "absolute",
        top: 0,
        right: 0,
        left: 0,
        elevation: 4,
        zIndex: 1,
      }}
    >
      <Header />
    </Animated.View>
  );
};
