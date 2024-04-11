const formatComponentFields = (name, componentName, fieldName) => {
  const nameMappings = {
    shop: ["name", "location", "category"],
    brand: ["name"],
    location: ["name"],
    category: ["name"],
    product: ["name", "brands"]
    // Add more components and their corresponding fields here if needed
  };

  const fields = nameMappings[componentName];
  if (!fields) {
    throw new Error(`Component '${componentName}' not found in nameMappings.`);
  }

  const capitalizeWord = (word) => {
    
    if (!word || typeof word !== 'string') {
      return ""; // Handle empty or non-string input
    } // Handle empty word (e.g., multiple hyphens in a row)
    const hyphenatedWords = word.split("-");
    const capitalizedWords = hyphenatedWords.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    return capitalizedWords.join("-");
  };

  console.log("Input:", name); // Log the input value

  if (fields.length === 1) {
    if (fieldName === "name") {
      return capitalizeWord(name); // Only format 'name' field as a string directly
    } else {
      const formatted = capitalizeWord(name);
      return { name: formatted }; // For other fields, return the formatted object
    }
  } else {
    const formatted = capitalizeWord(name);
    // If multiple fields, return an object with each field formatted
    const formattedObject = {};
    fields.forEach((field) => {
      formattedObject[field] = formatted;
    });
    console.log("Formatted Output:", formattedObject);
    return formattedObject;
  }
  
};

export { formatComponentFields };

