import React, { lazy } from "react";

import EntityTableScreen from "../components/commons/EntityTableScreen/EntityTableScreen";

const loadShopDialog = () =>
  import("../components/features/Shops/ShopDialogs/ShopDialog");
const ShopDialog = lazy(loadShopDialog);

const COLUMNS = [
  { accessorKey: "name", header: "Butikk" },
  { accessorKey: "locationName", header: "Lokasjon" },
  { accessorKey: "categoryName", header: "Kategori" },
];
const QUERY_KEY = ["shops", "paginated"];
const INITIAL_SELECTED_SHOP = {
  _id: "",
  name: "",
  location: "",
  category: "",
  locationName: "",
  categoryName: "",
};

const ShopScreen = () => (
  <EntityTableScreen
    addButtonLabel="Ny butikk"
    columns={COLUMNS}
    DialogComponent={ShopDialog}
    dialogRecordProp="shopToEdit"
    endpoint="/api/shops"
    getData={(data) => data?.shops ?? []}
    getMeta={(data) => data?.meta ?? {}}
    initialSelectedRecord={INITIAL_SELECTED_SHOP}
    loadDialog={loadShopDialog}
    loadingLabel="Laster butikker..."
    queryKey={QUERY_KEY}
    resourceLabel="Butikk"
  />
);

export default ShopScreen;
