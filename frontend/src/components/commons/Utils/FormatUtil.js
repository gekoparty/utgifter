const formatComponentFields = (name, componentName) => {
  const nameMappings = {
    shop: ["name", "location", "category"],
    brand: ["name"],
    location: ["name"]
    // Add more components and their corresponding fields here if needed
  };

  const fields = nameMappings[componentName];
  if (!fields) {
    throw new Error(`Component '${componentName}' not found in nameMappings.`);
  }

  const capitalizeWord = (word) => {
    if (word.length === 0) return ""; // Handle empty word (e.g., multiple hyphens in a row)
    const hyphenatedWords = word.split("-");
    const capitalizedWords = hyphenatedWords.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    return capitalizedWords.join("-");
  };

  const formatted = name
    .split(" ")
    .map(capitalizeWord)
    .join(" ");

  if (fields.length === 1) {
    return formatted; // If only one field, return the formatted string
  } else {
    // If multiple fields, return an object with each field formatted
    const formattedObject = {};
    fields.forEach((field) => {
      formattedObject[field] = formatted;
    });
    return formattedObject;
  }
};

export { formatComponentFields };

