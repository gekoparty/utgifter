export const EXPENSES_QUERY_KEY = ["expenses", "paginated"];

export const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };

export const INITIAL_SORTING = [{ id: "purchaseDate", desc: true }];

export const PRICE_MODE_LABELS = {
  pricePerUnit: "Enhet",
  finalPrice: "Total",
  price: "Pris",
};

export const INITIAL_SELECTED_EXPENSE = {
  _id: "",
  productName: "",
  brandName: "",
  shopName: "",
  locationName: "",
  price: 0,
  volume: 0,
  discountValue: 0,
  discountAmount: 0,
  finalPrice: 0,
  quantity: 1,
  hasDiscount: false,
  purchased: false,
  registeredDate: null,
  purchaseDate: null,
  productId: "",
  brandId: "",
  shopId: "",
  locationId: "",
  variant: "",
  variantName: "",
  measurementUnit: "",
  pricePerUnit: 0,
  variants: [],
  measures: [],
};

export const DEFAULT_COLUMN_VISIBILITY = {
  productName: true,
  variantName: true,
  shopName: true,
  purchaseDate: true,
  displayPrice: true,
  pricePerUnit: true,
  finalPrice: true,
  price: true,
  brandName: false,
  quantity: false,
  volume: false,
  measurementUnit: false,
  hasDiscount: false,
  discountValue: false,
  discountAmount: false,
  purchased: false,
  registeredDate: false,
  locationName: false,
};
