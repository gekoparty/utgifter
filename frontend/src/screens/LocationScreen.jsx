import React, { lazy } from "react";

import EntityTableScreen from "../components/commons/EntityTableScreen/EntityTableScreen";

const loadLocationDialog = () =>
  import("../components/features/Locations/LocationDialogs/LocationDialog");
const LocationDialog = lazy(loadLocationDialog);

const COLUMNS = [{ accessorKey: "name", header: "Steder" }];
const QUERY_KEY = ["locations", "paginated"];
const INITIAL_SELECTED_LOCATION = { _id: "", name: "" };

const LocationScreen = () => (
  <EntityTableScreen
    addButtonLabel="Nytt sted"
    columns={COLUMNS}
    DialogComponent={LocationDialog}
    dialogRecordProp="locationToEdit"
    endpoint="/api/locations"
    getData={(data) => data?.locations ?? []}
    getMeta={(data) => data?.meta ?? {}}
    initialSelectedRecord={INITIAL_SELECTED_LOCATION}
    loadDialog={loadLocationDialog}
    loadingLabel="Laster steder..."
    queryKey={QUERY_KEY}
    resourceLabel="Sted"
  />
);

export default LocationScreen;
