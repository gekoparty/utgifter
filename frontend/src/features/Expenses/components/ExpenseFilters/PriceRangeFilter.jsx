import React, { useCallback, useMemo, useState } from "react";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Popover,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";

const PriceRangeFilter = React.memo(function PriceRangeFilter({
  column,
  onModeChange,
}) {
  const defaultState = useMemo(
    () => ({ min: "", max: "", mode: "pricePerUnit" }),
    [],
  );
  const filterValue = column.getFilterValue() || defaultState;

  const [localState, setLocalState] = useState(filterValue);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = useCallback(
    (event) => {
      setAnchorEl(event.currentTarget);
      setLocalState(column.getFilterValue() || defaultState);
    },
    [column, defaultState],
  );

  const handleClose = useCallback(() => setAnchorEl(null), []);

  const handleModeChange = useCallback(
    (event, newMode) => {
      if (newMode !== null) {
        setLocalState((prev) => ({ ...prev, mode: newMode }));
        onModeChange(newMode);
      }
    },
    [onModeChange],
  );

  const handleRangeChange = useCallback((key, value) => {
    setLocalState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyFilter = useCallback(() => {
    const valueToSet =
      !localState.min && !localState.max ? undefined : localState;
    column.setFilterValue(valueToSet);
    handleClose();
  }, [column, handleClose, localState]);

  const clearFilter = useCallback(() => {
    setLocalState(defaultState);
    column.setFilterValue(undefined);
    handleClose();
  }, [column, defaultState, handleClose]);

  const isActive = Boolean(filterValue.min || filterValue.max);

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
        <Box sx={{ p: 2, width: 260 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Filtrer Pris
          </Typography>

          <ToggleButtonGroup
            value={localState.mode}
            exclusive
            onChange={handleModeChange}
            aria-label="pris type"
            size="small"
            fullWidth
            sx={{ mb: 2 }}
          >
            <ToggleButton value="pricePerUnit">Enhet</ToggleButton>
            <ToggleButton value="finalPrice">Total</ToggleButton>
            <ToggleButton value="all">Alt</ToggleButton>
          </ToggleButtonGroup>

          <Stack spacing={2}>
            <Stack direction="row" spacing={1}>
              <TextField
                label="Min"
                type="number"
                size="small"
                value={localState.min}
                onChange={(event) => handleRangeChange("min", event.target.value)}
              />
              <TextField
                label="Maks"
                type="number"
                size="small"
                value={localState.max}
                onChange={(event) => handleRangeChange("max", event.target.value)}
              />
            </Stack>
            <Divider />
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

export default PriceRangeFilter;
