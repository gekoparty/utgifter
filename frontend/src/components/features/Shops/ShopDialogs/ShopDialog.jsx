// src/components/.../ShopDialog/ShopDialog.jsx
import React, { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import BasicDialog from "../../../commons/BasicDialog/BasicDialog";
import useShopDialog from "../UseShop/useShopDialog";
import ShopForm from "./commons/ShopForm";
import { fetchLocations, fetchCategories } from "../../../commons/Utils/apiUtils";

const ShopDialog = ({ open, mode, shopToEdit, onClose, onSuccess, onError }) => {
  const isEdit = mode === "EDIT";
  const isDelete = mode === "DELETE";

  const {
    shop,
    setShop,
    loading,
    displayError,
    validationError,
    isFormValid,
    handleSaveShop,
    handleDeleteShop,
    resetFormAndErrors,
    resetValidationErrors,
    resetServerError,
  } = useShopDialog(shopToEdit);

  // ✅ Fetch full docs: need _id + name for select values
  const {
    data: locations = [],
    isLoading: locationLoading,
    isError: locationError,
  } = useQuery({
    queryKey: ["locations"],
    queryFn: ({ signal }) => fetchLocations({ signal }),
    select: (data) => data?.locations ?? [],
    enabled: open && !isDelete,
  });

  const {
    data: categories = [],
    isLoading: categoryLoading,
    isError: categoryError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: ({ signal }) => fetchCategories({ signal }),
    select: (data) => data?.categories ?? [],
    enabled: open && !isDelete,
  });

  const locationOptions = useMemo(
    () => locations.map((l) => ({ value: String(l._id), label: l.name })),
    [locations]
  );
  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: String(c._id), label: c.name })),
    [categories]
  );

  useEffect(() => {
    if (!open) return;
    resetFormAndErrors();
  }, [open, shopToEdit?._id, resetFormAndErrors]);

  const handleClose = () => {
    resetFormAndErrors();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isDelete) {
        const ok = await handleDeleteShop(shopToEdit);
        if (ok) {
          onSuccess?.(shopToEdit);
          handleClose();
        } else {
          onError?.();
        }
        return;
      }

      if (!isFormValid()) return;

      const saved = await handleSaveShop();
      if (saved) {
        onSuccess?.(saved);
        handleClose();
      } else {
        onError?.();
      }
    } catch {
      onError?.();
    }
  };

  const dialogTitle = isDelete
    ? "Bekreft sletting"
    : isEdit
    ? "Rediger butikk"
    : "Ny butikk";

  const confirmLabel = isDelete ? "Slett" : "Lagre";
  const confirmColor = isDelete ? "error" : "primary";

  return (
    <BasicDialog open={open} onClose={handleClose} dialogTitle={dialogTitle}>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {isDelete ? (
            <Typography>
              Er du sikker på at du vil slette{" "}
              <strong>"{shopToEdit?.name}"</strong>? Utgifter tilhørende denne
              butikken kan også påvirkes.
            </Typography>
          ) : (
            <ShopForm
              shop={shop}
              setShop={setShop}
              loading={loading}
              displayError={displayError}
              validationError={validationError}
              locationOptions={locationOptions}
              categoryOptions={categoryOptions}
              locationLoading={locationLoading}
              categoryLoading={categoryLoading}
              locationError={locationError}
              categoryError={categoryError}
              resetValidationErrors={resetValidationErrors}
              resetServerError={resetServerError}
            />
          )}

          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button onClick={handleClose} disabled={loading}>
              Avbryt
            </Button>

            <Button
              type="submit"
              variant="contained"
              color={confirmColor}
              disabled={loading || (!isDelete && !isFormValid())}
            >
              {loading ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                confirmLabel
              )}
            </Button>
          </Stack>
        </Stack>
      </form>
    </BasicDialog>
  );
};

ShopDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(["ADD", "EDIT", "DELETE"]).isRequired,
  shopToEdit: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
};

export default ShopDialog;
