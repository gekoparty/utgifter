export const measurementUnitOptions = [
    { value: "l", label: "Litres (l)" },
    { value: "kg", label: "Kilos (kg)" },
    { value: "stk", label: "Stykk (stk)" },
    // Add more measurement unit options as needed
  ];
  
  export const predefinedTypes = [
    "Matvare", "Medesin", "Elektronikk", "Hobby", "Katt", "Soverom",
    "Alkohol", "Bil", "Båt/Fiske", "Hus", "Gave", "Hage", "Kjøkken",
    "Gambling", "Datautstyr", "Pakke", "Ferje", "Hår/Hud", "Brev/Pakke",
    "Reise", "Ferdigmat", "Jernvare", "Elektronikk", "Bil", "Artikler",
    "Klær", "Verktøy", "Tobakk",
  ];

  export const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };
export const INITIAL_SORTING = [{ id: "name", desc: false }];
export const INITIAL_SELECTED_PRODUCT = { _id: "", name: "" };
export const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.material-react-table.com"
    : process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "http://localhost:3000"; // Fallback for unknown environments

console.log("API_URL:", API_URL); // Debugging line