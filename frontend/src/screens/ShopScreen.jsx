import React, { lazy } from "react";
import StorefrontIcon from "@mui/icons-material/Storefront";

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
    description="Hold styr på butikker, sted og kategori slik at kjøp, faste utgifter og prisstatistikk kan grupperes riktig."
    DialogComponent={ShopDialog}
    dialogRecordProp="shopToEdit"
    endpoint="/api/shops"
    getData={(data) => data?.shops ?? []}
    getMeta={(data) => data?.meta ?? {}}
    getPreviewLabel={(shop) =>
      [shop?.name, shop?.locationName, shop?.categoryName]
        .filter(Boolean)
        .join(" · ")
    }
    IconComponent={StorefrontIcon}
    initialSelectedRecord={INITIAL_SELECTED_SHOP}
    loadDialog={loadShopDialog}
    loadingLabel="Laster butikker..."
    queryKey={QUERY_KEY}
    resourceLabel="Butikk"
    screenTitle="Butikker"
  />
);

export default ShopScreen;
