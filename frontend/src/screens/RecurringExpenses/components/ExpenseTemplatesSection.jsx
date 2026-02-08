import React, { memo } from "react";
import { Box, Typography } from "@mui/material";
import ExpenseTemplateCard from "./ExpenseTemplateCard";
import VirtualizedExpenseGrid from "./VirtualizedExpenseGrid";

const VIRTUALIZE_AFTER = 60;

function ExpenseTemplatesSection({
  expenses,
  onEdit,
  onArchive,   // ⭐ CHANGED
  formatCurrency,
}) {
  const shouldVirtualize = (expenses?.length ?? 0) >= VIRTUALIZE_AFTER;

  return (
    <Box sx={{ gridColumn: "1 / -1" }}>
      <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>
        Dine faste kostnader (maler)
      </Typography>

      {shouldVirtualize ? (
        <VirtualizedExpenseGrid
          expenses={expenses}
          onEdit={onEdit}
          onArchive={onArchive}   // ⭐ CHANGED
          formatCurrency={formatCurrency}
          height={720}
        />
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(3, minmax(0, 1fr))",
              xl: "repeat(4, minmax(0, 1fr))",
            },
          }}
        >
          {expenses.map((e) => (
            <ExpenseTemplateCard
              key={e._id || e.id}
              expense={e}
              onEdit={onEdit}
              onArchive={onArchive}   // ⭐ CHANGED
              formatCurrency={formatCurrency}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

export default memo(ExpenseTemplatesSection);
