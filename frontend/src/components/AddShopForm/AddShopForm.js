import React, { useState } from 'react';
import { FormControl, Box, TextField, Button } from '@mui/material';
import PropTypes from 'prop-types';

const AddShopForm = ({ onSubmit }) => {
  const [newShopName, setNewShopName] = useState('');
  const [newShopLocation, setNewShopLocation] = useState('');
  const [newShopCategory, setNewShopCategory] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    const newShopData = {
      name: newShopName,
      location: newShopLocation,
      category: newShopCategory,
    };

    onSubmit(newShopData);
  };

  return (
    <FormControl sx={{ width: 400 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 1 }}>
        <TextField
          label="Shop Name"
          value={newShopName}
          onChange={(event) => setNewShopName(event.target.value)}
        />
        <TextField
          label="Location"
          value={newShopLocation}
          onChange={(event) => setNewShopLocation(event.target.value)}
        />
        <TextField
          label="Category"
          value={newShopCategory}
          onChange={(event) => setNewShopCategory(event.target.value)}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={handleSubmit}>
            Save
          </Button>
        </Box>
      </Box>
    </FormControl>
  );
};

AddShopForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default AddShopForm;