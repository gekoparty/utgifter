import { useState } from 'react';

const usePopover = () => {
  const [anchorState, setAnchorState] = useState({
    productAnchorEl: null,
    brandAnchorEl: null,
    shopAnchorEl: null,
  });

  const handleOpenPopover = (popover, event) => {
    setAnchorState((prevState) => ({
      ...prevState,
      [`${popover}AnchorEl`]: event.currentTarget,
    }));
  };

  const handleClosePopover = (popover) => {
    setAnchorState((prevState) => ({
      ...prevState,
      [`${popover}AnchorEl`]: null,
    }));
  };

  return { anchorState, handleOpenPopover, handleClosePopover };
};

export default usePopover;