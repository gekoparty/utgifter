import React, { lazy } from "react";
import CategoryIcon from "@mui/icons-material/Category";

import EntityTableScreen from "../components/commons/EntityTableScreen/EntityTableScreen";
import { useTranslation } from "../i18n/useTranslation";

const loadCategoryDialog = () =>
  import("../features/Categories/CategoryDialogs/CategoryDialog");
const CategoryDialog = lazy(loadCategoryDialog);

const QUERY_KEY = ["categories", "paginated"];
const INITIAL_SELECTED_CATEGORY = { _id: "", name: "" };

const CategoryScreen = () => {
  const { t } = useTranslation();
  const columns = [
    {
      accessorKey: "name",
      header: t("registers.categorySingle"),
      size: 150,
      grow: 2,
      minSize: 150,
      maxSize: 400,
    },
  ];

  return (
    <EntityTableScreen
      addButtonLabel={t("registers.newCategory")}
      columns={columns}
      description={t("registers.categoriesDescription")}
      DialogComponent={CategoryDialog}
      dialogRecordProp="categoryToEdit"
      endpoint="/api/categories"
      getData={(data) => data?.categories ?? []}
      getMeta={(data) => data?.meta ?? {}}
      IconComponent={CategoryIcon}
      initialSelectedRecord={INITIAL_SELECTED_CATEGORY}
      loadDialog={loadCategoryDialog}
      loadingLabel={t("registers.loadingCategories")}
      queryKey={QUERY_KEY}
      resourceLabel={t("registers.categorySingle")}
      screenTitle={t("registers.categoriesTitle")}
    />
  );
};

export default CategoryScreen;
