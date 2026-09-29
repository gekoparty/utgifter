export const measurementUnitOptions = [
    { value: "l", label: "Litres (l)" },
    { value: "kg", label: "Kilos (kg)" },
    { value: "stk", label: "Stykk (stk)" },
    // Add more measurement unit options as needed
];

export const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };
export const INITIAL_SORTING = [{ id: "name", desc: false }];
export const INITIAL_SELECTED_PRODUCT = { _id: "", name: "" };

const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

export const API_URL = trimTrailingSlash(
    import.meta.env.DEV
        ? import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000"
        : window.location.origin
);

