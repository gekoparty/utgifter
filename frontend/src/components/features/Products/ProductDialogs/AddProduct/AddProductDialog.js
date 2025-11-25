// src/components/Expenses/ProductDialogs/AddProductDialog/AddProductDialog.js
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo
} from "react";
import {
  Stack,
  Box,
  Button,
  Fade,
  LinearProgress,
  Skeleton,
} from "@mui/material";
import PropTypes from "prop-types";
import BasicDialog from "../../../../commons/BasicDialog/BasicDialog";
import useProductDialog from "../../UseProduct/useProductDialog";
import ProductForm from "../commons/ProductForm";
import useInfiniteBrands from "../../../../../hooks/useInfiniteBrands";
import { useTheme } from "@mui/material/styles";
import { getSelectStyles } from "../../../../../theme/selectStyles";

// Import our split components

const AddProductDialog = ({ open, onClose, onAdd }) => {
    /** ------------------------------------------------------
     *  THEME + SELECT STYLES
     * ----------------------------------------------------- */
    const theme = useTheme();
    const selectStyles = useMemo(() => getSelectStyles(theme), [theme]);
  
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
  } = useProductDialog();

  const [selectedBrands, setSelectedBrands] = useState([]);
  const [brandSearch, setBrandSearch] = useState("");

  useEffect(() => {
    if (open) {
      resetFormAndErrors();
      setSelectedBrands([]);
    }
  }, [open, resetFormAndErrors]);

  const {
    data: infiniteData,
    isLoading: isLoadingBrands,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteBrands(brandSearch);

  const prevBrandOptionsRef = useRef([]);
  useEffect(() => {
    if (infiniteData && infiniteData.pages) {
      const newOptions = infiniteData.pages.flatMap((page) => page.brands);
      prevBrandOptionsRef.current = newOptions;
    }
  }, [infiniteData]);

  const brandOptions =
    infiniteData && infiniteData.pages
      ? infiniteData.pages.flatMap((page) => page.brands)
      : prevBrandOptionsRef.current;
  // Log fetched brand options for debugging:
  useEffect(() => {
    console.log("Fetched brand options:", brandOptions);
  }, [brandOptions]);

  // Handlers
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isFormValid()) {
      const success = await handleSaveProduct(onClose, {
        ...product,
        brands: selectedBrands.map((brand) => brand.name),
      });
      if (success) {
        onAdd({ name: product.name });
      }
    }
  };

  const handleBrandChange = useCallback(
    (selectedOptions) => {
      setSelectedBrands(selectedOptions);
      setProduct({
        ...product,
        // Extract the brand values from the selected options:
        brands: selectedOptions
          ? selectedOptions.map((brand) => brand.value)
          : [],
      });
      setBrandSearch("");
      resetValidationErrors();
      resetServerError();
    },
    [product, resetValidationErrors, resetServerError, setProduct]
  );

  // Update handleBrandCreate to add a new brand in the same shape:
  const handleBrandCreate = useCallback(
    (inputValue) => {
      const trimmedValue = inputValue.trim();
      if (trimmedValue !== "") {
        const newBrand = { label: trimmedValue, value: trimmedValue };
        setSelectedBrands((prev) => [...prev, newBrand]);
        setProduct((prevProduct) => ({
          ...prevProduct,
          // Append the new brand value
          brands: [...(prevProduct.brands || []), trimmedValue],
        }));
        setBrandSearch("");
        resetValidationErrors();
        resetServerError();
      }
    },
    [setProduct, resetValidationErrors, resetServerError]
  );

  const handleNameChange = (name) => {
    setProduct({ ...product, name });
    resetValidationErrors();
    resetServerError();
  };

  const handleProductTypeChange = (selectedOption) => {
    setProduct({ ...product, type: selectedOption?.value || "" });
    resetValidationErrors();
    resetServerError();
  };

  const handleMeasurementUnitChange = (selectedOption) => {
    setProduct({ ...product, measurementUnit: selectedOption?.value || "" });
    resetValidationErrors();
    resetServerError();
  };

  const handleMeasuresChange = (selectedOptions) => {
    const selectedMeasures = selectedOptions.map((option) => option.value);
    setProduct({ ...product, measures: selectedMeasures });
    resetValidationErrors();
    resetServerError();
  };

  const handleMeasureCreate = (inputValue) => {
    const trimmedValue = inputValue.trim();
    const numberPattern = /^\d+(\.\d+)?$/;
    if (numberPattern.test(trimmedValue)) {
      setProduct((prevProduct) => ({
        ...prevProduct,
        measures: [...(prevProduct.measures || []), trimmedValue],
      }));
      resetValidationErrors();
      resetServerError();
    } else {
      console.error("Invalid measure input. It must be a valid number.");
    }
  };

  // Update search query when input changes
  const handleInputChange = useCallback((inputValue, { action }) => {
    if (action === "input-change") {
      setBrandSearch(inputValue);
    }
  }, []);

  // Fetch next page when the menu is scrolled to the bottom
  // When the menu is scrolled to the bottom, fetch the next page.
  const handleMenuScrollToBottom = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      console.log("Fetching next page");
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  

  return (
    <Fade in={open} timeout={300}>
      <Box>
        <BasicDialog
          open={open}
          onClose={() => {
            resetFormAndErrors();
            onClose();
          }}
          dialogTitle="Nytt Produkt"
        >
          {loading || isLoadingBrands ? (
            <Box sx={{ p: 2 }}>
              <Skeleton variant="rectangular" width="100%" height={200} />
            </Box>
          ) : (
            <>
              <form onSubmit={handleSubmit}>
                <ProductForm
                  product={product}
                  inputValue={brandSearch}
                  onNameChange={handleNameChange}
                  onBrandChange={handleBrandChange}
                  onBrandCreate={handleBrandCreate}
                  onProductTypeChange={handleProductTypeChange}
                  onMeasurementUnitChange={handleMeasurementUnitChange}
                  onMeasuresChange={handleMeasuresChange}
                  onMeasureCreate={handleMeasureCreate}
                  // Pass the infinite query data and handlers.
                  brandOptions={brandOptions}
                  selectStyles={selectStyles}
                  // Combine loading states from the dialog and infinite query.
                  loading={loading || isLoadingBrands || isFetchingNextPage}
                  validationError={validationError}
                  displayError={displayError}
                  onInputChange={handleInputChange}
                  onMenuScrollToBottom={handleMenuScrollToBottom}
                />
                <Stack 
                  direction="row" 
                  justifyContent="flex-end" 
                  spacing={2} 
                  sx={{ mt: 2 }}
                >
                  <Button
                    type="submit"
                    disabled={loading || !isFormValid()}
                    sx={{ minWidth: "80px" }}
                  >
                    {loading ? (
                      <LinearProgress
                        sx={{
                          width: "100%",
                          height: "4px",
                          borderRadius: 0,
                        }}
                      />
                    ) : (
                      "Lagre"
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      resetFormAndErrors();
                      onClose();
                    }}
                    
                  >
                    Avbryt
                  </Button>
                </Stack>
              </form>
            </>
          )}
        </BasicDialog>
      </Box>
    </Fade>
  );
};

AddProductDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default AddProductDialog;
