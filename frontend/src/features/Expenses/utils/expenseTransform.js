const getEntityName = (value, fallback = "") => {
  if (typeof value === "string") return value;
  return value?.name || fallback;
};

const getEntityId = (value, fallback = "") => {
  if (typeof value === "string") return fallback;
  return value?._id || fallback;
};

const getTextValue = (value) => {
  if (typeof value === "string") return value.trim();
  if (value?.name) return String(value.name).trim();
  if (value?.label) return String(value.label).trim();
  return "";
};

const getProductCategory = (expense) =>
  getTextValue(expense.productCategory) ||
  getTextValue(expense.product?.category) ||
  getTextValue(expense.productName?.category) ||
  getTextValue(expense.category);

export const transformExpenseData = (json) => {
  const list = json.expenses || json.data || [];

  return {
    expenses: list.map((expense) => ({
      _id: expense._id,
      productName:
        getEntityName(expense.product, "") ||
        getEntityName(expense.productName, "N/A"),
      productId:
        getEntityId(expense.product, "") ||
        expense.productId ||
        getEntityId(expense.productName, ""),
      productCategory: getProductCategory(expense),
      brandName:
        getEntityName(expense.brand, "") || getEntityName(expense.brandName, "N/A"),
      brandId:
        getEntityId(expense.brand, "") ||
        expense.brandId ||
        getEntityId(expense.brandName, ""),
      shopName:
        getEntityName(expense.shop, "") || getEntityName(expense.shopName, "N/A"),
      locationName:
        getEntityName(expense.location, "") ||
        getEntityName(expense.locationName, "N/A"),
      price: expense.price,
      volume: expense.volume,
      discountValue: expense.discountValue,
      discountAmount: expense.discountAmount,
      finalPrice: expense.finalPrice,
      quantity: expense.quantity,
      hasDiscount: expense.hasDiscount,
      purchased: expense.purchased,
      registeredDate: expense.registeredDateRaw || expense.registeredDate,
      registeredDateDisplay: expense.registeredDate,
      purchaseDate: expense.purchaseDateRaw || expense.purchaseDate,
      purchaseDateDisplay: expense.purchaseDate,
      productBrandIds: Array.isArray(expense.productBrandIds)
        ? expense.productBrandIds
        : [],
      variant: expense.variant || "",
      variantName: expense.variantName || "",
      measurementUnit: expense.measurementUnit,
      pricePerUnit: expense.pricePerUnit,
      shopId:
        getEntityId(expense.shop, "") ||
        expense.shopId ||
        getEntityId(expense.shopName, ""),
      locationId:
        getEntityId(expense.location, "") ||
        expense.locationId ||
        getEntityId(expense.locationName, ""),
      variants: Array.isArray(expense.variants) ? expense.variants : [],
      measures: Array.isArray(expense.measures) ? expense.measures : [],
    })),
    meta: json.meta || { totalRowCount: 0 },
  };
};
