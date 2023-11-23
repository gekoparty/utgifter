// api.js (or any appropriate file)
const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.material-react-table.com"
    : "http://localhost:3000";


export const fetchLocations = async () => {
    const fetchURL = new URL("/api/locations", API_URL); // Replace with your actual endpoint
    const response = await fetch(fetchURL.href);
    const data = await response.json();
    return data;
  };

  export const fetchCategories = async () => {
    const fetchURL = new URL("/api/categories", API_URL); // Replace with your actual endpoint
    const response = await fetch(fetchURL.href);
    const data = await response.json();
    return data;
  };

  export const fetchBrands = async () => {
    const fetchURL = new URL("/api/brands", API_URL); // Replace with your actual endpoint
    const response = await fetch(fetchURL.href);
    const data = await response.json();
    return data;
  };