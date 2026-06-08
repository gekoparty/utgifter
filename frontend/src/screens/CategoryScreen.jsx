import React, { lazy } from "react";

import EntityTableScreen from "../components/commons/EntityTableScreen/EntityTableScreen";

const loadCategoryDialog = () =>
  import("../components/features/Categories/CategoryDialogs/CategoryDialog");
const CategoryDialog = lazy(loadCategoryDialog);

const COLUMNS = [
  {
    accessorKey: "name",
    header: "Kategori",
    size: 150,
    grow: 2,
    minSize: 150,
    maxSize: 400,
  },
];
const QUERY_KEY = ["categories", "paginated"];
const INITIAL_SELECTED_CATEGORY = { _id: "", name: "" };

const CategoryScreen = () => (
  <EntityTableScreen
    addButtonLabel="Ny kategori"
    columns={COLUMNS}
    DialogComponent={CategoryDialog}
    dialogRecordProp="categoryToEdit"
    endpoint="/api/categories"
    getData={(data) => data?.categories ?? []}
    getMeta={(data) => data?.meta ?? {}}
    initialSelectedRecord={INITIAL_SELECTED_CATEGORY}
    loadDialog={loadCategoryDialog}
    loadingLabel="Laster kategorier..."
    queryKey={QUERY_KEY}
    resourceLabel="Kategori"
  />
);

export default CategoryScreen;
