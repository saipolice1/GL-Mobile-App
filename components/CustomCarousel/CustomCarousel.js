import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';

const CustomCarousel = ({
  data,
  renderItem,
  width,
  height,
  loop,
  autoPlay,
  scrollAnimationDuration,
  mode,
  onProgressChange,
  snapEnabled,
  overscrollEnabled,
  scrollEnabled,
  style,
  ref: carouselRef,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (width || Dimensions.get('window').width));
    setCurrentIndex(Math.min(index, data.length - 1));
    if (onProgressChange) {
      onProgressChange((index / data.length) * 100);
    }
  };

  // Handle carousel navigation
  if (carouselRef && typeof carouselRef === 'object') {
    carouselRef.current = {
      next: () => {
        const nextIndex = (currentIndex + 1) % data.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * (width || Dimensions.get('window').width),
          animated: true,
        });
        setCurrentIndex(nextIndex);
      },
      prev: () => {
        const prevIndex = currentIndex === 0 ? data.length - 1 : currentIndex - 1;
        scrollViewRef.current?.scrollTo({
          x: prevIndex * (width || Dimensions.get('window').width),
          animated: true,
        });
        setCurrentIndex(prevIndex);
      },
    };
  }

  const itemWidth = width || Dimensions.get('window').width;

  return (
    <View style={[{ width: itemWidth, height }, style]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        scrollEventThrottle={16}
        onScroll={handleScroll}
        snapToInterval={itemWidth}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        scrollEnabled={scrollEnabled !== false}
        style={styles.scrollView}
      >
        {data.map((item, index) => (
          <View key={index} style={{ width: itemWidth, height }}>
            {renderItem({ item, index })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 1,
  },
});

export default CustomCarousel;
