import React, { lazy, useMemo, useState } from "react";
import CategoryIcon from "@mui/icons-material/Category";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";

import EntityTableScreen from "../components/commons/EntityTableScreen/EntityTableScreen";
import { useTranslation } from "../i18n/useTranslation";

const loadCategoryDialog = () =>
  import("../features/Categories/CategoryDialogs/CategoryDialog");
const CategoryDialog = lazy(loadCategoryDialog);

const QUERY_KEY = ["categories", "paginated"];
const INITIAL_SELECTED_CATEGORY = { _id: "", name: "" };

const CategoryScreen = () => {
  const { t } = useTranslation();
  const [categoryType, setCategoryType] = useState("product");
  const typedQueryKey = useMemo(
    () => [...QUERY_KEY, categoryType],
    [categoryType],
  );
  const endpoint = `/api/categories?type=${categoryType}`;
  const typeLabel =
    categoryType === "product" ? "produktkategorier" : "butikkategorier";
  const initialSelectedCategory = useMemo(
    () => ({ ...INITIAL_SELECTED_CATEGORY, type: categoryType }),
    [categoryType],
  );
  const dialogExtraProps = useMemo(() => ({ categoryType }), [categoryType]);

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
      addButtonLabel={
        categoryType === "product" ? "Ny produktkategori" : "Ny butikkategori"
      }
      columns={columns}
      description={`Administrer ${typeLabel}. Produkter og butikker bruker hver sin liste.`}
      DialogComponent={CategoryDialog}
      dialogExtraProps={dialogExtraProps}
      dialogRecordProp="categoryToEdit"
      endpoint={endpoint}
      getData={(data) => data?.categories ?? []}
      getMeta={(data) => data?.meta ?? {}}
      IconComponent={CategoryIcon}
      initialSelectedRecord={initialSelectedCategory}
      loadDialog={loadCategoryDialog}
      loadingLabel={t("registers.loadingCategories")}
      queryKey={typedQueryKey}
      resourceLabel={t("registers.categorySingle")}
      screenTitle={t("registers.categoriesTitle")}
      workflow={{
        question: "Hva skal kategoriseres?",
        answer: "Produktkategorier styrer varer og statistikk. Butikkategorier styrer butikker.",
        action: (
          <ToggleButtonGroup
            exclusive
            size="small"
            value={categoryType}
            onChange={(_, value) => {
              if (value) setCategoryType(value);
            }}
          >
            <ToggleButton value="product">Produkter</ToggleButton>
            <ToggleButton value="shop">Butikker</ToggleButton>
          </ToggleButtonGroup>
        ),
      }}
    />
  );
};

export default CategoryScreen;
