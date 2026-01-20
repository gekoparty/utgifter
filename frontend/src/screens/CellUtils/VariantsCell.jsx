import { Chip, Stack, Tooltip, Box } from "@mui/material";

const MAX_VISIBLE = 3;

const VariantsCell = ({ cell }) => {
  const v = cell.getValue();

  if (!Array.isArray(v) || v.length === 0) {
    return <Box sx={{ opacity: 0.6 }}>N/A</Box>;
  }

  // Handle populated or raw values
  const names =
    typeof v[0] === "object"
      ? v.map((x) => String(x?.name ?? "")).filter(Boolean)
      : v.map((x) => String(x ?? "")).filter(Boolean);

  if (!names.length) {
    return <Box sx={{ opacity: 0.6 }}>N/A</Box>;
  }

  const visible = names.slice(0, MAX_VISIBLE);
  const hiddenCount = names.length - visible.length;

  return (
    <Tooltip
      title={names.join(", ")}
      arrow
      placement="top"
      enterDelay={400}
    >
      <Stack
        direction="row"
        spacing={0.75}
        sx={{
          flexWrap: "nowrap",
          maxWidth: 520,
          overflow: "hidden",
        }}
      >
        {visible.map((name) => (
          <Chip
            key={name}
            label={name}
            size="small"
            sx={{
              maxWidth: 160,
              height: 22,
              fontSize: "0.75rem",
              backgroundColor: "rgba(255,255,255,0.08)",
              color: "inherit",
            }}
          />
        ))}

        {hiddenCount > 0 && (
          <Chip
            label={`+${hiddenCount}`}
            size="small"
            variant="outlined"
            sx={{
              height: 22,
              fontSize: "0.75rem",
              opacity: 0.8,
              borderColor: "rgba(255,255,255,0.3)",
            }}
          />
        )}
      </Stack>
    </Tooltip>
  );
};

export default VariantsCell;