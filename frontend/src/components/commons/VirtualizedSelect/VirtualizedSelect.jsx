// src/components/commons/VirtualizedSelect/VirtualizedSelect.jsx
import Select, { components } from "react-select";
import { Virtuoso } from "react-virtuoso";

const ITEM_HEIGHT = 40;
const ITEM_COUNT_THRESHOLD = 10;

const MenuList = (props) => {
  const { children, maxHeight } = props;
  const { fetchNextPage, hasNextPage, isLoading } = props.selectProps;

  const selectOptions = Array.isArray(children) ? children : [children];

  return (
    <Virtuoso
      style={{ height: maxHeight, overflowX: "hidden" }}
      data={selectOptions}
      endReached={() => {
        if (hasNextPage && !isLoading) fetchNextPage?.();
      }}
      itemContent={(index, child) => (
        <div style={{ height: ITEM_HEIGHT }}>{child}</div>
      )}
    />
  );
};

const VirtualizedSelect = (props) => (
  <Select
    {...props}
    // ✅ prefetch next page on open (helps when list isn't scrollable yet)
    onMenuOpen={() => {
      props.onMenuOpen?.();
      if (props.hasNextPage && !props.isLoading) {
        props.fetchNextPage?.();
      }
    }}
    components={{
      MenuList,
      ...(props.components || {}),
    }}
  />
);

export default VirtualizedSelect;
