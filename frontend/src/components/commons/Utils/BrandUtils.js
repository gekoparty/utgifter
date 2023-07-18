const formattedBrandName = (brandName) => {
    return brandName
      .toLowerCase()
      .split("-")
      .map((word) => {
        const [firstChar, ...rest] = word;
        return firstChar.toUpperCase() + rest.join("").toLowerCase();
      })
      .join("-");
  };
  
  export { formattedBrandName }; 