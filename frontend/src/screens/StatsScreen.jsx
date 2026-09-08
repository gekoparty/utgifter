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
import { useTranslation } from "../i18n/useTranslation";

const MonthlyExpensesChart = lazy(() =>
  import("../components/Charts/MonthlyExpensesChart/MonthlyExpensesChart")
);
const StatsDrilldownDrawer = lazy(() =>
  import("../components/Charts/MonthlyExpensesChart/ui/StatsDrilldownDrawer")
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
  const { t } = useTranslation();
  const selectStyles = useMemo(() => getSelectStyles(theme), [theme]);
  const [view, setView] = useState("expenses");
  const [productId, setProductId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [drilldown, setDrilldown] = useState(null);

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
      const drillName = row?.name || name;

      if (kind === "fixed-costs" || name === "Faste kostnader") {
        setDrilldown({
          kind: "fixed-costs",
          month: normalizedMonth,
          row,
          name: drillName,
        });
        return;
      }

      if (kind === "category") {
        setDrilldown({
          kind: "category",
          month: normalizedMonth,
          filterId: "category",
          filterValue: drillName,
          row,
          name: drillName,
        });
        return;
      }

      const filterMap = {
        shops: "shopName",
        brands: "brandName",
        locations: "locationName",
      };

      if (type === "categories") {
        setDrilldown({
          kind: "category",
          month: normalizedMonth,
          filterId: "category",
          filterValue: drillName,
          type,
          row,
          name: drillName,
        });
        return;
      }

      setDrilldown({
        kind: "expenses",
        month: normalizedMonth,
        filterId: filterMap[type],
        filterValue: drillName,
        type,
        row,
        name: drillName,
      });
    },
    [],
  );

  const handleOpenFullDrilldown = useCallback(
    (target) => {
      if (!target) return;

      if (target.kind === "fixed-costs") {
        const params = new URLSearchParams();
        if (target.month) params.set("month", target.month);
        navigate(`/recurring-expenses?${params.toString()}`);
        return;
      }

      if (target.kind === "category") {
        const params = new URLSearchParams();
        if (target.filterValue || target.name) {
          params.set("filterId", "category");
          params.set("filterValue", target.filterValue || target.name);
        }
        navigate(`/products?${params.toString()}`);
        return;
      }

      openExpenseDrilldown(target);
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
            ariaLabel={t("stats.viewLabel")}
            fullWidth
            options={[
              {
                value: "expenses",
                label: (
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <BarChartRoundedIcon fontSize="small" />
                    <span>{t("stats.months")}</span>
                  </Stack>
                ),
              },
              {
                value: "price",
                label: (
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <TimelineRoundedIcon fontSize="small" />
                    <span>{t("stats.priceHistory")}</span>
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
                placeholder={t("stats.searchProduct")}
                menuPortalTarget={menuPortalTarget}
                styles={selectStyles}
                hasNextPage={hasNextPage}
                fetchNextPage={fetchNextPage}
              />
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
              {t("stats.compareHint")}
            </Typography>
          )}
        </Stack>
  );

  return (
    <AppScreen
      title={t("stats.title")}
      subtitle={t("stats.subtitle")}
      icon={<BarChartRoundedIcon />}
      summaryItems={[
        { label: t("common.view"), value: view === "expenses" ? t("stats.months") : t("stats.priceHistory") },
        ...(selectedProduct ? [{ label: t("stats.product"), value: selectedProduct.label }] : []),
      ]}
      workflow={{
        question:
          view === "price"
            ? t("stats.priceQuestion")
            : t("stats.expensesQuestion"),
        answer:
          view === "price"
            ? t("stats.priceAnswer")
            : t("stats.expensesAnswer"),
        steps:
          view === "price"
            ? [t("stats.chooseProduct"), t("stats.comparePrice"), t("stats.checkShopDate")]
            : [t("stats.chooseYear"), t("stats.seeTrend"), t("stats.findDrivers")],
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
              {t("stats.chooseProductTitle")}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {t("stats.chooseProductText")}
            </Typography>
          </Paper>
        ))}

      <Suspense fallback={null}>
        <StatsDrilldownDrawer
          open={Boolean(drilldown)}
          drilldown={drilldown}
          onClose={() => setDrilldown(null)}
          onOpenFullView={handleOpenFullDrilldown}
        />
      </Suspense>
    </AppScreen>
  );
}
