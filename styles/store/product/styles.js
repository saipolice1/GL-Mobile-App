import { StyleSheet } from "react-native";
import { theme } from "../../theme";
import { IS_TABLET, rs } from "../../../utils/responsive";

export const styles = StyleSheet.create({
  backContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: theme.colors.primary,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
  },
  backButtonText: {
    textAlign: "center",
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  card: {
    marginHorizontal: 20,
    flex: 1,
    height: "100%",
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
  },
  cardImage: {
    marginHorizontal: 20,
    height: IS_TABLET ? 500 : 400,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceVariant,
  },
  productSku: {
    margin: 0,
    padding: 0,
    color: theme.colors.textSecondary,
  },
  productTitle: {
    fontFamily: "Fraunces-Regular",
    fontSize: 32,
    paddingVertical: 20,
    color: theme.colors.text,
  },
  container: {
    flex: 1,
    height: "100%",
    backgroundColor: theme.colors.primary,
  },
  content: {
    paddingHorizontal: 1,
    backgroundColor: theme.colors.primary,
  },
  flexGrow1Button: {
    flexGrow: 1,
    marginVertical: 20,
    backgroundColor: theme.colors.gold,
    borderRadius: 8,
  },
  flexJustifyCenter: {
    marginTop: 20,
    justifyContent: "center",
    alignContent: "center",
    alignItems: "center",
  },
  flexJustifyStart: {
    marginTop: 20,
    justifyContent: "flex-start",
    alignContent: "flex-start",
    alignItems: "flex-start",
  },
  variantsContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
  },
});
