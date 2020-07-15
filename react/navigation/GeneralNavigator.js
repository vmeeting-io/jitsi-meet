import React, { useEffect } from "react";
import { screenState } from "../modules/navigator";
import { App } from "../features/app/components";
import LoginScreen from "../screens/LoginScreen/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen/RegisterScreen";
import { useRecoilValue } from "recoil";
import PasswordResetScreen from "../screens/PasswordResetScreen/PasswordResetScreen";

const GeneralNavigator = ({ appProps }) => {
  const currScreen = useRecoilValue(screenState);
  useEffect(() => {
    console.log(currScreen);
  }, [currScreen]);
  return currScreen === "Home" ? (
    <App {...appProps} />
  ) : currScreen === "Register" ? (
    <RegisterScreen />
  ) : currScreen === "Login" ? (
    <LoginScreen />
  ) : currScreen === "PasswordReset" ? (
    <PasswordResetScreen />
  ) : (
    <LoginScreen />
  );
};

export default GeneralNavigator;
