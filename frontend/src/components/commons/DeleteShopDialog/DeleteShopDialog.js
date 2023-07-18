import React from 'react';
import PropTypes from 'prop-types';
import { Typography, Button } from '@mui/material';
import BasicDialog from '../BasicDialog/BasicDialog';
import useCustomHttp from '../../../hooks/useHttp';

const content = (shop) => {
  if (!shop) {
    return null; // Return null or a placeholder component when shop is null
  }

  return (
    <>
      <Typography component="p">
        Er du sikker på at du vil slette denne butikken, utgifter tilhørende{' '}
        <Typography component="span" fontWeight="bold">
          "{shop.name}"
        </Typography>{' '}
        vil også påvirkes
      </Typography>
    </>
  );
};

const DeleteShopDialog = React.memo(({ open, onClose, shop, onDelete }) => {
  const { deleteData } = useCustomHttp('/api/shops');

  const handleDelete = async () => {
    try {
      await deleteData(shop._id);
      onDelete(shop);
      onClose();
    } catch (error) {
      console.error('Error deleting shop:', error);
      // Handle error as needed
    }
  };

  return (
    <BasicDialog
      open={open}
      onClose={onClose}
      dialogTitle="Slett Butikk"
      cancelButtonText="Cancel"
      confirmButtonText="Delete"
      cancelButton={<Button onClick={onClose}>Cancel</Button>}
      confirmButton={<Button onClick={handleDelete}>Delete</Button>}
    >
      {content(shop)}
    </BasicDialog>
  );
});

DeleteShopDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  shop: PropTypes.object,
  onDelete: PropTypes.func.isRequired,
};

export default DeleteShopDialog;