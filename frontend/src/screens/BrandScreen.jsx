import React, { lazy } from "react";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";

import EntityTableScreen from "../components/commons/EntityTableScreen/EntityTableScreen";
import { useTranslation } from "../i18n/useTranslation";

const loadBrandDialog = () =>
  import("../features/Brands/BrandDialogs/BrandDialog");
const BrandDialog = lazy(loadBrandDialog);

const QUERY_KEY = ["brands", "paginated"];
const INITIAL_SELECTED_BRAND = { _id: "", name: "" };

const BrandScreen = () => {
  const { t } = useTranslation();
  const columns = [{ accessorKey: "name", header: t("registers.brandName") }];

  return (
    <EntityTableScreen
      addButtonLabel={t("registers.newBrand")}
      columns={columns}
      description={t("registers.brandsDescription")}
      DialogComponent={BrandDialog}
      dialogRecordProp="brandToEdit"
      endpoint="/api/brands"
      getData={(data) => data?.brands ?? []}
      getMeta={(data) => data?.meta ?? {}}
      IconComponent={LocalOfferIcon}
      initialSelectedRecord={INITIAL_SELECTED_BRAND}
      loadDialog={loadBrandDialog}
      loadingLabel={t("registers.loadingBrands")}
      queryKey={QUERY_KEY}
      resourceLabel={t("registers.brand")}
      screenTitle={t("registers.brandsTitle")}
    />
  );
};

export default BrandScreen;
