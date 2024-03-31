import { Popover, List, ListItemButton } from "@mui/material";
import { FixedSizeList } from "react-window";

const SelectPopover = ({ open=false, anchorEl, onClose, options, onSelect, type }) => {

  console.log("Popover open:", open);


  const handleItemClick = (item) => {
    onSelect(item);
    onClose(); // Close the popover after selecting an option
  };


    console.log("Options", options)

  return (
    <Popover
      disableAutoFocus
      disableEnforceFocus
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
    >
      <List sx={{ width: 300 }}>
        <FixedSizeList
          height={300}
          width={300}
          itemCount={options ? options.length : 0}
          itemSize={50}
        >
          {({ index, style }) => (
            <ListItemButton
              style={style}
              key={index}
              onClick={() => handleItemClick(options[index])}
            >
              {options[index].name}
            </ListItemButton>
          )}
        </FixedSizeList>
      </List>
    </Popover>
  );
};

export default SelectPopover;
