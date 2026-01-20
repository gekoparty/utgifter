const isObjectId = (s) => /^[a-f\d]{24}$/i.test(String(s ?? "").trim());

const formatComponentFields = (name, componentName, fieldName) => {
  const nameMappings = {
    shop: ["name", "location", "category"],
    brand: ["name"],
    location: ["name"],
    category: ["name"],
    product: ["name", "brands", "variants"],
    expense: ["productName", "brandName", "shopName"],
  };

  const fields = nameMappings[componentName];
  if (!fields) {
    throw new Error(`Component '${componentName}' not found in nameMappings.`);
  }

  const capitalizeWord = (word) => {
    if (!word || typeof word !== "string") return "";

    const words = word.split(/([\s-])/);
    const capitalizedWords = words.map((w) =>
      w.match(/[\s-]/) ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    );

    return capitalizedWords.join("");
  };

  if (!fields.includes(fieldName)) return name;

  // ✅ IMPORTANT: don't "format" ids
  if (componentName === "product" && fieldName === "variants" && isObjectId(name)) {
    return String(name).trim();
  }

  return capitalizeWord(String(name ?? "").trim());
};

export { formatComponentFields };
