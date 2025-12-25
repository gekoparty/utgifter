// src/components/commons/VirtualizedSelect/VirtualizedSelect.jsx
import Select, { components } from 'react-select';
import { Virtuoso } from 'react-virtuoso';

// Height of each select option item
const ITEM_HEIGHT = 40; 
const ITEM_COUNT_THRESHOLD = 10; 

// --- Custom Menu List Component (Uses Virtuoso for virtualization) ---
const MenuList = (props) => {
    // We destructure the custom props we pass from BareLayout:
    const { options, children, maxHeight, fetchNextPage, hasNextPage, isLoading } = props;
    
    // The 'children' prop from react-select is an array of Option components
    const selectOptions = Array.isArray(children) ? children : [children];
    const itemCount = selectOptions.length;
    
    // If the list is short, render it normally to avoid Virtuoso overhead
    if (itemCount < ITEM_COUNT_THRESHOLD) {
        return <components.MenuList {...props}>{children}</components.MenuList>;
    }

    return (
        <Virtuoso
            style={{ height: maxHeight, overflowX: 'hidden' }}
            // The list of items to render
            data={selectOptions}
            // Logic to call fetchNextPage when the user scrolls to the end
            endReached={() => {
                if (hasNextPage && !isLoading) {
                    fetchNextPage();
                }
            }}
            // Render function for each item
            itemContent={(index, child) => (
                <div style={{ height: ITEM_HEIGHT }}>
                    {child}
                </div>
            )}
        />
    );
};

// --- Custom Virtualized Select Wrapper ---
// Passes all props down, including custom ones like fetchNextPage and hasNextPage.
const VirtualizedSelect = (props) => (
  <Select 
    {...props} 
    components={{ 
        MenuList 
    }} 
  />
);

export default VirtualizedSelect;