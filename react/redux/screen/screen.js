import { ReducerRegistry } from "../../features/base/redux";

const REDIRECT = "REDIRECT";
const STORE_NAME = "screen";

// action
export const setScreen = (screen) => {
  return {
    type: REDIRECT,
    currScreen: screen,
  };
};

ReducerRegistry.register(
  STORE_NAME,
  (state = { currScreen: "Home" }, action) => {
    switch (action.type) {
      case REDIRECT:
        return {
          ...state,
          currScreen: action.currScreen,
        };
      default:
        return state;
    }
  }
);
