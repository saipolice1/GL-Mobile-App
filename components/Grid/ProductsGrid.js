import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { WixMediaImage } from "../../WixMediaImage";
import { memo, useMemo } from "react";
import { theme } from "../../styles/theme";
import { IS_TABLET } from "../../utils/responsive";
import { SkeletonProductCard, useShimmer } from "../Home/SkeletonProductCard";
import { TAB_BAR_CLEARANCE } from "../../constants/layout";
import { InCartBadge, LowStockBadge } from "../Badges/ProductBadges";

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
          accessibilityRole="button"
          accessibilityLabel={item.name}
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
            {showLowStock && <LowStockBadge quantity={stockQuantity} />}
            {/* In-Cart Badge - Top Right */}
            <InCartBadge productId={item?._id} />
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
export const ProductsGrid = memo(
  ({ data, scrollOffsetY, onPress, onRefresh, refreshing }) => {
    const { width: screenWidth } = useWindowDimensions();
    const showSkeletons = Boolean(refreshing);
    const shimmer = useShimmer(showSkeletons);
    const skeletonWidth = screenWidth / NUM_COLUMNS - 40;
    const skeletonData = useMemo(
      () =>
        Array.from({ length: NUM_COLUMNS * 4 }, (_, index) => ({
          _id: `__skeleton_${index}`,
          __skeleton: true,
        })),
      [],
    );

    return (
      <FlatList
        scrollEventThrottle={16}
        data={showSkeletons ? skeletonData : data}
        numColumns={NUM_COLUMNS}
        keyExtractor={(item, index) => item._id || item.id || index.toString()}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollOffsetY } } }],
          {
            useNativeDriver: false,
          },
        )}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
        alwaysBounceHorizontal={false}
        alwaysBounceVertical={Boolean(onRefresh)}
        bounces={Boolean(onRefresh)}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={Boolean(refreshing)}
              onRefresh={onRefresh}
              tintColor={theme.colors.text}
            />
          ) : undefined
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No products here yet</Text>
            <Text style={styles.emptyText}>
              Check back soon or browse another collection.
            </Text>
          </View>
        }
        style={{ backgroundColor: theme.colors.primary }}
        contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE }}
        renderItem={({ item }) => {
          if (item.__skeleton) {
            return (
              <View style={styles.container}>
                <SkeletonProductCard cardWidth={skeletonWidth} shimmer={shimmer} />
              </View>
            );
          }
          return <ProductCard item={item} onPress={onPress} />;
        }}
      ></FlatList>
    );
  },
);

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
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
  inCartBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    zIndex: 2,
  },
  inCartBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
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
