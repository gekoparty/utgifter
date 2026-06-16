import React from "react";
import { Button, CircularProgress, Stack } from "@mui/material";

export default function DialogFormActions({
  loading,
  isDelete = false,
  disabled = false,
  onCancel,
  onConfirm,
  submitLabel,
  cancelLabel = "Avbryt",
  leadingAction,
}) {
  const label = submitLabel ?? (isDelete ? "Slett" : "Lagre");

  return (
    <Stack
      direction={{ xs: "column-reverse", sm: "row" }}
      justifyContent="flex-end"
      spacing={1.5}
      sx={{
        "& .MuiButton-root": { width: { xs: "100%", sm: "auto" } },
      }}
    >
      {leadingAction ? (
        <Stack sx={{ mr: { sm: "auto" }, width: { xs: "100%", sm: "auto" } }}>
          {leadingAction}
        </Stack>
      ) : null}
      <Button onClick={onCancel} disabled={loading}>
        {cancelLabel}
      </Button>
      <Button
        type="submit"
        variant="contained"
        color={isDelete ? "error" : "primary"}
        disabled={loading || disabled}
        onClick={onConfirm}
      >
        {loading ? <CircularProgress size={22} color="inherit" /> : label}
      </Button>
    </Stack>
  );
}
