import { HomeScreen } from "../../screens/home/HomeScreen";
import { StoreScreen } from "../../screens/store/StoreScreen";
import { SearchScreen } from "../../screens/search/SearchScreen";
import { ChatScreen } from "../../screens/chat/ChatScreen";
import { CartScreen } from "../../screens/store/cart/CartScreen";
import { MemberAreaScreen } from "../../screens/members/MemberAreaScreen/MemberAreaScreen";
import Routes from "../../routes/routes";

export const tabs = [
  {
    name: Routes.Home,
    component: HomeScreen,
    icon: "home-outline",
  },
  {
    name: Routes.Search,
    component: SearchScreen,
    icon: "magnify",
  },
  {
    name: Routes.Chat,
    component: ChatScreen,
    icon: "chat-outline",
  },
  {
    name: Routes.Profile,
    component: MemberAreaScreen,
    icon: "account-outline",
  },
  {
    name: Routes.Cart,
    component: CartScreen,
    icon: "cart-outline",
  },
];
