import React, { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import InputSpinner from "react-native-input-spinner";
import { WixMediaImage } from "../../WixMediaImage";
import { ActivityIndicator, IconButton } from "react-native-paper";
import { theme } from "../../styles/theme";
import { IS_TABLET, rs } from "../../utils/responsive";

export const CartListItem = ({
  image,
  name,
  price,
  quantity,
  quantityOnEdit,
  quantityHandlerChange,
  removeHandler,
}) => {
  const [newQuantity, setNewQuantity] = React.useState(quantity);
  useEffect(() => {
    setNewQuantity(quantity);
  }, [quantity]);
  return (
    <View style={{ width: "100%", backgroundColor: theme.colors.primary }}>
      <View style={styles.card}>
        <WixMediaImage media={image} width={rs(80)} height={rs(110)}>
          {({ url }) => <Image source={{ uri: url }} style={styles.image} />}
        </WixMediaImage>

        <View style={styles.infoContainer}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.price}>{price}</Text>
        </View>

        <View style={styles.close}>
          <IconButton
            icon={"close"}
            onPress={removeHandler}
            iconColor={theme.colors.textSecondary}
          />
        </View>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          margin: 10,
          width: "100%",
        }}
      >
        <View style={{ flex: 1 }} />
        <View
          style={{
            flex: 2,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-around",
            width: "100%",
          }}
        >
          {quantityOnEdit && (
            <View
              style={{
                position: "absolute",
                top: 0,
                left: -10,
                width: "100%",
                height: "100%",
                zIndex: 100,
              }}
            >
              <ActivityIndicator
                style={{
                  flex: 1,
                  flexDirection: "row",
                  justifyContent: "flex-start",
                  alignItems: "center",
                }}
                color={theme.colors.gold}
              />
            </View>
          )}
          <InputSpinner
            value={newQuantity}
            width={rs(100)}
            height={rs(40)}
            onChange={(quantity) => {
              setNewQuantity(quantity);
              quantityHandlerChange(quantity);
            }}
            rounded={false}
            showBorder={true}
            buttonStyle={{ width: rs(30), minWidth: IS_TABLET ? 44 : 30, backgroundColor: theme.colors.surface }}
            buttonTextColor={theme.colors.gold}
            textColor={theme.colors.text}
            min={1}
            containerStyle={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.gold + "60",
              opacity: quantityOnEdit ? 0.5 : 1,
            }}
          />
          <Text style={[styles.price, { opacity: quantityOnEdit ? 0.5 : 1 }]}>
            {price}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    overflow: "hidden",
    backgroundColor: theme.colors.primary,
    margin: 10,
    elevation: 2,
    position: "relative",
  },
  close: {
    position: "absolute",
    top: 0,
    right: 0,
  },
  image: {
    width: rs(80),
    height: rs(110),
    resizeMode: "cover",
    borderColor: theme.colors.gold + "40",
    borderWidth: 1,
    borderRadius: 8,
  },
  infoContainer: {
    flex: 1,
    padding: 10,
    justifyContent: "space-between",
  },
  name: {
    fontSize: rs(18, 1.2),
    flexShrink: 1,
    color: theme.colors.text,
  },
  price: {
    fontSize: rs(16, 1.2),
    color: theme.colors.gold,
    fontWeight: "bold",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    height: rs(30),
    width: rs(50),
    borderColor: theme.colors.gold + "60",
    borderWidth: 1,
    marginLeft: 5,
    paddingHorizontal: 5,
    color: theme.colors.text,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    margin: 10,
    width: "100%",
  },
});
