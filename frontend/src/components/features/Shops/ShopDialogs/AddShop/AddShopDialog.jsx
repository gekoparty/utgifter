import React, { useMemo, useEffect } from "react";
import { Fade, Box } from "@mui/material";
import PropTypes from "prop-types";
import BasicDialog from "../../../../commons/BasicDialog/BasicDialog";
import { useQuery } from "@tanstack/react-query";
import { fetchLocations, fetchCategories } from "../../../../commons/Utils/apiUtils";
import useShopDialog from "../../UseShop/useShopDialog"
import ShopForm from "../commons/ShopForm";


const AddShopDialog = ({ open, onClose, onAdd }) => {

 

  const {
    shop,
    setShop,
    loading,
    handleSaveShop,
    resetValidationErrors,
    resetServerError,
    displayError,
    validationError,
    isFormValid,
    resetFormAndErrors,
  } = useShopDialog();

  // Fetch locations
  const { data: locations = [], isLoading: locationLoading, isError: locationError } = useQuery({
    queryKey: ["locations"],
    queryFn: ({ signal }) => fetchLocations({ signal }),
    select: (data) => data.locations.map((l) => l.name),
  });

  // Fetch categories
  const { data: categories = [], isLoading: categoryLoading, isError: categoryError } = useQuery({
    queryKey: ["categories"],
    queryFn: ({ signal }) => fetchCategories({ signal }),
    select: (data) => data.categories.map((c) => c.name),
  });

  // Memoize select options
  const locationOptions = useMemo(() => locations.map((name) => ({ value: name, label: name })), [locations]);
  const categoryOptions = useMemo(() => categories.map((name) => ({ value: name, label: name })), [categories]);

  // Reset form when dialog opens.
  useEffect(() => {
    if (open) resetFormAndErrors();
  }, [open, resetFormAndErrors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isFormValid()) {
      const success = await handleSaveShop(onClose);
      if (success) onAdd({ name: shop.name });
    }
  };

  return (
    <Fade in={open} timeout={300}>
      <Box>
        <BasicDialog
          open={open}
          onClose={() => {
            resetFormAndErrors();
            onClose();
          }}
          dialogTitle="Ny Butikk"
        >
          <ShopForm
            shop={shop}
            setShop={setShop}
            validationError={validationError}
            displayError={displayError}
            loading={loading}
            locationOptions={locationOptions}
            categoryOptions={categoryOptions}
            locationLoading={locationLoading}
            categoryLoading={categoryLoading}
            locationError={locationError}
            categoryError={categoryError}
            resetValidationErrors={resetValidationErrors}
            resetServerError={resetServerError}
            onSubmit={handleSubmit}
            submitLabel="Lagre"
            onCancel={() => {
              resetFormAndErrors();
              onClose();
            }}
          />
        </BasicDialog>
      </Box>
    </Fade>
  );
};

AddShopDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default AddShopDialog;