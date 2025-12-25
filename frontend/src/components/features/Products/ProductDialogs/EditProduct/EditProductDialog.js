// EditProductDialog.js
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Button, CircularProgress, Stack } from "@mui/material";
import PropTypes from "prop-types";
import BasicDialog from "../../../../commons/BasicDialog/BasicDialog";
import ProductForm from "../commons/ProductForm";
import useProductDialog from "../../UseProduct/useProductDialog";
import useInfiniteBrands from "../../../../../hooks/useInfiniteBrands";
import { useTheme } from "@mui/material/styles";
import { getSelectStyles } from "../../../../../theme/selectStyles";

const EditProductDialog = ({
  selectedProduct,
  open,
  onClose,
  onUpdateSuccess,
  onUpdateFailure,
}) => {
  // Memoize the selected product.
  const memoizedSelectedProduct = useMemo(
    () => selectedProduct,
    [selectedProduct]
  );

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
  } = useProductDialog(memoizedSelectedProduct);

  // Local state for brand search input, selected brand options, and initialization flag.
  const [brandSearch, setBrandSearch] = useState("");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const theme = useTheme();
const selectStyles = useMemo(() => getSelectStyles(theme), [theme]);

  

  // Infinite scrolling hook for brands.
  const {
    data: infiniteData,
    isLoading: isLoadingBrands,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteBrands(brandSearch);

  // Keep a reference to previous brand options.
  const prevBrandOptionsRef = useRef([]);
  useEffect(() => {
    if (infiniteData && infiniteData.pages) {
      const newOptions = infiniteData.pages.flatMap((page) => page.brands);
      prevBrandOptionsRef.current = newOptions;
    }
  }, [infiniteData]);

  // Current available brand options.
  const brandOptions =
    infiniteData && infiniteData.pages
      ? infiniteData.pages.flatMap((page) => page.brands)
      : prevBrandOptionsRef.current;

  // When the dialog opens, reset the form and clear previous selections.
  useEffect(() => {
    if (open) {
      resetFormAndErrors();
      setInitialized(false); // Reset initialization flag on each open
      setSelectedBrands([]);
      // Set product state to stored brands as-is (they may be IDs)
      setProduct({
        ...selectedProduct,
        brands: selectedProduct.brands || [],
      });
    }
  }, [open, selectedProduct, resetFormAndErrors, setProduct]);

  // Once brandOptions are loaded and the dialog hasn't been initialized,
  // map the stored brand IDs to option objects (using the brand name) only once.
  useEffect(() => {
    if (
      open &&
      !initialized &&
      brandOptions.length > 0 &&
      selectedProduct.brands &&
      selectedProduct.brands.length > 0
    ) {
      // If there is a fallback in selectedProduct.brand, split it by comma.
      const fallbackBrands = selectedProduct.brand
        ? selectedProduct.brand.split(",").map((s) => s.trim())
        : [];

      const mapped = selectedProduct.brands.map((stored, index) => {
        // Look for a matching option by comparing stored (ID) to option._id.
        const match = brandOptions.find((option) => option._id === stored);
        if (match) {
          const name = match.name || match.label || stored;
          return { label: name, value: name };
        }
        // If no match is found and we have a fallback split, use the fallback for the corresponding index.
        if (fallbackBrands.length > 0 && fallbackBrands[index]) {
          return { label: fallbackBrands[index], value: fallbackBrands[index] };
        }
        return { label: stored, value: stored };
      });
      setSelectedBrands(mapped);
      setProduct((prev) => ({
        ...prev,
        brands: mapped.map((b) => b.value),
      }));
      setInitialized(true);
    }
  }, [
    open,
    initialized,
    brandOptions,
    selectedProduct.brands,
    selectedProduct.brand,
    setProduct,
  ]);

  // Handler for when the brand selection changes.
  const handleBrandChange = useCallback(
    (selectedOptions) => {
      setSelectedBrands(selectedOptions);
      setProduct({
        ...product,
        brands: selectedOptions ? selectedOptions.map((brand) => brand.value) : [],
      });
      setBrandSearch("");
      resetValidationErrors();
      resetServerError();
    },
    [product, setProduct, resetValidationErrors, resetServerError]
  );

  // Handler for creating a new brand.
  const handleBrandCreate = useCallback(
    (inputValue) => {
      const trimmedValue = inputValue.trim();
      if (trimmedValue !== "") {
        const newBrand = { label: trimmedValue, value: trimmedValue };
        setSelectedBrands((prev) => [...prev, newBrand]);
        setProduct((prevProduct) => ({
          ...prevProduct,
          brands: [...(prevProduct.brands || []), trimmedValue],
        }));
        setBrandSearch("");
        resetValidationErrors();
        resetServerError();
      }
    },
    [setProduct, resetValidationErrors, resetServerError]
  );

  // Update the brand search query when typing.
  const handleInputChange = useCallback((inputValue, { action }) => {
    if (action === "input-change") {
      setBrandSearch(inputValue);
    }
  }, []);

  // Fetch the next page when scrolling to the bottom.
  const handleMenuScrollToBottom = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleNameChange = useCallback(
    (e) => {
      // If the onChange returns an event, extract the value; otherwise, use the value directly.
      const name = e?.target?.value ?? e;
      setProduct({ ...product, name });
    },
    [product, setProduct]
  );

  const handleProductTypeChange = useCallback(
    (option) => {
      setProduct({ ...product, type: option.value });
    },
    [product, setProduct]
  );

  const handleMeasurementUnitChange = useCallback(
    (option) => {
      setProduct({ ...product, measurementUnit: option.value });
    },
    [product, setProduct]
  );

  const handleMeasuresChange = useCallback(
    (options) => {
      setProduct({ ...product, measures: options.map((opt) => opt.value) });
    },
    [product, setProduct]
  );

  const handleMeasureCreate = useCallback(
    (inputValue) => {
      const newMeasure = inputValue.trim();
      if (newMeasure !== "") {
        setProduct({
          ...product,
          measures: [...(product.measures || []), newMeasure],
        });
      }
    },
    [product, setProduct]
  );

  // Submit handler for saving the updated product.
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isFormValid()) {
      const updatedProduct = {
        ...product,
        brands: selectedBrands.map((brand) => brand.value),
      };
      const success = await handleSaveProduct(onClose, updatedProduct);
      if (success) {
        onUpdateSuccess(selectedProduct);
      } else {
        onUpdateFailure();
      }
    }
  };

  if (loading || isLoadingBrands) {
    return <CircularProgress />;
  }

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
        <ProductForm
          product={product}
          onNameChange={handleNameChange}
          onProductTypeChange={handleProductTypeChange}
          onMeasurementUnitChange={handleMeasurementUnitChange}
          onMeasuresChange={handleMeasuresChange}
          onMeasureCreate={handleMeasureCreate}
          onBrandChange={handleBrandChange}
          onBrandCreate={handleBrandCreate}
          brandOptions={brandOptions}
          loading={loading || isLoadingBrands || isFetchingNextPage}
          validationError={validationError}
          displayError={displayError}
          onInputChange={handleInputChange} // Filtering handler for BrandSelect
          onMenuScrollToBottom={handleMenuScrollToBottom} // Infinite scroll handler
          inputValue={brandSearch} // Controlled input value for filtering
          selectStyles={selectStyles} // Pass the defined styles
        />
        <Stack 
                  direction="row" 
                  justifyContent="flex-end" 
                  spacing={2} 
                  sx={{ mt: 2 }}
                >
          <Button type="submit" disabled={loading || !isFormValid()}>
            {loading ? <CircularProgress size={24} /> : "Lagre"}
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




