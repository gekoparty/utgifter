const commonSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    border: state.isFocused ? "2px solid #3f51b5" : "1px solid #ced4da",
    boxShadow: state.isFocused ? "0 0 0 1px #3f51b5" : "none",
    "&:hover": {
      border: "1px solid #3f51b5",
    },
    minHeight: "40px",
    borderRadius: "4px",
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "0 6px",
  }),
  input: (provided) => ({
    ...provided,
    margin: 0,
    padding: 0,
  }),
  placeholder: (provided) => ({
    ...provided,
    margin: 0,
    padding: 0,
  }),
  singleValue: (provided) => ({
    ...provided,
    margin: 0,
    padding: 0,
  }),
  // Add menuPortal styles to ensure dropdown is on top
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 9999,
  }),
};

export default commonSelectStyles;
