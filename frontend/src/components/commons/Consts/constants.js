export const measurementUnitOptions = [
    { value: "l", label: "Litres (l)" },
    { value: "kg", label: "Kilos (kg)" },
    { value: "stk", label: "Stykk (stk)" },
    // Add more measurement unit options as needed
];

export const predefinedTypes = [
    "Matvare", "Baderom","Medisin","Transport", "Elektronikk", "Hage", "Rengjøring", "Hobby", "Lege/Tannlege", "Katt", "Soverom",
    "Alkohol", "Bil", "Båt/Fiske", "Hus", "Gave", "Hage", "Kjøkken",
    "Gambling", "Datautstyr", "Pakke", "Ferje", "Hår/Hud", "Brev/Pakke","Fisk",
    "Reise", "Ferdigmat", "Jernvare", "Elektronikk", "Bil", "Artikler",
    "Klær", "Verktøy", "Tobakk", "Dokumenter", "BobilParkering","Apper/Spill", "Annet"
];

export const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };
export const INITIAL_SORTING = [{ id: "name", desc: false }];
export const INITIAL_SELECTED_PRODUCT = { _id: "", name: "" };

// 🛑 THE FIX IS HERE 🛑
export const API_URL =
    import.meta.env.VITE_REACT_APP_API_URL ||
    (import.meta.env.DEV ? "http://localhost:5000" : "");

