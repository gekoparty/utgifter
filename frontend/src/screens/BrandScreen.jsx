import React, { lazy } from "react";

import EntityTableScreen from "../components/commons/EntityTableScreen/EntityTableScreen";

const loadBrandDialog = () =>
  import("../components/features/Brands/BrandDialogs/BrandDialog");
const BrandDialog = lazy(loadBrandDialog);

const COLUMNS = [{ accessorKey: "name", header: "Merkenavn" }];
const QUERY_KEY = ["brands", "paginated"];
const INITIAL_SELECTED_BRAND = { _id: "", name: "" };

const BrandScreen = () => (
  <EntityTableScreen
    addButtonLabel="Nytt merke"
    columns={COLUMNS}
    DialogComponent={BrandDialog}
    dialogRecordProp="brandToEdit"
    endpoint="/api/brands"
    getData={(data) => data?.brands ?? []}
    getMeta={(data) => data?.meta ?? {}}
    initialSelectedRecord={INITIAL_SELECTED_BRAND}
    loadDialog={loadBrandDialog}
    loadingLabel="Laster merker..."
    queryKey={QUERY_KEY}
    resourceLabel="Merke"
  />
);

export default BrandScreen;
