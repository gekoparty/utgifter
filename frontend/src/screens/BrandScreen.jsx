import React, { lazy } from "react";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";

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
    description="Samle merkenavnene du bruker på produkter, priser og historikk. Dette gjør filtrering og statistikk ryddigere senere."
    DialogComponent={BrandDialog}
    dialogRecordProp="brandToEdit"
    endpoint="/api/brands"
    getData={(data) => data?.brands ?? []}
    getMeta={(data) => data?.meta ?? {}}
    IconComponent={LocalOfferIcon}
    initialSelectedRecord={INITIAL_SELECTED_BRAND}
    loadDialog={loadBrandDialog}
    loadingLabel="Laster merker..."
    queryKey={QUERY_KEY}
    resourceLabel="Merke"
    screenTitle="Merker"
  />
);

export default BrandScreen;
