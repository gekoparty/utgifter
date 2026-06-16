import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import CreatableSelect from "react-select/creatable";
import ExpenseField from "../../../../../components/commons/ExpenseField/ExpenseField";
import FieldLabel from "../../../../../components/commons/Forms/FieldLabel";

const QUICK_CREATE_CONFIG = {
  brand: {
    button: "Nytt merke",
    title: "Opprett merke",
    nameLabel: "Merkenavn",
    submit: "Lagre merke",
  },
  variant: {
    button: "Ny variant",
    title: "Opprett variant",
    nameLabel: "Variantnavn",
    submit: "Lagre variant",
  },
  shop: {
    button: "Ny butikk",
    title: "Opprett butikk",
    nameLabel: "Butikknavn",
    submit: "Lagre butikk",
  },
};

export default function InlineQuickCreatePanel({
  type,
  disabled,
  disabledText,
  onCreate,
  selectStyles,
  locationOptions = [],
  categoryOptions = [],
  isLoadingLocations = false,
  isLoadingCategories = false,
  isLocationError = false,
  isCategoryError = false,
}) {
  const config = QUICK_CREATE_CONFIG[type];
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isShop = type === "shop";
  const canSubmit =
    name.trim().length > 0 &&
    (!isShop ||
      (locationName.trim().length > 0 && categoryName.trim().length > 0));
  const menuPortalTarget =
    typeof document !== "undefined" ? document.body : undefined;

  const selectedLocation = useMemo(() => {
    if (!locationName) return null;
    return (
      locationOptions.find((option) => option.label === locationName) ?? {
        value: `temp-${locationName}`,
        label: locationName,
      }
    );
  }, [locationName, locationOptions]);

  const selectedCategory = useMemo(() => {
    if (!categoryName) return null;
    return (
      categoryOptions.find((option) => option.label === categoryName) ?? {
        value: `temp-${categoryName}`,
        label: categoryName,
      }
    );
  }, [categoryName, categoryOptions]);

  const reset = () => {
    setName("");
    setLocationName("");
    setCategoryName("");
    setError("");
  };

  const handleSubmit = async () => {
    if (!canSubmit || saving || disabled) return;

    setSaving(true);
    setError("");

    try {
      await onCreate?.({
        name: name.trim(),
        locationName: locationName.trim(),
        categoryName: categoryName.trim(),
      });
      reset();
      setOpen(false);
    } catch (err) {
      const validationMessage = Array.isArray(err?.inner)
        ? err.inner
            .map((item) => item?.message)
            .filter(Boolean)
            .join(" ")
        : "";

      setError(
        err?.message === "duplicate"
          ? "Denne finnes allerede."
          : validationMessage || err?.message || "Kunne ikke lagre. Prøv igjen.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!config) return null;

  return (
    <Box sx={{ mt: 1 }}>
      <Button
        size="small"
        variant="text"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        sx={{ px: 0, textTransform: "none", fontWeight: 800 }}
      >
        {config.button}
      </Button>

      {disabled && disabledText ? (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ ml: 1, verticalAlign: "middle" }}
        >
          {disabledText}
        </Typography>
      ) : null}

      <Collapse in={open && !disabled} timeout={180}>
        <Paper
          variant="outlined"
          sx={{
            mt: 1,
            p: 1.5,
            borderRadius: 2,
            bgcolor: "rgba(255,255,255,0.035)",
          }}
        >
          <Stack spacing={1.5}>
            <Typography variant="body2" sx={{ fontWeight: 900 }}>
              {config.title}
            </Typography>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <ExpenseField
                label={config.nameLabel}
                value={name}
                onChange={(event) => setName(event.target.value)}
                fullWidth
              />

              {isShop ? (
                <>
                  <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                    <FieldLabel>Sted</FieldLabel>
                    <CreatableSelect
                      styles={selectStyles}
                      options={locationOptions}
                      value={selectedLocation}
                      onChange={(selected) =>
                        setLocationName(selected?.label || "")
                      }
                      onCreateOption={(input) =>
                        setLocationName(input.trim())
                      }
                      placeholder="Velg sted..."
                      isClearable
                      isLoading={isLoadingLocations}
                      menuPortalTarget={menuPortalTarget}
                      isValidNewOption={(input) => {
                        const value = input.trim();
                        return (
                          Boolean(value) &&
                          !locationOptions.some(
                            (option) => option.label === value,
                          )
                        );
                      }}
                      formatCreateLabel={(input) => `Nytt sted: ${input}`}
                    />
                    {isLoadingLocations ? <LinearProgress /> : null}
                    {isLocationError ? (
                      <Typography variant="caption" color="error">
                        Kunne ikke laste steder.
                      </Typography>
                    ) : null}
                  </Stack>

                  <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                    <FieldLabel>Kategori</FieldLabel>
                    <CreatableSelect
                      styles={selectStyles}
                      options={categoryOptions}
                      value={selectedCategory}
                      onChange={(selected) =>
                        setCategoryName(selected?.label || "")
                      }
                      onCreateOption={(input) =>
                        setCategoryName(input.trim())
                      }
                      placeholder="Velg kategori..."
                      isClearable
                      isLoading={isLoadingCategories}
                      menuPortalTarget={menuPortalTarget}
                      isValidNewOption={(input) => {
                        const value = input.trim();
                        return (
                          Boolean(value) &&
                          !categoryOptions.some(
                            (option) => option.label === value,
                          )
                        );
                      }}
                      formatCreateLabel={(input) => `Ny kategori: ${input}`}
                    />
                    {isLoadingCategories ? <LinearProgress /> : null}
                    {isCategoryError ? (
                      <Typography variant="caption" color="error">
                        Kunne ikke laste kategorier.
                      </Typography>
                    ) : null}
                  </Stack>
                </>
              ) : null}
            </Stack>

            {error ? <Alert severity="warning">{error}</Alert> : null}

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                size="small"
                color="inherit"
                disabled={saving}
                onClick={() => {
                  reset();
                  setOpen(false);
                }}
              >
                Avbryt
              </Button>
              <Button
                size="small"
                variant="contained"
                disabled={!canSubmit || saving}
                onClick={handleSubmit}
              >
                {saving ? <CircularProgress size={18} /> : config.submit}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Collapse>
    </Box>
  );
}
