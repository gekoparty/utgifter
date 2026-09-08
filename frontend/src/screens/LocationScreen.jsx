import React, { lazy } from "react";
import PlaceIcon from "@mui/icons-material/Place";

import EntityTableScreen from "../components/commons/EntityTableScreen/EntityTableScreen";
import { useTranslation } from "../i18n/useTranslation";

const loadLocationDialog = () =>
  import("../features/Locations/LocationDialogs/LocationDialog");
const LocationDialog = lazy(loadLocationDialog);

const QUERY_KEY = ["locations", "paginated"];
const INITIAL_SELECTED_LOCATION = { _id: "", name: "" };

const LocationScreen = () => {
  const { t } = useTranslation();
  const columns = [{ accessorKey: "name", header: t("registers.places") }];

  return (
    <EntityTableScreen
      addButtonLabel={t("registers.newLocation")}
      columns={columns}
      description={t("registers.locationsDescription")}
      DialogComponent={LocationDialog}
      dialogRecordProp="locationToEdit"
      endpoint="/api/locations"
      getData={(data) => data?.locations ?? []}
      getMeta={(data) => data?.meta ?? {}}
      IconComponent={PlaceIcon}
      initialSelectedRecord={INITIAL_SELECTED_LOCATION}
      loadDialog={loadLocationDialog}
      loadingLabel={t("registers.loadingLocations")}
      queryKey={QUERY_KEY}
      resourceLabel={t("registers.locationSingle")}
      screenTitle={t("registers.locationsTitle")}
    />
  );
};

export default LocationScreen;
