import { Popover, List, ListItemButton } from "@mui/material";
import { FixedSizeList } from "react-window";

const SelectPopover = ({ open, anchorEl, onClose, options, onSelect, type }) => {
    const handleItemClick = (item) => {
      onSelect(item);
      onClose();
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
