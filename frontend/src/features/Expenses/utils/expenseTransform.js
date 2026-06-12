export const transformExpenseData = (json) => {
  const list = json.expenses || json.data || [];

  return {
    expenses: list.map((expense) => ({
      _id: expense._id,
      productName: expense.product?.name || expense.productName || "N/A",
      productId: expense.product?._id || expense.productId || "",
      brandName: expense.brand?.name || expense.brandName || "N/A",
      brandId: expense.brand?._id || expense.brandId || "",
      shopName: expense.shop?.name || expense.shopName || "N/A",
      locationName: expense.location?.name || expense.locationName || "N/A",
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
      shopId: expense.shop?._id || expense.shopId || "",
      locationId: expense.location?._id || expense.locationId || "",
      variants: Array.isArray(expense.variants) ? expense.variants : [],
      measures: Array.isArray(expense.measures) ? expense.measures : [],
    })),
    meta: json.meta || { totalRowCount: 0 },
  };
};
