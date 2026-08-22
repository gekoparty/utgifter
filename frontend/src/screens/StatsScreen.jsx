import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import debounce from "lodash.debounce";
import { useTheme } from "@mui/material/styles";

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

export default function StatsScreen() {
  const theme = useTheme();
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
      toolbar={toolbar}
      maxWidth={1360}
    >

      {view === "expenses" && (
        <Suspense fallback={null}>
          <MonthlyExpensesChart />
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
