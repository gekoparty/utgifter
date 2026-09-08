import React, { lazy, useMemo } from "react";

import EntityTableScreen from "../components/commons/EntityTableScreen/EntityTableScreen";
import ChipsOverflow from "../components/tableCells/ChipsOverflow";
import { useTranslation } from "../i18n/useTranslation";

const loadProductDialog = () =>
  import("../features/Products/ProductDialogs/ProductDialog");
const ProductDialog = lazy(loadProductDialog);

const QUERY_KEY = ["products", "paginated"];
const INITIAL_SELECTED_PRODUCT = { _id: "", name: "" };

const ProductScreen = () => {
  const { t } = useTranslation();
  const columns = useMemo(
    () => [
      { accessorKey: "name", header: t("registers.productName") },
      { accessorKey: "brand", header: t("registers.brands") },
      {
        accessorKey: "variants",
        header: t("registers.variants"),
        Cell: ({ cell }) => (
          <ChipsOverflow
            items={Array.isArray(cell.getValue()) ? cell.getValue() : []}
            maxVisible={3}
            popoverTitle={t("registers.variants")}
            tone="primary"
            getLabel={(x) => (typeof x === "object" ? x?.name : String(x))}
            getKey={(x) => (typeof x === "object" ? x?._id : String(x))}
          />
        ),
      },
      { accessorKey: "category", header: t("registers.category") },
      {
        accessorKey: "expenseCount",
        header: t("registers.expenseCount"),
        Cell: ({ cell }) => {
          const count = Number(cell.getValue());
          return Number.isFinite(count) ? count : 0;
        },
      },
      {
        accessorKey: "measures",
        header: t("registers.measures"),
        Cell: ({ cell }) => {
          const measures = cell.getValue();
          return Array.isArray(measures)
            ? measures.join(" ")
            : measures || "N/A";
        },
      },
    ],
    [t],
  );

  return (
    <EntityTableScreen
      addButtonLabel={t("registers.newProduct")}
      columns={columns}
      DialogComponent={ProductDialog}
      dialogRecordProp="productToEdit"
      endpoint="/api/products"
      getData={(data) => data?.products ?? []}
      getMeta={(data) => data?.meta ?? {}}
      getRecordName={(record) => record?.name ?? record?.data?.name ?? ""}
      initialSelectedRecord={INITIAL_SELECTED_PRODUCT}
      loadDialog={loadProductDialog}
      loadingLabel={t("registers.loadingProducts")}
      queryKey={QUERY_KEY}
      resourceLabel={t("registers.product")}
      screenTitle={t("registers.productsTitle")}
      description={t("registers.productsDescription")}
      workflow={{
        question: t("registers.productsQuestion"),
        answer: t("registers.productsAnswer"),
        steps: [
          t("registers.productStepFind"),
          t("registers.productStepClean"),
          t("registers.productStepCompare"),
        ],
      }}
    />
  );
};

export default ProductScreen;
