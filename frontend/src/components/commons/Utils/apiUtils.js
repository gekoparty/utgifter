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
  
  export const fetchShops = async () => {
    try {
      const fetchShopsURL = new URL("/api/shops", API_URL);
      const shopsResponse = await fetch(fetchShopsURL.href);
      const shopsData = await shopsResponse.json();
  
      const fetchLocationsURL = new URL("/api/locations", API_URL);
      const locationsResponse = await fetch(fetchLocationsURL.href);
      const locationsData = await locationsResponse.json();
  
      const shopsWithData = shopsData.map(shop => {
        const location = locationsData.find(location => location._id === shop.location);
        const locationName = location ? location.name : 'Unknown Location';
        return { ...shop, locationName };
      });
  
      console.log('Shops with location names:', shopsWithData);
      return shopsWithData;
    } catch (error) {
      console.error('Error fetching shops:', error);
      return [];
    }
};

  export const fetchProducts = async () => {
    const fetchURL = new URL("/api/products", API_URL); // Replace with your actual endpoint
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