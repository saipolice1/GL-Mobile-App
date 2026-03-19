import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { theme } from "../../styles/theme";

const BeerPourAnimation = () => {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const bubbleAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const foamAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pour fill animation — loops
    const pour = Animated.loop(
      Animated.sequence([
        Animated.timing(fillAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.delay(400),
        Animated.timing(fillAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ])
    );

    // Foam bounce
    const foam = Animated.loop(
      Animated.sequence([
        Animated.timing(foamAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
        Animated.timing(foamAnim, { toValue: 0.7, duration: 300, useNativeDriver: false }),
        Animated.timing(foamAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
        Animated.delay(900),
        Animated.timing(foamAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
        Animated.delay(300),
      ])
    );

    // Bubble animations — staggered
    const bubbles = bubbleAnims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 400),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    );

    pour.start();
    foam.start();
    bubbles.forEach((b) => b.start());

    return () => {
      pour.stop();
      foam.stop();
      bubbles.forEach((b) => b.stop());
    };
  }, []);

  const glassHeight = 80;
  const glassWidth = 52;

  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, glassHeight],
  });

  const foamHeight = foamAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });

  const bubblePositions = [14, 26, 38];

  return (
    <View style={beerStyles.container}>
      {/* Glass outline */}
      <View style={[beerStyles.glass, { height: glassHeight, width: glassWidth }]}>
        {/* Beer fill */}
        <Animated.View
          style={[
            beerStyles.fill,
            { height: fillHeight, width: glassWidth - 4 },
          ]}
        >
          {/* Bubbles */}
          {bubbleAnims.map((anim, i) => (
            <Animated.View
              key={i}
              style={[
                beerStyles.bubble,
                {
                  left: bubblePositions[i],
                  opacity: anim,
                  transform: [
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -50],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </Animated.View>

        {/* Foam */}
        <Animated.View
          style={[
            beerStyles.foam,
            { height: foamHeight, width: glassWidth - 4 },
          ]}
        />
      </View>

      {/* Glass base */}
      <View style={[beerStyles.glassBase, { width: glassWidth }]} />
    </View>
  );
};

export const LoadingIndicator = ({ loadingMessage, ...props }) => (
  <View style={[styles.container, props.styles]}>
    <BeerPourAnimation />
    {loadingMessage && <Text style={styles.message}>{loadingMessage}</Text>}
  </View>
);

const beerStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  glass: {
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: "#c8a96e",
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    overflow: "hidden",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  fill: {
    backgroundColor: "#f5a623",
    position: "absolute",
    bottom: 0,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  foam: {
    backgroundColor: "#fff8f0",
    position: "absolute",
    bottom: 0,
    borderRadius: 4,
    opacity: 0.95,
  },
  bubble: {
    position: "absolute",
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  glassBase: {
    height: 4,
    backgroundColor: "#c8a96e",
    borderRadius: 2,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
    gap: 16,
  },
  message: {
    color: theme.colors.textSecondary,
    marginTop: 10,
  },
});
