import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

import { styled } from "@mui/material/styles";
import Box from '@mui/material/Box'; 
import Paper from "@mui/material/Paper";
import GridWrapper from "../commons/GridWrapper/GridWrapper";

const CardWrapper = styled(Box)(({ theme }) => ({
  marginTop: "50px",
  paddingTop: "10px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  padding: theme.spacing(2),
  minWidth: 700,
  minHeight: 800, // adjust this value to your liking
}));


const BasicCard = ({ header, content, drawerWidth }) => {
  const cardStyles = {
    display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: "90%",
        padding: '16px',

  };

  return (
    <CardWrapper>
    <Card sx={cardStyles}>
      {header}
      <CardContent sx={{display: "flex", justifyContent: "center"}}>
          {content}
        </CardContent>
    </Card>
    </CardWrapper>
  );
};

export default BasicCard;
