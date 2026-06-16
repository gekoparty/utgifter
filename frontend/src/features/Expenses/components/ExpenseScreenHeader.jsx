import { Button, Stack } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PageHeader from "../../../components/commons/Layout/PageHeader";
import SegmentedControl from "../../../components/commons/Controls/SegmentedControl";
import { PRICE_MODE_LABELS } from "../constants/expenseScreenConstants";

export default function ExpenseScreenHeader({
  dashboardOpen,
  onAdd,
  onToggleDashboard,
  onPriceModeChange,
  priceDisplayMode,
  totalRowCount,
}) {
  const priceModeOptions = Object.entries(PRICE_MODE_LABELS).map(([mode, label]) => ({
    value: mode,
    label,
  }));

  return (
    <PageHeader
      title="Utgifter"
      subtitle={`${totalRowCount ?? 0} registrerte utgifter`}
      sx={{ borderRadius: 3 }}
      action={
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          justifyContent="flex-end"
          alignItems={{ xs: "stretch", sm: "center" }}
          sx={{
            "& .MuiButton-root": { width: { xs: "100%", sm: "auto" } },
          }}
        >
          <SegmentedControl
            value={priceDisplayMode}
            onChange={(value) => onPriceModeChange?.(null, value)}
            options={priceModeOptions}
            ariaLabel="Prisvisning"
            fullWidth
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
              width: { xs: "100%", sm: "auto" },
              "& .MuiToggleButton-root": {
                border: 0,
                borderRadius: 999,
                color: "text.secondary",
                fontWeight: 800,
                px: 1.5,
                py: 0.35,
                textTransform: "none",
                width: { xs: "33.333%", sm: "auto" },
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  "&:hover": { bgcolor: "primary.dark" },
                },
              },
            })}
          />

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
      }
    />
  );
}
