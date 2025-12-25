import HomeIcon from '@mui/icons-material/Home';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'; // For Utgifter (Expenses)
import CategoryIcon from '@mui/icons-material/Category';       // For Kategorier
import LocalOfferIcon from '@mui/icons-material/LocalOffer';   // For Merker (Brands)
import StoreIcon from '@mui/icons-material/Store';             // For Butikker (Shops)
import LocationOnIcon from '@mui/icons-material/LocationOn';   // For Steder (Locations)
import Inventory2Icon from '@mui/icons-material/Inventory2';   // For Produkter (Products)
import BarChartIcon from '@mui/icons-material/BarChart';
export const mainNavbarItems = [
    {
        id: 0,
        icon: <HomeIcon />,
        label: 'Hjem',
        route: '/',
    },
    {
        id: 1,
        icon: <ReceiptLongIcon />,
        label: 'Utgifter',
        route: 'expenses',
    },
    {
        id: 2,
        icon: <CategoryIcon />, // Replaced DnsIcon
        label: 'Kategorier',
        route: 'categories',
    },
    {
        id: 3,
        icon: <LocalOfferIcon />, // Replaced ImageIcon
        label: 'Merker',
        route: 'brands',
    },
    {
        id: 4,
        icon: <StoreIcon />, // Replaced PublicIcon
        label: 'Butikker',
        route: 'shops',
    },
    {
        id: 5,
        icon: <LocationOnIcon />, // Replaced SettingsEthernetIcon
        label: 'Steder',
        route: 'locations',
    },
    {
        id: 6,
        icon: <Inventory2Icon />, // Replaced SettingsInputComponentIcon
        label: 'Produkter',
        route: 'products',
    },
    {
        id: 7,
        icon: <BarChartIcon />, // Replaced SettingsInputComponentIcon
        label: 'Stats',
        route: 'stats',
    },
]