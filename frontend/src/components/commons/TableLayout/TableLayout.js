import { Box } from "@mui/material";

const drawerWidth = 240;

const TableLayout = ({ children }) => {
  return (
    <Box
      sx={{
       
        marginLeft: `${drawerWidth}px`,
        display: "flex",
        justifyContent: "center",
        border: "2px solid red", // Add border to see the outer box
      }}
      data-testid="table-layout"
    >
      <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1, // Ensure it takes the full available space
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

  