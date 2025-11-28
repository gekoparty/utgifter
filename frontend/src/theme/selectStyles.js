export const getSelectStyles = (theme) => {
  const isDark = theme.palette.mode === "dark";

  return {
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),

    menu: (base) => ({
      ...base,
      backgroundColor: isDark
        ? theme.palette.background.paper
        : "#fff",
      color: isDark ? "#fff" : "#000",
      border: `1px solid ${
        isDark ? theme.palette.divider : "#ddd"
      }`,
    }),

    control: (base, state) => ({
      ...base,
      width: "100%",
      backgroundColor: isDark ? theme.palette.background.default : "#fff",
      color: isDark ? "#fff" : "#000",
      borderColor: state.isFocused ? theme.palette.primary.main : theme.palette.divider,
      boxShadow: state.isFocused ? `0 0 0 1px ${theme.palette.primary.main}` : "none",
      "&:hover": {
        borderColor: theme.palette.primary.main,
      },
    }),

    container: (base) => ({
      ...base,
      width: "100%",
    }),

    singleValue: (base) => ({
      ...base,
      color: isDark ? "#fff" : "#000",
    }),

    input: (base) => ({
      ...base,
      color: isDark ? "#fff" : "#000",
    }),

    placeholder: (base) => ({
      ...base,
      color: isDark ? "#aaa" : "#666",
    }),

    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused
        ? (isDark ? "#333" : "#eee")
        : state.isSelected
        ? (isDark ? "#444" : "#ddd")
        : isDark
        ? theme.palette.background.paper
        : "#fff",
      color: isDark ? "#fff" : "#000",
      "&:active": {
        backgroundColor: isDark ? "#555" : "#ccc",
      },
    }),

    noOptionsMessage: (base) => ({
      ...base,
      color: isDark ? "#fff" : "#000",
      backgroundColor: isDark
        ? theme.palette.background.paper
        : "#fff",
    }),
  };
};