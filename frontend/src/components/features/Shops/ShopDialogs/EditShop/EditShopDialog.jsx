import React, { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import BasicDialog from "../../../../commons/BasicDialog/BasicDialog";
import { useQuery } from "@tanstack/react-query";
import { fetchLocations, fetchCategories } from "../../../../commons/Utils/apiUtils";
import useShopDialog from "../../UseShop/useShopDialog";
import ShopForm from "../commons/ShopForm";

const EditShopDialog = ({ selectedShop, open, onClose, onUpdateSuccess, onUpdateFailure }) => {
  const memoizedSelectedShop = useMemo(() => selectedShop, [selectedShop]);
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
  } = useShopDialog(memoizedSelectedShop);

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

  const locationOptions = useMemo(() => locations.map((name) => ({ value: name, label: name })), [locations]);
  const categoryOptions = useMemo(() => categories.map((name) => ({ value: name, label: name })), [categories]);

  // Update the shop state when dialog opens, merging computed display fields.
  useEffect(() => {
    if (open && selectedShop) {
      setShop((prevShop) => ({
        ...prevShop,
        ...selectedShop,
        locationName: selectedShop.locationName || selectedShop.location || "",
        categoryName: selectedShop.categoryName || selectedShop.category || "",
      }));
    }
  }, [selectedShop, open, setShop]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isFormValid()) {
      const success = await handleSaveShop(onClose);
      if (success) {
        onUpdateSuccess(selectedShop);
      } else {
        onUpdateFailure();
      }
    }
  };

  return (
    <BasicDialog
      open={open}
      onClose={() => {
        resetFormAndErrors();
        onClose();
      }}
      dialogTitle="Edit Shop"
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
        submitLabel="Save"
        onCancel={() => {
          resetFormAndErrors();
          onClose();
        }}
      />
    </BasicDialog>
  );
};

EditShopDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedShop: PropTypes.object.isRequired,
  onUpdateSuccess: PropTypes.func.isRequired,
  onUpdateFailure: PropTypes.func.isRequired,
};

export default EditShopDialog;


