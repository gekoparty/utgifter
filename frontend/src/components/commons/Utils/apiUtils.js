import { buildApiUrl, requestJson } from "../../../api/httpClient";

const asArray = (data, key) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  return [];
};

export const fetchLocations = async ({ signal }) => {
  const fetchURL = buildApiUrl("/api/locations");
  return requestJson(fetchURL, { signal });
};
  
export const fetchShops = async ({ signal }) => {
  const fetchShopsURL = buildApiUrl("/api/shops");
  const shopsData = await requestJson(fetchShopsURL, { signal });
  return asArray(shopsData, "shops");
};

export const fetchProducts = async ({ signal }) => {
  const fetchURL = buildApiUrl("/api/products");
  return requestJson(fetchURL, { signal });
};


export const fetchCategories = async ({ signal }) => {
  const fetchURL = buildApiUrl("/api/categories");
  return requestJson(fetchURL, { signal });
};

export const fetchBrands = async ({ infinite = false, page, search, signal } = {}) => {
  const fetchURL = buildApiUrl("/api/brands");
    
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
  const fetchURL = buildApiUrl("/api/expenses");
  return requestJson(fetchURL, { signal });
};

export const buildFetchURL = (pageIndex, pageSize, sorting, columnFilters, globalFilter, apiBaseUrl) => {
  const fetchURL = apiBaseUrl
    ? new URL("/api/products", apiBaseUrl)
    : buildApiUrl("/api/products");
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
  apiBaseUrl
) => {
  const fetchURL = buildFetchURL(
    nextPageIndex,
    pagination.pageSize,
    sorting,
    columnFilters,
    globalFilter,
    apiBaseUrl
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

