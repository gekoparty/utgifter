import React, { useCallback, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Popover,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";

const DateRangeFilter = React.memo(function DateRangeFilter({ column }) {
  const filterValue = column.getFilterValue() || ["", ""];
  const [localDateRange, setLocalDateRange] = useState(filterValue);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = useCallback(
    (event) => {
      setAnchorEl(event.currentTarget);
      setLocalDateRange(column.getFilterValue() || ["", ""]);
    },
    [column],
  );

  const handleClose = useCallback(() => setAnchorEl(null), []);

  const handleLocalChange = useCallback((index, newValue) => {
    setLocalDateRange((prev) => {
      const next = [...prev];
      next[index] = newValue;
      return next;
    });
  }, []);

  const applyFilter = useCallback(() => {
    const valueToSet =
      !localDateRange[0] && !localDateRange[1] ? undefined : localDateRange;
    column.setFilterValue(valueToSet);
    handleClose();
  }, [column, handleClose, localDateRange]);

  const clearFilter = useCallback(() => {
    setLocalDateRange(["", ""]);
    column.setFilterValue(undefined);
    handleClose();
  }, [column, handleClose]);

  const isActive = Boolean(filterValue[0] || filterValue[1]);

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        color={isActive ? "primary" : "default"}
      >
        <FilterListIcon fontSize="small" />
      </IconButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Box sx={{ p: 2, width: 220 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Velg periode
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Fra dato"
              type="date"
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={localDateRange[0] || ""}
              onChange={(event) => handleLocalChange(0, event.target.value)}
            />
            <TextField
              label="Til dato"
              type="date"
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={localDateRange[1] || ""}
              onChange={(event) => handleLocalChange(1, event.target.value)}
            />
            <Stack direction="row" spacing={1} justifyContent="space-between">
              <Button size="small" color="inherit" onClick={clearFilter}>
                Nullstill
              </Button>
              <Button size="small" variant="contained" onClick={applyFilter}>
                Bruk
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Popover>
    </>
  );
});

export default DateRangeFilter;
