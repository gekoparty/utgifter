import { Stack, Switch, Tooltip } from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { useColorMode } from "../../styles/theme/ColorModeContext.jsx";

export default function ThemeModeSwitch() {
  const { mode, toggleColorMode } = useColorMode();
  const isDark = mode === "dark";

  return (
    <Tooltip title={isDark ? "Bytt til lyst tema" : "Bytt til morkt tema"}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.5}
        sx={{
          flexShrink: 0,
          color: "text.secondary",
          "& .MuiSvgIcon-root": {
            fontSize: 18,
          },
        }}
      >
        <LightModeIcon color={isDark ? "disabled" : "primary"} />
        <Switch
          checked={isDark}
          onChange={toggleColorMode}
          size="small"
          inputProps={{ "aria-label": "Bytt mellom lyst og morkt tema" }}
        />
        <DarkModeIcon color={isDark ? "primary" : "disabled"} />
      </Stack>
    </Tooltip>
  );
}
