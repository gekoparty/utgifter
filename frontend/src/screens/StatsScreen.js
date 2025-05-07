// src/screens/StatsScreen.jsx
import React from "react";
import { useOutletContext } from "react-router-dom";
import MonthlyExpensesChart from "../components/Charts/MonthlyExpensesChart";
import ProductPriceChart from "../components/Charts/ProductPriceChart";
import { Typography } from "@mui/material";

export default function StatsScreen() {
  const { view, productId } = useOutletContext();

  return (
    <>
      {view === "expenses" && <MonthlyExpensesChart />}
      {view === "price" && (
        productId
          ? <ProductPriceChart productId={productId} />
          : <Typography>Please select a product above to view its price history.</Typography>
      )}
    </>
  );
}
