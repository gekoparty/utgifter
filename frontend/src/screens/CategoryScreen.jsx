import React, { lazy } from "react";
import CategoryIcon from "@mui/icons-material/Category";

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
    description="Bruk kategorier til å skille dagligvarer, tjenester og andre kjøp i rapporter og oversikter."
    DialogComponent={CategoryDialog}
    dialogRecordProp="categoryToEdit"
    endpoint="/api/categories"
    getData={(data) => data?.categories ?? []}
    getMeta={(data) => data?.meta ?? {}}
    IconComponent={CategoryIcon}
    initialSelectedRecord={INITIAL_SELECTED_CATEGORY}
    loadDialog={loadCategoryDialog}
    loadingLabel="Laster kategorier..."
    queryKey={QUERY_KEY}
    resourceLabel="Kategori"
    screenTitle="Kategorier"
  />
);

export default CategoryScreen;
