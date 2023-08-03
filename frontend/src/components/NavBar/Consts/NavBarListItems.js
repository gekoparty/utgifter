import PeopleIcon from '@mui/icons-material/People';
import ImageIcon from '@mui/icons-material/Image';
import PublicIcon from '@mui/icons-material/Public';
import HomeIcon from '@mui/icons-material/Home';
import SettingsEthernetIcon from '@mui/icons-material/SettingsEthernet';
import SettingsInputComponentIcon from '@mui/icons-material/SettingsInputComponent';
import DnsIcon from '@mui/icons-material/Dns';

export const mainNavbarItems = [
    {
        id: 0,
        icon: <HomeIcon />,
        label: 'Hjem',
        route: '/',
    },
    {
        id: 1,
        icon: <PeopleIcon />,
        label: 'Utgifter',
        route: 'expenses',
    },
    {
        id: 2,
        icon: <DnsIcon />,
        label: 'Kategorier',
        route: 'categories',
    },
    {
        id: 3,
        icon: <ImageIcon />,
        label: 'Merker',
        route: 'brands',
    },
    {
        id: 4,
        icon: <PublicIcon />,
        label: 'Butikker',
        route: 'shops',
    },
    {
        id: 5,
        icon: <SettingsEthernetIcon />,
        label: 'Steder',
        route: 'locations',
    },
    {
        id: 6,
        icon: <SettingsInputComponentIcon />,
        label: 'Produkter',
        route: 'products',
    },
]