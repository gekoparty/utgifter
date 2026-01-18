const formatComponentFields = (name, componentName, fieldName) => {
  const nameMappings = {
    shop: ["name", "location", "category"],
    brand: ["name"],
    location: ["name"],
    category: ["name"],
    product: ["name", "brands", "variants"],
    expense: ["productName", "brandName", "shopName"]
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
    const words = word.split(/([\s-])/); // This regex preserves spaces and hyphens
    const capitalizedWords = words.map((w) => {
      // Capitalize each word unless it's a space or hyphen
      return w.match(/[\s-]/) ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    });

    // Join capitalized words back together
    return capitalizedWords.join('');
  };


  if (fields.includes(fieldName)) {
    const formattedName = capitalizeWord(name); // Format the specific field based on fieldName
    return formattedName;
  } else {
    return name; // Return unchanged if fieldName doesn't match expected fields
  }
};

export { formatComponentFields };
