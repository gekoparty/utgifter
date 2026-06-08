import { API_URL } from "../Consts/constants";

export const buildPaginatedUrl = (endpoint, params) => {
  const url = new URL(endpoint, API_URL);
  url.searchParams.set("start", params.pageIndex * params.pageSize);
  url.searchParams.set("size", params.pageSize);
  url.searchParams.set("sorting", JSON.stringify(params.sorting ?? []));
  url.searchParams.set("columnFilters", JSON.stringify(params.filters ?? []));
  url.searchParams.set("globalFilter", params.globalFilter ?? "");
  return url;
};
