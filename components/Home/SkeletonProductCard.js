import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { IS_TABLET } from '../../utils/responsive';

// Single shared shimmer drives all cards in sync
let _shimmer = null;
function getShimmer() {
  if (!_shimmer) {
    _shimmer = new Animated.Value(0);
    Animated.loop(
      Animated.timing(_shimmer, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }
  return _shimmer;
}

const Block = ({ style, cardWidth }) => {
  const tx = getShimmer().interpolate({
    inputRange: [0, 1],
    outputRange: [-cardWidth * 2, cardWidth * 2],
  });
  return (
    <View style={[styles.block, style]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateX: tx }, { skewX: '-18deg' }],
            backgroundColor: 'rgba(255,255,255,0.55)',
            width: '45%',
          },
        ]}
      />
    </View>
  );
};

export const SkeletonProductCard = ({ cardWidth }) => (
  <View style={{ width: cardWidth, marginBottom: 16 }}>
    <Block style={{ aspectRatio: 1, borderRadius: 12, marginBottom: 8 }} cardWidth={cardWidth} />
    <Block style={{ height: 11, borderRadius: 4, marginBottom: 5, width: '85%' }} cardWidth={cardWidth} />
    <Block style={{ height: 11, borderRadius: 4, marginBottom: 6, width: '60%' }} cardWidth={cardWidth} />
    <Block style={{ height: 12, borderRadius: 4, width: '45%' }} cardWidth={cardWidth} />
  </View>
);

export const SkeletonGrid = ({ count = 9 }) => {
  const { width } = useWindowDimensions();
  const numColumns = IS_TABLET ? 4 : 3;
  const cardWidth = (width - 16 * (numColumns + 1)) / numColumns;

  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProductCard key={i} cardWidth={cardWidth} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  block: {
    backgroundColor: '#EBEBEB',
    overflow: 'hidden',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
    paddingTop: 8,
  },
});
