// src/components/NavBar/Consts/NavBarListItems.jsx
import HomeIcon from "@mui/icons-material/Home";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaymentsIcon from "@mui/icons-material/Payments";
import CategoryIcon from "@mui/icons-material/Category";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import StoreIcon from "@mui/icons-material/Store";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import BarChartIcon from "@mui/icons-material/BarChart";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";

export const mainNavbarItems = [
  { id: 0, icon: <HomeIcon />, label: "Hjem", route: "/", section: "Oversikt" },

  { id: 1, icon: <ReceiptLongIcon />, label: "Utgifter", route: "/expenses", section: "Oversikt" },
  { id: 11, icon: <PaymentsIcon />, label: "Inntekter", route: "/incomes", section: "Oversikt" },
  {
    id: 7,
    icon: <AccountBalanceIcon />,
    label: "Faste kostnader",
    route: "/recurring-expenses",
    section: "Oversikt",
  },
  { id: 8, icon: <BarChartIcon />, label: "Statistikk", route: "/stats", section: "Analyse" },

  { id: 6, icon: <Inventory2Icon />, label: "Produkter", route: "/products", section: "Register" },
  { id: 3, icon: <LocalOfferIcon />, label: "Merker", route: "/brands", section: "Register" },
  { id: 4, icon: <StoreIcon />, label: "Butikker", route: "/shops", section: "Register" },
  { id: 5, icon: <LocationOnIcon />, label: "Steder", route: "/locations", section: "Register" },
  { id: 2, icon: <CategoryIcon />, label: "Kategorier", route: "/categories", section: "Register" },

  {
    id: 9,
    icon: <ManageAccountsIcon />,
    label: "Min konto",
    route: "/account",
    section: "Administrasjon",
  },
  {
    id: 10,
    icon: <AdminPanelSettingsIcon />,
    label: "Brukere",
    route: "/admin/users",
    adminOnly: true,
    section: "Administrasjon",
  },
];
