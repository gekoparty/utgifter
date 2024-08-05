import { useState, useMemo } from 'react';

const useFilter = (options, filterKey) => {
  const [filterText, setFilterText] = useState('');

  const filteredOptions = useMemo(() => {
    if (!filterText) return options;
    return options.filter(option => 
      option[filterKey]?.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [filterText, options, filterKey]);

  return {
    filterText,
    setFilterText,
    filteredOptions,
  };
};

export default useFilter;