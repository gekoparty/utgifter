import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Alert, Stack, TextField, Typography } from "@mui/material";
import BasicDialog from "../../../../components/commons/BasicDialog/BasicDialog";
import DialogFormActions from "../../../../components/commons/Dialogs/DialogFormActions";

const CONFIG = {
  brand: {
    title: "Nytt merke",
    label: "Merkenavn",
    helper: "Merket legges til produktet du har valgt i utgiften.",
    submitLabel: "Lagre merke",
  },
  variant: {
    title: "Ny variant",
    label: "Variantnavn",
    helper: "Varianten legges til produktet du har valgt i utgiften.",
    submitLabel: "Lagre variant",
  },
};

export default function QuickCreateEntityDialog({
  open,
  type,
  productName,
  onClose,
  onCreate,
}) {
  const config = CONFIG[type] ?? CONFIG.brand;
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setError("");
    setSaving(false);
  }, [open, type]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(`${config.label} mangler.`);
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onCreate(trimmedName);
      onClose();
    } catch (err) {
      const validationMessage =
        err?.inner?.[0]?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Kunne ikke lagre. Prøv igjen.";
      setError(validationMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <BasicDialog open={open} onClose={onClose} dialogTitle={config.title} maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {config.helper} {productName ? `Produkt: ${productName}.` : ""}
          </Typography>

          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            autoFocus
            fullWidth
            size="small"
            label={config.label}
            value={name}
            disabled={saving}
            error={Boolean(error)}
            onChange={(event) => {
              setName(event.target.value);
              if (error) setError("");
            }}
          />

          <DialogFormActions
            loading={saving}
            disabled={!name.trim()}
            onCancel={onClose}
            submitLabel={config.submitLabel}
          />
        </Stack>
      </form>
    </BasicDialog>
  );
}

QuickCreateEntityDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  type: PropTypes.oneOf(["brand", "variant"]).isRequired,
  productName: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
};
