import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import debounce from "lodash.debounce";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

import AppScreen from "../components/commons/Layout/AppScreen";
import SegmentedControl from "../components/commons/Controls/SegmentedControl";
import VirtualizedSelect from "../components/commons/VirtualizedSelect/VirtualizedSelect";
import useInfiniteProducts from "../hooks/useInfiniteProducts";
import { getSelectStyles } from "../styles/theme/selectStyles";

const MonthlyExpensesChart = lazy(() =>
  import("../components/Charts/MonthlyExpensesChart/MonthlyExpensesChart")
);
const ProductPriceChart = lazy(() =>
  import("../components/Charts/ProductPriceChart/ProductPriceChart")
);

const normalizeMonthParam = (month, year) => {
  if (!month) return "";
  const raw = String(month);
  if (/^\d{4}-\d{2}$/.test(raw)) return raw;

  const numericMonth = Number(raw);
  const numericYear = Number(year);
  if (!Number.isFinite(numericMonth) || !Number.isFinite(numericYear)) return "";
  if (numericMonth < 1 || numericMonth > 12) return "";

  return `${numericYear}-${String(numericMonth).padStart(2, "0")}`;
};

export default function StatsScreen() {
  const theme = useTheme();
  const navigate = useNavigate();
  const selectStyles = useMemo(() => getSelectStyles(theme), [theme]);
  const [view, setView] = useState("expenses");
  const [productId, setProductId] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const {
    data: infiniteData,
    isLoading: isLoadingProducts,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteProducts(productSearch);

  const productOptions = useMemo(() => {
    const pages = infiniteData?.pages ?? [];
    return pages.flatMap((page) =>
      (page.products ?? []).map((product) => ({
        label: product.name,
        value: product._id || product.id,
      })),
    );
  }, [infiniteData]);

  const debouncedSearch = useMemo(
    () => debounce((query) => setProductSearch(query), 300),
    [],
  );

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  const handleInputChange = useCallback(
    (value) => debouncedSearch(value || ""),
    [debouncedSearch],
  );

  const menuPortalTarget =
    typeof document !== "undefined" ? document.body : undefined;

  const selectedProduct =
    productOptions.find((option) => option.value === productId) || null;

  const openExpenseDrilldown = useCallback(
    ({ month, year: drillYear, filterId, filterValue }) => {
      const params = new URLSearchParams();
      const normalizedMonth = normalizeMonthParam(month, drillYear);
      if (normalizedMonth) params.set("month", normalizedMonth);
      if (filterId && filterValue) {
        params.set("filterId", filterId);
        params.set("filterValue", filterValue);
      }
      navigate(`/expenses?${params.toString()}`);
    },
    [navigate],
  );

  const handleStatsDrilldown = useCallback(
    ({ kind, month, year: drillYear, type, row, name }) => {
      const normalizedMonth = normalizeMonthParam(month, drillYear);

      if (kind === "fixed-costs" || name === "Faste kostnader") {
        const params = new URLSearchParams();
        if (normalizedMonth) params.set("month", normalizedMonth);
        navigate(`/recurring-expenses?${params.toString()}`);
        return;
      }

      if (kind === "category") {
        const params = new URLSearchParams();
        params.set("filterId", "category");
        params.set("filterValue", name);
        navigate(`/products?${params.toString()}`);
        return;
      }

      const drillName = row?.name || name;
      const filterMap = {
        shops: "shopName",
        brands: "brandName",
        locations: "locationName",
      };

      if (type === "categories") {
        const params = new URLSearchParams();
        if (drillName) {
          params.set("filterId", "category");
          params.set("filterValue", drillName);
        }
        navigate(`/products?${params.toString()}`);
        return;
      }

      openExpenseDrilldown({
        month: normalizedMonth,
        year: drillYear,
        filterId: filterMap[type],
        filterValue: drillName,
      });
    },
    [navigate, openExpenseDrilldown],
  );

  const toolbar = (
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={1}
          alignItems={{ xs: "stretch", lg: "center" }}
          justifyContent="space-between"
        >
          <SegmentedControl
            value={view}
            onChange={(nextView) => {
              setView(nextView);
              if (nextView !== "price") setProductId("");
            }}
            ariaLabel="Statistikkvisning"
            fullWidth
            options={[
              {
                value: "expenses",
                label: (
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <BarChartRoundedIcon fontSize="small" />
                    <span>Måneder</span>
                  </Stack>
                ),
              },
              {
                value: "price",
                label: (
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <TimelineRoundedIcon fontSize="small" />
                    <span>Prishistorikk</span>
                  </Stack>
                ),
              },
            ]}
            sx={{ width: { xs: "100%", lg: 340 } }}
          />

          {view === "price" ? (
            <Box sx={{ width: { xs: "100%", lg: 440 } }}>
              <VirtualizedSelect
                isClearable
                options={productOptions}
                value={selectedProduct}
                onChange={(option) => setProductId(option?.value || "")}
                onInputChange={handleInputChange}
                isLoading={isLoadingProducts}
                placeholder="Søk etter produkt..."
                menuPortalTarget={menuPortalTarget}
                styles={selectStyles}
                hasNextPage={hasNextPage}
                fetchNextPage={fetchNextPage}
              />
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
              Sammenlign månedene og åpne ekstra grafer for kategoriutvikling.
            </Typography>
          )}
        </Stack>
  );

  return (
    <AppScreen
      title="Statistikk"
      subtitle="Analyser månedlige utgifter, produktpriser, butikker og varianter."
      icon={<BarChartRoundedIcon />}
      summaryItems={[
        { label: "Visning", value: view === "expenses" ? "Måneder" : "Prishistorikk" },
        ...(selectedProduct ? [{ label: "Produkt", value: selectedProduct.label }] : []),
      ]}
      workflow={{
        question:
          view === "price"
            ? "Hva er den reelle prisutviklingen for produktet?"
            : "Bruker jeg mer eller mindre, og hvorfor?",
        answer:
          view === "price"
            ? "Velg produkt først, sammenlign butikker og varianter, og se hvor ferske prisene er før du konkluderer."
            : "Start med månedsutviklingen, slå på faste kostnader eller inntekt ved behov, og bruk fordelingen til å finne årsaken.",
        steps:
          view === "price"
            ? ["Velg produkt", "Sammenlign pris", "Sjekk butikk og dato"]
            : ["Velg år", "Se trend", "Finn driverne"],
      }}
      toolbar={toolbar}
      maxWidth={1360}
    >

      {view === "expenses" && (
        <Suspense fallback={null}>
          <MonthlyExpensesChart onDrilldown={handleStatsDrilldown} />
        </Suspense>
      )}

      {view === "price" &&
        (productId ? (
          <Suspense fallback={null}>
            <ProductPriceChart productId={productId} />
          </Suspense>
        ) : (
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 2,
              textAlign: "center",
              bgcolor: "background.paper",
              boxShadow: "none",
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                mx: "auto",
                mb: 1.5,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                bgcolor: "action.selected",
                color: "primary.main",
              }}
            >
              <SearchRoundedIcon />
            </Box>
            <Typography variant="h6" fontWeight={900}>
              Velg et produkt
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Søk etter et produkt for å se prishistorikk, trender og butikkoversikt.
            </Typography>
          </Paper>
        ))}
    </AppScreen>
  );
}
