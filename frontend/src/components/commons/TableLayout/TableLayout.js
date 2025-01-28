import { Box } from "@mui/material";

const drawerWidth = 240;

const TableLayout = ({ children }) => {
  return (
    <Box
      sx={{
       
        marginLeft: `${drawerWidth}px`,
        display: "flex",
        justifyContent: "center",
        backgroundColor: "#2C2C2C", // Dark background color
        padding: 2, // Optional padding to provide some space around the content
        borderRadius: 2, // Optional rounded corners
      }}
      data-testid="table-layout"
    >
      <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1, 
            backgroundColor: "#333", // Slightly lighter dark color for inner box
          borderRadius: 1, // Optional rounded corners for inner box// Ensure it takes the full available space
            width: "100%",
          }}
        
        data-testid="table-layout-container"
      >
        {children}
      </Box>
    </Box>
  );
};

export default TableLayout;

  