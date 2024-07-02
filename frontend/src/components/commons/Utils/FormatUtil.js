const formatComponentFields = (name, componentName, fieldName) => {
  const nameMappings = {
    shop: ["name", "location", "category"],
    brand: ["name"],
    location: ["name"],
    category: ["name"],
    product: ["name", "brands"],
    expense: ["productName", "brandName", "shopName"]
    // Add more components and their corresponding fields here if needed
  };

  const fields = nameMappings[componentName];
  if (!fields) {
    throw new Error(`Component '${componentName}' not found in nameMappings.`);
  }

  const capitalizeWord = (word) => {
    if (!word || typeof word !== 'string') {
      return ""; // Handle empty or non-string input
    }

    // Split by spaces and hyphens to handle multi-word names and hyphenated words
    const words = word.split(/[\s-]+/);
    const capitalizedWords = words.map((w) => {
      // Capitalize each word in the split array
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    });

    // Join capitalized words back with spaces or hyphens
    if (word.includes("-")) {
      return capitalizedWords.join("-");
    } else {
      return capitalizedWords.join(" ");
    }
  };

  console.log("Input:", name); // Log the input value

  if (fields.includes(fieldName)) {
    return capitalizeWord(name); // Format the specific field based on fieldName
  } else {
    return name; // Return unchanged if fieldName doesn't match expected fields
  }
};

export { formatComponentFields };


