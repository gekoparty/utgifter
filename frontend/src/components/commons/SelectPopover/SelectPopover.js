import React from "react";
import { Popover, List, ListItem, ListItemText } from "@mui/material";

const SelectPopover = ({ open, anchorEl, onClose, options = [], onSelect }) => {
    console.log("Popover open:", open); // This should log true when expected
    return (
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <List>
          {options.map((option, index) => (
            <ListItem
              button
              key={index}
              onClick={() => {
                onSelect(option);
                onClose();
              }}
            >
              <ListItemText primary={option.displayName || option.name} />
            </ListItem>
          ))}
        </List>
      </Popover>
    );
  };

export default SelectPopover;