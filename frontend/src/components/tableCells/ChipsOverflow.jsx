import React, { useMemo, useState, useCallback } from "react";
import {
  Box,
  Chip,
  Popover,
  Stack,
  Typography,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { alpha, useTheme } from "@mui/material/styles";

/**
 * ChipsOverflow (generic)
 * - Shows first N chips + "+N"
 * - Click chips to open popover (default)
 * - Optional onChipClick(item) for custom behavior
 *
 * items: array of strings or objects
 * getLabel/getKey: how to render items
 * tone: "neutral" | "primary" | "secondary" | "success" | "warning" | "info" | "error"
 */
const ChipsOverflow = ({
  items = [],
  maxVisible = 3,
  maxChipWidth = 160,
  popoverTitle = "Alle",
  emptyText = "N/A",
  getLabel,
  getKey,
  onChipClick, // optional callback
  openOnChipClick = true, // ✅ chips open popover by default
  tone = "neutral",
  sx,
}) => {
  const theme = useTheme();

  const normalized = useMemo(() => {
    const arr = Array.isArray(items) ? items : [];
    const labelFn = getLabel ?? ((x) => String(x ?? "").trim());
    const keyFn = getKey ?? ((x) => labelFn(x));

    const out = [];
    const seen = new Set();

    for (const it of arr) {
      const label = String(labelFn(it) ?? "").trim();
      if (!label) continue;

      const key = String(keyFn(it) ?? label);
      const dedupeKey = `${key}|${label}`.toLowerCase();
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      out.push({ item: it, label, key });
    }

    return out;
  }, [items, getLabel, getKey]);

  const [anchorEl, setAnchorEl] = useState(null);

  const openPopover = useCallback((e) => {
    e?.stopPropagation?.();
    setAnchorEl(e.currentTarget);
  }, []);

  const closePopover = useCallback((e) => {
    e?.stopPropagation?.();
    setAnchorEl(null);
  }, []);

  const handleChipClick = useCallback(
    (item) => (e) => {
      e?.stopPropagation?.();

      // allow custom action
      onChipClick?.(item);

      // open popover by default (so user can browse list)
      if (openOnChipClick) setAnchorEl(e.currentTarget);
    },
    [onChipClick, openOnChipClick]
  );

  if (!normalized.length) {
    return <Box sx={{ opacity: 0.6 }}>{emptyText}</Box>;
  }

  const visible = normalized.slice(0, maxVisible);
  const hiddenCount = Math.max(0, normalized.length - visible.length);

  const popoverOpen = Boolean(anchorEl);

  // --- theme-based chip styling ---
  const palette =
    tone === "neutral" ? null : theme.palette[tone] ?? theme.palette.primary;

  const chipBg =
    tone === "neutral"
      ? alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.12 : 0.08)
      : alpha(palette.main, theme.palette.mode === "dark" ? 0.22 : 0.14);

  const chipBorder =
    tone === "neutral"
      ? alpha(theme.palette.text.primary, 0.22)
      : alpha(palette.main, 0.38);

  const chipText =
    tone === "neutral" ? theme.palette.text.primary : palette.contrastText;

  const baseChipSx = {
    height: 22,
    fontSize: "0.75rem",
    maxWidth: maxChipWidth,
    bgcolor: chipBg,
    color: chipText,
    borderColor: chipBorder,
    "& .MuiChip-label": {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
  };

  return (
    <>
      <Stack
        direction="row"
        spacing={0.75}
        sx={{
          flexWrap: "nowrap",
          overflow: "hidden",
          alignItems: "center",
          ...sx,
        }}
      >
        {visible.map(({ key, label, item }) => (
          <Chip
            key={key}
            label={label}
            size="small"
            clickable
            onClick={handleChipClick(item)}
            sx={baseChipSx}
          />
        ))}

        {hiddenCount > 0 && (
          <Chip
            label={`+${hiddenCount}`}
            size="small"
            clickable
            onClick={openPopover}
            variant="outlined"
            sx={{
              ...baseChipSx,
              bgcolor: "transparent",
              color: theme.palette.text.primary,
              opacity: 0.9,
            }}
          />
        )}
      </Stack>

      <Popover
        open={popoverOpen}
        anchorEl={anchorEl}
        onClose={closePopover}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: {
            p: 1.25,
            width: 460,
            maxWidth: "92vw",
            bgcolor: "background.paper",
            border: (t) => `1px solid ${t.palette.divider}`,
            borderRadius: 2,
            boxShadow: 6,
          },
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="subtitle2">{popoverTitle}</Typography>
          <IconButton size="small" onClick={closePopover}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Box sx={{ maxHeight: 240, overflow: "auto", pr: 0.5 }}>
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
            {normalized.map(({ key, label, item }) => (
              <Chip
                key={key}
                label={label}
                size="small"
                clickable
                onClick={handleChipClick(item)}
                sx={{
                  ...baseChipSx,
                  height: 24,
                }}
              />
            ))}
          </Stack>
        </Box>
      </Popover>
    </>
  );
};

export default React.memo(ChipsOverflow);

