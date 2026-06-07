// src/screens/StatsScreen.jsx
import { useOutletContext } from "react-router-dom";
import MonthlyExpensesChart from "../components/Charts/MonthlyExpensesChart/MonthlyExpensesChart";
import ProductPriceChart from "../components/Charts/ProductPriceChart/ProductPriceChart";
import { Box, Paper, Typography } from "@mui/material";

export default function StatsScreen() {
  const { view, productId } = useOutletContext();

  return (
    <Box sx={{ display: "grid", gap: { xs: 2, md: 3 } }}>
      {view === "expenses" && <MonthlyExpensesChart />}
      {view === "price" && (
        productId
          ? <ProductPriceChart productId={productId} />
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
