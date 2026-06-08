import React, { lazy, useMemo } from "react";

import EntityTableScreen from "../components/commons/EntityTableScreen/EntityTableScreen";
import ChipsOverflow from "./CellUtils/ChipsOverflow";

const loadProductDialog = () =>
  import("../components/features/Products/ProductDialogs/ProductDialog");
const ProductDialog = lazy(loadProductDialog);

const QUERY_KEY = ["products", "paginated"];
const INITIAL_SELECTED_PRODUCT = { _id: "", name: "" };

const ProductScreen = () => {
  const columns = useMemo(
    () => [
      { accessorKey: "name", header: "Produkter" },
      { accessorKey: "brand", header: "Merker" },
      {
        accessorKey: "variants",
        header: "Varianter",
        Cell: ({ cell }) => (
          <ChipsOverflow
            items={Array.isArray(cell.getValue()) ? cell.getValue() : []}
            maxVisible={3}
            popoverTitle="Varianter"
            tone="primary"
            getLabel={(x) => (typeof x === "object" ? x?.name : String(x))}
            getKey={(x) => (typeof x === "object" ? x?._id : String(x))}
          />
        ),
      },
      { accessorKey: "category", header: "Kategori" },
      {
        accessorKey: "expenseCount",
        header: "Brukt i utgifter",
        Cell: ({ cell }) => {
          const count = Number(cell.getValue());
          return Number.isFinite(count) ? count : 0;
        },
      },
      {
        accessorKey: "measures",
        header: "Mål",
        Cell: ({ cell }) => {
          const measures = cell.getValue();
          return Array.isArray(measures)
            ? measures.join(" ")
            : measures || "N/A";
        },
      },
    ],
    [],
  );

  return (
    <EntityTableScreen
      addButtonLabel="Nytt produkt"
      columns={columns}
      DialogComponent={ProductDialog}
      dialogRecordProp="productToEdit"
      endpoint="/api/products"
      getData={(data) => data?.products ?? []}
      getMeta={(data) => data?.meta ?? {}}
      getRecordName={(record) => record?.name ?? record?.data?.name ?? ""}
      initialSelectedRecord={INITIAL_SELECTED_PRODUCT}
      loadDialog={loadProductDialog}
      loadingLabel="Laster produkter..."
      queryKey={QUERY_KEY}
      resourceLabel="Produkt"
    />
  );
};

export default ProductScreen;
