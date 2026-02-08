// src/screens/RecurringExpenses/components/VirtualizedExpenseGrid.jsx
import React, { memo, useMemo } from "react";
import { Box } from "@mui/material";
import { VirtuosoGrid } from "react-virtuoso";
import ExpenseTemplateCard from "./ExpenseTemplateCard";

function VirtualizedExpenseGrid({ expenses, onEdit, onDelete, formatCurrency, height = 720 }) {
  const data = useMemo(() => expenses ?? [], [expenses]);

  return (
    <Box sx={{ height }}>
      <VirtuosoGrid
        data={data}
        overscan={200}
        listClassName="virtuoso-grid-list"
        itemClassName="virtuoso-grid-item"
        components={{
          List: React.forwardRef(function List(props, ref) {
            return (
              <Box
                ref={ref}
                {...props}
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, minmax(0, 1fr))",
                    lg: "repeat(3, minmax(0, 1fr))",
                    xl: "repeat(4, minmax(0, 1fr))",
                  },
                  alignItems: "start",
                  // Virtuoso passes inline styles; keep them
                  ...(props?.style ? { ...props.style } : null),
                }}
              />
            );
          }),
          Item: function Item({ children, ...props }) {
            return (
              <Box {...props} sx={{ minWidth: 0 }}>
                {children}
              </Box>
            );
          },
        }}
        itemContent={(index, expense) => (
          <ExpenseTemplateCard
            key={expense._id || expense.id || index}
            expense={expense}
            onEdit={onEdit}
            onDelete={onDelete}
            formatCurrency={formatCurrency}
          />
        )}
      />
    </Box>
  );
}

export default memo(VirtualizedExpenseGrid);

