// src/components/Table/tableStyles.js

export const getTableStyles = (theme, isDarkMode) => ({
    muiTableHeadCellStyles: {
      backgroundColor: isDarkMode ? theme.palette.grey[800] : theme.palette.grey[200],
      color: isDarkMode ? theme.palette.common.white : theme.palette.common.black,
      minWidth: 80,
      maxWidth: 300,
    },
    muiTableBodyCellStyles: {
      backgroundColor: isDarkMode ? theme.palette.grey[900] : theme.palette.grey[200],
      color: isDarkMode ? theme.palette.grey[300] : theme.palette.grey[800],
      minWidth: 80,
      maxWidth: 300,
    },
    muiTopToolbarStyles: {
      backgroundColor: isDarkMode ? theme.palette.grey[800] : "#e0e0e0",
      color: isDarkMode ? theme.palette.common.white : "#333",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
    },
    muiBottomToolbarStyles: {
      backgroundColor: isDarkMode ? theme.palette.grey[800] : "#e0e0e0",
      color: isDarkMode ? theme.palette.common.white : "#333",
      boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.1)",
    },
  });