import React, { lazy } from "react";
import StorefrontIcon from "@mui/icons-material/Storefront";

import EntityTableScreen from "../components/commons/EntityTableScreen/EntityTableScreen";
import { useTranslation } from "../i18n/useTranslation";

const loadShopDialog = () =>
  import("../features/Shops/ShopDialogs/ShopDialog");
const ShopDialog = lazy(loadShopDialog);

const QUERY_KEY = ["shops", "paginated"];
const INITIAL_SELECTED_SHOP = {
  _id: "",
  name: "",
  location: "",
  category: "",
  locationName: "",
  categoryName: "",
};

const ShopScreen = () => {
  const { t } = useTranslation();
  const columns = [
    { accessorKey: "name", header: t("registers.shop") },
    { accessorKey: "locationName", header: t("registers.location") },
    { accessorKey: "categoryName", header: t("registers.category") },
  ];

  return (
    <EntityTableScreen
      addButtonLabel={t("registers.newShop")}
      columns={columns}
      description={t("registers.shopsDescription")}
      DialogComponent={ShopDialog}
      dialogRecordProp="shopToEdit"
      endpoint="/api/shops"
      getData={(data) => data?.shops ?? []}
      getMeta={(data) => data?.meta ?? {}}
      IconComponent={StorefrontIcon}
      initialSelectedRecord={INITIAL_SELECTED_SHOP}
      loadDialog={loadShopDialog}
      loadingLabel={t("registers.loadingShops")}
      queryKey={QUERY_KEY}
      resourceLabel={t("registers.shop")}
      screenTitle={t("registers.shopsTitle")}
    />
  );
};

export default ShopScreen;
