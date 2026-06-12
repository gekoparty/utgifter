import { API_URL } from "../Consts/constants";
import { requestJson } from "../../../api/httpClient";

const asArray = (data, key) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  return [];
};

export const fetchLocations = async ({ signal }) => {
  const fetchURL = new URL("/api/locations", API_URL);
  return requestJson(fetchURL, { signal });
};
  
export const fetchShops = async ({ signal }) => {
  const fetchShopsURL = new URL("/api/shops", API_URL);
  const shopsData = await requestJson(fetchShopsURL, { signal });
  return asArray(shopsData, "shops");
};

export const fetchProducts = async ({ signal }) => {
  const fetchURL = new URL("/api/products", API_URL);
  return requestJson(fetchURL, { signal });
};


export const fetchCategories = async ({ signal }) => {
  const fetchURL = new URL("/api/categories", API_URL);
  return requestJson(fetchURL, { signal });
};

export const fetchBrands = async ({ infinite = false, page, search, signal } = {}) => {
  const fetchURL = new URL("/api/brands", API_URL);
    
  if (infinite) {
    fetchURL.searchParams.set("start", String((Number(page) || 0) * 20));
    fetchURL.searchParams.set("size", "20");
  }
    
  if (search) {
    fetchURL.searchParams.set("query", search);
  }
  
  return requestJson(fetchURL, { signal });
};
  

export const fetchExpenses = async ({ signal }) => {
  const fetchURL = new URL("/api/expenses", API_URL);
  return requestJson(fetchURL, { signal });
};

export const buildFetchURL = (pageIndex, pageSize, sorting, columnFilters, globalFilter, API_URL) => {
  const fetchURL = new URL("/api/products", API_URL);
  fetchURL.searchParams.set("start", `${pageIndex * pageSize}`);
  fetchURL.searchParams.set("size", `${pageSize}`);
  fetchURL.searchParams.set("sorting", JSON.stringify(sorting ?? []));
  fetchURL.searchParams.set("columnFilters", JSON.stringify(columnFilters ?? []));
  fetchURL.searchParams.set("globalFilter", globalFilter ?? "");
  return fetchURL;
};

export const prefetchPageData = async (
  queryClient,
  nextPageIndex,
  pagination,
  sorting,
  columnFilters,
  globalFilter,
  API_URL
) => {
  const fetchURL = buildFetchURL(
    nextPageIndex,
    pagination.pageSize,
    sorting,
    columnFilters,
    globalFilter,
    API_URL
  );
  queryClient.prefetchQuery({
    queryKey: [
      "products",
      columnFilters,
      globalFilter,
      nextPageIndex,
      pagination.pageSize,
      sorting,
    ],
    queryFn: ({ signal }) => requestJson(fetchURL, { signal }),
  });
};

