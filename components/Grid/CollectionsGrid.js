import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WixMediaImage } from "../../WixMediaImage";
import { memo } from "react";
import { theme } from "../../styles/theme";

const screenWidth = Dimensions.get("window").width;

const CollectionCard = ({ item, onPress }) => {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => {
          onPress(item);
        }}
      >
        {item.media?.mainMedia?.image?.url ? (
          <WixMediaImage
            media={item.media.mainMedia.image.url}
            width={screenWidth / 2 - 20}
            height={screenWidth / 2}
          >
            {({ url }) => {
              return (
                <Image
                  style={[
                    styles.image,
                    {
                      width: screenWidth / 2 - 20, // Adjust the width as needed
                      height: screenWidth / 2,
                    },
                  ]}
                  source={{
                    uri: url,
                  }}
                />
              );
            }}
          </WixMediaImage>
        ) : (
          <Image
            style={[
              styles.image,
              {
                width: screenWidth / 2 - 20, // Adjust the width as needed
                height: screenWidth / 2,
              },
            ]}
            source={{
              uri: `https://via.placeholder.com/${screenWidth / 2}`,
            }}
          />
        )}
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.price}>
          {item.convertedPriceData?.formatted?.price}
        </Text>
      </Pressable>
    </View>
  );
};
export const CollectionsGrid = memo(({ data, onPress }) => {
  return (
    <FlatList
      scrollEventThrottle={16}
      data={data}
      numColumns={2}
      keyExtractor={(item, index) => index.toString()}
      keyboardShouldPersistTaps="always"
      alwaysBounceVertical={false}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: theme.colors.primary }}
      renderItem={({ item, index }) => {
        return (
          item.visible && (
            <CollectionCard key={index} item={item} onPress={onPress} />
          )
        );
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
    textAlign: "left",
    width: "100%",
    paddingBottom: 20,
    backgroundColor: theme.colors.primary,
  },
  image: {
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
  },
  title: {
    textAlign: "left",
    fontSize: 16,
    paddingTop: 10,
    color: theme.colors.text,
    fontWeight: "600",
  },
  price: {
    textAlign: "left",
    fontSize: 14,
    paddingTop: 4,
    color: theme.colors.gold,
  },
});
