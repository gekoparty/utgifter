import React, { useState, useMemo } from "react";
import { List, AutoSizer } from "react-virtualized";
import { TextField, MenuItem, Paper, Menu } from "@mui/material";

const VirtualizedSelect = ({ options, value, onChange, label, placeholder }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredOptions = useMemo(() => {
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, options]);

  const rowRenderer = ({ key, index, style }) => {
    const option = filteredOptions[index];

    return (
      <MenuItem
        key={key}
        value={option.value}
        style={style}
        onClick={() => {
          onChange(option);
          handleClose();
        }}
      >
        {option.label}
      </MenuItem>
    );
  };

  return (
    <>
      <TextField
        label={label}
        value={value?.label || searchTerm}
        placeholder={placeholder}
        fullWidth
        onClick={handleOpen}
        onChange={handleSearchChange}
        InputProps={{ readOnly: false }}
      />
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{ style: { maxHeight: 300, width: anchorEl ? anchorEl.clientWidth : null } }}
      >
        <Paper style={{ maxHeight: 300, overflowY: 'auto' }}>
          <AutoSizer disableHeight>
            {({ width }) => (
              <List
                width={width}
                height={filteredOptions.length ? Math.min(300, filteredOptions.length * 48) : 300}
                rowCount={filteredOptions.length}
                rowHeight={48}
                rowRenderer={rowRenderer}
                noRowsRenderer={() => <div style={{ padding: 10 }}>No options</div>}
              />
            )}
          </AutoSizer>
        </Paper>
      </Menu>
    </>
  );
};

export default VirtualizedSelect;