const formatComponentFields = (name, componentName) => {
  const nameMappings = {
    shop: ["name", "location", "category"],
    brand: ["name"],
    // Add more components and their corresponding fields here if needed
  };

  const fields = nameMappings[componentName];
  if (!fields) {
    throw new Error(`Component '${componentName}' not found in nameMappings.`);
  }

  const formatted = name
    .toLowerCase()
    .split("-")
    .map((word) => {
      const [firstChar, ...rest] = word;
      return firstChar.toUpperCase() + rest.join("").toLowerCase();
    })
    .join("-");

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

