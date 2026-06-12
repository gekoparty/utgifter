import {
  Box,
  Button,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { PRICE_MODE_LABELS } from "../constants/expenseScreenConstants";

export default function ExpenseScreenHeader({
  dashboardOpen,
  onAdd,
  onToggleDashboard,
  onPriceModeChange,
  palette,
  priceDisplayMode,
  totalRowCount,
}) {
  return (
    <Box
      sx={{
        mb: 2,
        p: 1.5,
        borderRadius: 3,
        bgcolor: "background.paper",
        border: `1px solid ${palette.divider}`,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            Utgifter
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {totalRowCount ?? 0} registrerte utgifter
          </Typography>
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          justifyContent="flex-end"
          alignItems={{ xs: "stretch", sm: "center" }}
          sx={{
            "& .MuiButton-root": { width: { xs: "100%", sm: "auto" } },
          }}
        >
          <ToggleButtonGroup
            exclusive
            size="small"
            value={priceDisplayMode}
            onChange={onPriceModeChange}
            aria-label="Prisvisning"
            sx={(theme) => ({
              alignSelf: { xs: "stretch", sm: "center" },
              bgcolor:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(15,23,42,0.035)",
              border: "1px solid",
              borderColor: theme.palette.divider,
              borderRadius: 999,
              p: 0.25,
              "& .MuiToggleButton-root": {
                border: 0,
                borderRadius: 999,
                color: "text.secondary",
                fontWeight: 800,
                px: 1.5,
                textTransform: "none",
                width: { xs: "33.333%", sm: "auto" },
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  "&:hover": { bgcolor: "primary.dark" },
                },
              },
            })}
          >
            {Object.entries(PRICE_MODE_LABELS).map(([mode, label]) => (
              <ToggleButton key={mode} value={mode}>
                {label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Button
            size="small"
            variant={dashboardOpen ? "contained" : "outlined"}
            startIcon={<DashboardIcon />}
            onClick={onToggleDashboard}
            sx={{
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 700,
              px: 2,
            }}
          >
            {dashboardOpen ? "Skjul statistikk" : "Vis statistikk"}
          </Button>

          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAdd}
            sx={{
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 800,
              px: 2,
            }}
          >
            Ny utgift
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
