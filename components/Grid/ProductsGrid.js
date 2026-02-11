import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { WixMediaImage } from "../../WixMediaImage";
import { memo, useMemo } from "react";
import { theme } from "../../styles/theme";
import { IS_TABLET } from "../../utils/responsive";

const NUM_COLUMNS = IS_TABLET ? 3 : 2;

const ProductCard = ({ item, onPress }) => {
  const { width: screenWidth } = useWindowDimensions();
  const imageWidth = screenWidth / NUM_COLUMNS - 20;
  const imageHeight = imageWidth * 1.1;
  // Check stock and badge status
  const stockQuantity = item?.stock?.quantity;
  const inStock = item?.stock?.inStock !== false && item?.stock?.inventoryStatus !== 'OUT_OF_STOCK';
  const isOutOfStock = stockQuantity === 0 || !inStock;
  const isLowStock = stockQuantity !== undefined && stockQuantity > 0 && stockQuantity <= 5;
  const isTrending = item?.ribbon === 'Best Seller' || item?.ribbons?.length > 0;
  
  // Show BOTH badges
  const showLowStock = isLowStock && !isOutOfStock;
  const showTrending = isTrending && !isOutOfStock;

  return useMemo(() => {
    return (
      <View style={styles.container}>
        <Pressable
          style={styles.card}
          onPress={() => {
            onPress(item);
          }}
        >
          <View style={styles.imageWrapper}>
            <WixMediaImage
              media={item.media.mainMedia.image.url}
              width={imageWidth}
              height={imageHeight}
            >
              {({ url }) => {
                return (
                  <Image
                    style={[
                      styles.image,
                      {
                        width: imageWidth,
                        height: imageHeight,
                      },
                      isOutOfStock && styles.imageGrayedOut,
                    ]}
                    source={{
                      uri: url,
                    }}
                  />
                );
              }}
            </WixMediaImage>
            {/* Sold Out Badge */}
            {isOutOfStock && (
              <View style={styles.soldOutOverlay}>
                <View style={styles.soldOutBadge}>
                  <Text style={styles.soldOutText}>SOLD OUT</Text>
                </View>
              </View>
            )}
            {/* Trending Badge - Top Left */}
            {showTrending && (
              <View style={styles.trendingBadge}>
                <Text style={styles.fireEmoji}>🔥</Text>
              </View>
            )}
            {/* Low Stock Badge - Bottom Left */}
            {showLowStock && (
              <View style={styles.lowStockBadge}>
                <View style={styles.lowStockDot} />
                <Text style={styles.lowStockText}>Only {stockQuantity} left</Text>
              </View>
            )}
          </View>
          <Text style={[styles.title, isOutOfStock && styles.textGrayedOut]} numberOfLines={2}>{item.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={[styles.price, isOutOfStock && styles.textGrayedOut]}>
              {item.convertedPriceData?.formatted?.price}
            </Text>
          </View>
        </Pressable>
      </View>
    );
  }, [item, isOutOfStock, showTrending, showLowStock, stockQuantity]);
};
export const ProductsGrid = memo(({ data, scrollOffsetY, onPress }) => {
  return (
    <FlatList
      scrollEventThrottle={16}
      data={data}
      numColumns={NUM_COLUMNS}
      keyExtractor={(item, index) => index.toString()}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollOffsetY } } }],
        {
          useNativeDriver: false,
        },
      )}
      keyboardShouldPersistTaps="always"
      showsVerticalScrollIndicator={false}
      alwaysBounceHorizontal={false}
      alwaysBounceVertical={false}
      bounces={false}
      style={{ backgroundColor: theme.colors.primary }}
      renderItem={({ item }) => {
        return <ProductCard item={item} onPress={onPress} />;
      }}
    ></FlatList>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    borderRadius: 16,
    elevation: 0,
    width: "100%",
    paddingBottom: 20,
    backgroundColor: theme.colors.primary,
  },
  card: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 10,
  },
  image: {
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceVariant,
  },
  imageWrapper: {
    position: 'relative',
  },
  imageGrayedOut: {
    opacity: 0.4,
  },
  textGrayedOut: {
    color: theme.colors.textMuted,
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutBadge: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  soldOutText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  trendingBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  fireEmoji: {
    fontSize: 14,
  },
  lowStockBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  lowStockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  lowStockText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  title: {
    textAlign: "left",
    fontSize: 14,
    paddingTop: 10,
    color: theme.colors.text,
    fontWeight: "600",
  },
  price: {
    textAlign: "left",
    fontSize: 16,
    paddingTop: 4,
    color: theme.colors.gold,
    fontWeight: "bold",
  },
  priceContainer: {
    flexDirection: "row",
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
});
