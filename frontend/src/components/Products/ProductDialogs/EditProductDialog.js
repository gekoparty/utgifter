import React from "react";
import { Button, TextField, CircularProgress, Grid } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import PropTypes from "prop-types";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../commons/ErrorHandling/ErrorHandling";
import useProductDialog from "../UseProducts/useProductDialog";
import { fetchBrands } from "../../commons/Utils/apiUtils";

const measurementUnitOptions = [
  { value: "l", label: "Litres (l)" },
  { value: "kg", label: "Kilos (kg)" },
  // Add more measurement unit options as needed
];

const predefinedTypes = ["Matvare", "Jernhandel", "Elektronikk", "Bil"]; //

const EditProductDialog = ({
  selectedProduct,
  open,
  onClose,
  onUpdateSuccess,
  onUpdateFailure,
}) => {
  const {
    product,
    setProduct,
    loading,
    handleSaveProduct,
    resetValidationErrors,
    resetServerError,
    displayError,
    validationError,
    isFormValid,
    resetFormAndErrors,
  } = useProductDialog(selectedProduct);

  const {
    data: brandOptions,
    isLoading: brandLoading,
    isError: brandError,
  } = useQuery(["brands"], fetchBrands);

  const queryClient = useQueryClient();

  //console.log("data", brandOptions);

  if (brandLoading) {
    // Return a loading indicator while brands are being fetched
    return <CircularProgress />;
  }

  if (brandError) {
    // Handle error state when fetching brands fails
    return <div>Error loading brands</div>;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isFormValid()) {
      // Update the 'brand' field to match the expected format
      const updatedProduct = {
        ...product,
        brand: [{ name: product?.brand }],
      };

      const success = await handleSaveProduct(onClose, updatedProduct);
      if (success) {
        onUpdateSuccess(selectedProduct);
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
      dialogTitle="Edit Product"
    >
      <form onSubmit={handleSubmit}>
        <Grid container direction="column" spacing={1}>
          <Grid item>
            <TextField
              sx={{ marginTop: 2 }}
              size="small"
              label="Produkt"
              value={product?.name || ""}
              error={Boolean(validationError?.name)}
              onChange={(e) => {
                setProduct({ ...product, name: e.target.value });
                resetValidationErrors();
                resetServerError();
              }}
            />
            {displayError || validationError ? (
              <ErrorHandling
                resource="products"
                field="name"
                loading={loading}
              />
            ) : null}
          </Grid>

          <Grid item>
            {/* Use CreatableSelect for the brand */}
            <CreatableSelect
              className="custom-select"
              options={brandOptions}
              size="small"
              label="Merke"
              value={
                product?.brand
                  ? brandOptions.find((brand) => brand.name === product.brand)
                  : null
              }
              error={Boolean(validationError?.brand)}
              onChange={(selectedOption) => {
                setProduct({ ...product, brand: selectedOption?.name || "" });
                resetValidationErrors();
                resetServerError();
              }}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.name}
              placeholder="Velg Merke..."
              isValidNewOption={(inputValue, selectValue, selectOptions) => {
                return (
                  inputValue.trim() !== "" &&
                  !selectOptions.find(
                    (option) => option.name === inputValue.trim()
                  )
                );
              }}
              getNewOptionData={(inputValue, optionLabel) => ({
                name: inputValue.trim(),
              })}
              onCreateOption={(inputValue) => {
                const newBrand = { name: inputValue.trim() };
                setProduct({ ...product, brand: newBrand.name || "" });
                brandOptions.push(newBrand);
              }}
              isClearable
              formatCreateLabel={(inputValue) => `Nytt merke: ${inputValue}`}
            />
          </Grid>
          <Grid item>
            <Select
              label="Type"
              options={predefinedTypes.map((type) => ({
                value: type,
                label: type,
              }))}
              value={
                product?.type
                  ? { value: product.type, label: product.type }
                  : null
              }
              onChange={(selectedOption) => {
                setProduct({
                  ...product,
                  type: selectedOption?.value || "",
                });
                resetValidationErrors();
                resetServerError();
              }}
              isClearable
              isSearchable
            />
            {displayError || validationError ? (
              <ErrorHandling
                resource="products"
                field="type"
                loading={loading}
              />
            ) : null}
          </Grid>

          <Grid item>
            <Select
              label="Målenhet"
              options={measurementUnitOptions}
              value={
                measurementUnitOptions.find(
                  (option) => option.value === product?.measurementUnit
                ) || null
              }
              onChange={(selectedOption) => {
                setProduct({
                  ...product,
                  measurementUnit: selectedOption?.value || "",
                });
                resetValidationErrors();
                resetServerError();
              }}
              isClearable
              isSearchable
            />
            {displayError || validationError ? (
              <ErrorHandling
                resource="products"
                field="measurementUnit"
                loading={loading}
              />
            ) : null}
          </Grid>
        </Grid>
        <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button type="submit" disabled={loading || !isFormValid()}>
            {loading ? <CircularProgress size={24} /> : "Save"}
          </Button>
          <Button
            onClick={() => {
              resetFormAndErrors();
              onClose();
            }}
            sx={{ ml: 2 }}
          >
            Cancel
          </Button>
        </Grid>
      </form>
    </BasicDialog>
  );
};

EditProductDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedProduct: PropTypes.object.isRequired,
  onUpdateSuccess: PropTypes.func.isRequired,
  onUpdateFailure: PropTypes.func.isRequired,
};

export default EditProductDialog;
