import { createContext, useReducer } from "react";

export const Store = createContext();

const initialState = {
    directories: [],
    savedDirectories: [],
    existingDirectories: [],
  };

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_DIRECTORIES":
      return {
        ...state,
        directories: action.payload,
      };
    case "UPDATE_SAVED_DIRECTORIES":
      return {
        ...state,
        savedDirectories: action.payload
      };
    case "UPDATE_EXISTING_DIRECTORIES":
      return {
        ...state,
        existingDirectories: action.payload,
      };
      case "RESET_ARRAYS":
      return {
        ...state,
        directories: [],
        savedDirectories: [],
        existingDirectories: [],
      };
    default:
      return state;
  }
};


export function StoreProvider(props) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const value = { state, dispatch };
  
    return <Store.Provider value={value}>{props.children}</Store.Provider>;
  }