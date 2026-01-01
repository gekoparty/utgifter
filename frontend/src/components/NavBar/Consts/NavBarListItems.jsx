// src/components/NavBar/Consts/NavBarListItems.jsx
import HomeIcon from "@mui/icons-material/Home";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CategoryIcon from "@mui/icons-material/Category";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import StoreIcon from "@mui/icons-material/Store";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import BarChartIcon from "@mui/icons-material/BarChart";

export const mainNavbarItems = [
  // "Home" points to expenses now
  { id: 0, icon: <HomeIcon />, label: "Hjem", route: "/" },

  { id: 1, icon: <ReceiptLongIcon />, label: "Utgifter", route: "/expenses" },
  { id: 2, icon: <CategoryIcon />, label: "Kategorier", route: "/categories" },
  { id: 3, icon: <LocalOfferIcon />, label: "Merker", route: "/brands" },
  { id: 4, icon: <StoreIcon />, label: "Butikker", route: "/shops" },
  { id: 5, icon: <LocationOnIcon />, label: "Steder", route: "/locations" },
  { id: 6, icon: <Inventory2Icon />, label: "Produkter", route: "/products" },

  // stats is outside sidebar layout, still navigable from drawer if you want
  { id: 7, icon: <BarChartIcon />, label: "Stats", route: "/stats" },
];
