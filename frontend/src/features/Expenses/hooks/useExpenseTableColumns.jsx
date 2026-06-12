import { useMemo } from "react";
import DateRangeFilter from "../components/ExpenseFilters/DateRangeFilter";
import PriceRangeFilter from "../components/ExpenseFilters/PriceRangeFilter";
import {
  DateCell,
  MutedCell,
  PriceBadge,
  TextCell,
} from "../components/ExpenseTable/ExpenseTableCells";
import {
  formatBool,
  formatExpenseDate,
  NOK,
} from "../utils/expenseFormatters";

export const useExpenseTableColumns = ({
  priceDisplayMode,
  priceStatsByType,
  onPriceFilterModeChange,
}) => {
  const priceColumn = useMemo(() => {
    const resolvedAccessor =
      priceDisplayMode === "finalPrice"
        ? { header: "Totalpris", key: "finalPrice" }
        : priceDisplayMode === "price"
          ? { header: "Registrert Pris", key: "price" }
          : { header: "Pris per enhet", key: "pricePerUnit" };

    return {
      id: "displayPrice",
      accessorFn: (row) => row[resolvedAccessor.key],
      header: resolvedAccessor.header,
      Filter: ({ column }) => (
        <PriceRangeFilter
          column={column}
          onModeChange={onPriceFilterModeChange}
        />
      ),
      enableColumnFilter: true,
      enableSorting: false,
      Cell: ({ row }) => {
        const value = row.original[resolvedAccessor.key];
        const type = row.original.variantName || "Ukjent";
        const stats = priceStatsByType[type] || {};

        let tone = "neutral";

        if (resolvedAccessor.key === "pricePerUnit" && stats.median != null) {
          const rangeLow = stats.min + (stats.median - stats.min) / 2;
          const rangeHigh = stats.max - (stats.max - stats.median) / 2;

          if (value <= rangeLow) tone = "success";
          else if (value >= rangeHigh) tone = "error";
          else tone = "warning";
        }

        return <PriceBadge value={value} tone={tone} />;
      },
    };
  }, [priceDisplayMode, priceStatsByType, onPriceFilterModeChange]);

  const dateColumn = useMemo(
    () => ({
      accessorKey: "purchaseDate",
      header: "Kjøpsdato",
      Filter: ({ column }) => <DateRangeFilter column={column} />,
      enableColumnFilter: true,
      Cell: ({ row }) => (
        <DateCell
          value={formatExpenseDate(
            row.original.purchaseDate,
            row.original.purchaseDateDisplay,
          )}
        />
      ),
    }),
    [],
  );

  return useMemo(
    () => [
      {
        accessorKey: "productName",
        header: "Produktnavn",
        size: 220,
        Cell: ({ row }) => (
          <TextCell
            primary={row.original.productName}
            secondary={
              row.original.brandName !== "N/A" ? row.original.brandName : ""
            }
          />
        ),
      },
      {
        accessorKey: "variantName",
        header: "Variant",
        size: 150,
        Cell: ({ cell }) => <MutedCell value={cell.getValue()} />,
      },
      priceColumn,
      {
        accessorKey: "shopName",
        header: "Butikk",
        size: 150,
        Cell: ({ cell }) => <MutedCell value={cell.getValue()} />,
      },
      dateColumn,
      { accessorKey: "brandName", header: "Merke" },
      {
        accessorKey: "finalPrice",
        header: "Total (felt)",
        Cell: ({ cell }) => NOK.format(cell.getValue() ?? 0),
      },
      {
        accessorKey: "price",
        header: "Pris (felt)",
        Cell: ({ cell }) => NOK.format(cell.getValue() ?? 0),
      },
      {
        accessorKey: "quantity",
        header: "Antall",
        Cell: ({ cell }) => cell.getValue() ?? 0,
      },
      {
        accessorKey: "volume",
        header: "Volum",
        Cell: ({ cell }) => cell.getValue() ?? 0,
      },
      { accessorKey: "measurementUnit", header: "Måleenhet" },
      {
        accessorKey: "hasDiscount",
        header: "Har rabatt",
        Cell: ({ cell }) => formatBool(cell.getValue()),
      },
      {
        accessorKey: "discountValue",
        header: "Rabatt %",
        Cell: ({ cell }) => cell.getValue() ?? 0,
      },
      {
        accessorKey: "discountAmount",
        header: "Rabatt beløp",
        Cell: ({ cell }) => NOK.format(cell.getValue() ?? 0),
      },
      {
        accessorKey: "purchased",
        header: "Kjøpt",
        Cell: ({ cell }) => formatBool(cell.getValue()),
      },
      { accessorKey: "locationName", header: "Lokasjon" },
      {
        accessorKey: "registeredDate",
        header: "Registrert dato",
        Cell: ({ row }) =>
          formatExpenseDate(
            row.original.registeredDate,
            row.original.registeredDateDisplay,
          ),
      },
    ],
    [priceColumn, dateColumn],
  );
};
