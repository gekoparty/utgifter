import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";

const isObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value ?? "").trim());

const ProductVariantManager = ({
  variants = [],
  disabled = false,
  error,
  busyVariantId,
  onRename,
  onDelete,
}) => {
  const existingVariants = useMemo(
    () =>
      variants
        .filter((variant) => isObjectId(variant?.value))
        .map((variant) => ({
          id: String(variant.value),
          name: String(variant.label ?? "").trim(),
        }))
        .filter((variant) => variant.id && variant.name),
    [variants],
  );

  const [editingId, setEditingId] = useState("");
  const [draftName, setDraftName] = useState("");

  useEffect(() => {
    if (!editingId) return;
    const stillExists = existingVariants.some((variant) => variant.id === editingId);
    if (!stillExists) {
      setEditingId("");
      setDraftName("");
    }
  }, [editingId, existingVariants]);

  if (!existingVariants.length) return null;

  const startEdit = (variant) => {
    setEditingId(variant.id);
    setDraftName(variant.name);
  };

  const cancelEdit = () => {
    setEditingId("");
    setDraftName("");
  };

  const saveEdit = async (variant) => {
    const nextName = draftName.trim();
    if (!nextName || nextName === variant.name) {
      cancelEdit();
      return;
    }

    const saved = await onRename?.(variant.id, nextName);
    if (saved) cancelEdit();
  };

  const requestDelete = async (variant) => {
    const confirmed = window.confirm(
      `Fjerne varianten "${variant.name}" fra dette produktet?`,
    );
    if (!confirmed) return;

    await onDelete?.(variant.id);
  };

  return (
    <Box
      sx={{
        mt: 1.25,
        p: 1.5,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1.5,
        bgcolor: "rgba(255,255,255,0.025)",
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.75 }}>
        Rediger varianter for dette produktet
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ mb: 1.25 }}>
          {error}
        </Alert>
      ) : null}

      <Stack spacing={1}>
        {existingVariants.map((variant) => {
          const isEditing = editingId === variant.id;
          const isBusy = busyVariantId === variant.id;

          return (
            <Stack
              key={variant.id}
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", sm: "center" }}
              sx={{
                minHeight: 42,
                px: 1,
                py: 0.75,
                borderRadius: 1,
                bgcolor: "action.hover",
              }}
            >
              {isEditing ? (
                <TextField
                  size="small"
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  disabled={disabled || isBusy}
                  autoFocus
                  fullWidth
                  label="Variantnavn"
                />
              ) : (
                <Typography sx={{ flex: 1, fontWeight: 700 }}>
                  {variant.name}
                </Typography>
              )}

              <Stack
                direction="row"
                spacing={0.5}
                justifyContent={{ xs: "flex-end", sm: "flex-start" }}
              >
                {isEditing ? (
                  <>
                    <Tooltip title="Lagre navn">
                      <span>
                        <IconButton
                          type="button"
                          size="small"
                          color="primary"
                          disabled={disabled || isBusy || !draftName.trim()}
                          onClick={() => saveEdit(variant)}
                        >
                          <SaveIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Avbryt">
                      <span>
                        <IconButton
                          type="button"
                          size="small"
                          disabled={disabled || isBusy}
                          onClick={cancelEdit}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </>
                ) : (
                  <>
                    <Tooltip title="Endre navn">
                      <span>
                        <IconButton
                          type="button"
                          size="small"
                          disabled={disabled || Boolean(busyVariantId)}
                          onClick={() => startEdit(variant)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Fjern variant">
                      <span>
                        <IconButton
                          type="button"
                          size="small"
                          color="error"
                          disabled={disabled || Boolean(busyVariantId)}
                          onClick={() => requestDelete(variant)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </>
                )}
              </Stack>
            </Stack>
          );
        })}
      </Stack>

    </Box>
  );
};

export default React.memo(ProductVariantManager);
