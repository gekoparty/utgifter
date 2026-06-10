// src/screens/StatsScreen.jsx
import { lazy, Suspense } from "react";
import { useOutletContext } from "react-router-dom";
import { Box, Paper, Typography } from "@mui/material";

const MonthlyExpensesChart = lazy(() =>
  import("../components/Charts/MonthlyExpensesChart/MonthlyExpensesChart")
);
const ProductPriceChart = lazy(() =>
  import("../components/Charts/ProductPriceChart/ProductPriceChart")
);

export default function StatsScreen() {
  const { view, productId } = useOutletContext();

  return (
    <Box sx={{ display: "grid", gap: { xs: 2, md: 3 } }}>
      {view === "expenses" && (
        <Suspense fallback={null}>
          <MonthlyExpensesChart />
        </Suspense>
      )}
      {view === "price" && (
        productId
          ? (
            <Suspense fallback={null}>
              <ProductPriceChart productId={productId} />
            </Suspense>
          )
          : (
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 3, md: 5 },
                borderRadius: 2,
                textAlign: "center",
                bgcolor: "background.paper",
              }}
            >
              <Typography variant="h6" fontWeight={800}>
                Velg et produkt
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Søk etter et produkt over for å se prishistorikk, trender og butikkoversikt.
              </Typography>
            </Paper>
          )
      )}
    </Box>
  );
}
