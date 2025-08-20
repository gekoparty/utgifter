import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";

const CardWrapper = styled(Box)(({ theme }) => ({
  marginTop: "50px",
  paddingTop: "10px",
  display: "flex",
  justifyContent: "center", // ⬅ Center horizontally
  alignItems: "flex-start", // align top
  padding: theme.spacing(2),
  width: "100%", // Full width wrapper so gradient can show
}));

const BasicCard = ({ header, content }) => {
  const cardStyles = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    maxWidth: 1200, // ⬅ Restrict max width so background shows on sides
    backgroundColor: "#FAFAFA", // softer white
    borderRadius: 12,
    boxShadow: "0px 4px 20px rgba(0,0,0,0.08)",
    padding: "16px",
  };

  return (
    <CardWrapper>
      <Card sx={cardStyles}>
        {header}
        <CardContent sx={{ display: "flex", justifyContent: "center" }}>
          {content}
        </CardContent>
      </Card>
    </CardWrapper>
  );
};

export default BasicCard;