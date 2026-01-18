export const getSelectStyles = (theme) => {
  const isDark = theme.palette.mode === "dark";

  return {
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),

    menu: (base) => ({
      ...base,
      backgroundColor: isDark ? theme.palette.background.paper : "#fff",
      color: isDark ? "#fff" : "#000",
      border: `1px solid ${isDark ? theme.palette.divider : "#ddd"}`,
      // optional: make menu a bit wider than control so long names fit better
      minWidth: 420,
    }),

    control: (base, state) => ({
      ...base,
      width: "100%",
      backgroundColor: isDark ? theme.palette.background.default : "#fff",
      color: isDark ? "#fff" : "#000",
      borderColor: state.isFocused ? theme.palette.primary.main : theme.palette.divider,
      boxShadow: state.isFocused ? `0 0 0 1px ${theme.palette.primary.main}` : "none",
      "&:hover": { borderColor: theme.palette.primary.main },
    }),

    container: (base) => ({
      ...base,
      width: "100%",
    }),

    // ✅ selected value: single line + ellipsis
    singleValue: (base) => ({
      ...base,
      color: isDark ? "#fff" : "#000",
      maxWidth: "100%",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    }),

    // ✅ input also single-line
    input: (base) => ({
      ...base,
      color: isDark ? "#fff" : "#000",
    }),

    placeholder: (base) => ({
      ...base,
      color: isDark ? "#aaa" : "#666",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    }),

    // ✅ dropdown option: force one line + ellipsis (no wrap)
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
      "&:active": { backgroundColor: isDark ? "#555" : "#ccc" },

      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    }),

    noOptionsMessage: (base) => ({
      ...base,
      color: isDark ? "#fff" : "#000",
      backgroundColor: isDark ? theme.palette.background.paper : "#fff",
    }),
  };
};