import React, { useState, useEffect } from "react";
import { View, Text, BackHandler } from "react-native";
import * as validators from "../../utils/validator";
import TextDivider from "../../components/TextDivider/TextDivider";
import PostechLoginButton from "../../components/PostechLoginButton/PostechLoginButton";
import InputLabel from "../../components/InputLabel/InputLabel";
import SubmitButton from "../../components/SubmitButton/SubmitButton";
import Form from "../../components/Form/Form";
import { DARK_GRAY } from "../../consts/colors";
import api from "../../api";
import { setScreen } from "../../redux/screen/screen";
import { useDispatch, useStore } from "react-redux";
import { getStatusBarHeight } from "react-native-status-bar-height";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scrollview";
import { useTranslation } from "react-i18next";
import { setJWT } from "../../features/base/jwt";
import { tokenLocalStorage } from "../../api/AuthApi";

const iosStatusBarHeight = getStatusBarHeight();

const RegisterScreen = () => {
  const { t, i18n } = useTranslation("vmeeting", { i18n });

  const dispatch = useDispatch();
  const store = useStore();
  const navigate = (to) => {
    dispatch(setScreen(to));
  };
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailValid, setEmailValid] = useState(null);
  const [fullnameValid, setFullnameValid] = useState(null);
  const [usernameValid, setUsernameValid] = useState(null);
  const [passwordValid, setPasswordValid] = useState(null);
  const [confirmPasswordValid, setConfirmPasswordValid] = useState(null);
  const [emailErrorMsg, setEmailErrorMsg] = useState("");
  const [fullnameErrorMsg, setFullnameErrorMsg] = useState("");
  const [usernameErrorMsg, setUsernameErrorMsg] = useState("");
  const [passwordErrorMsg, setPasswordErrorMsg] = useState("");
  const [confirmPasswordErrorMsg, setConfirmPasswordErrorMsg] = useState("");

  useEffect(() => {
    BackHandler.addEventListener("hardwareBackPress", onPressBackButton);
    return function cleanup() {
      BackHandler.removeEventListener("hardwareBackPress", onPressBackButton);
    };
  }, []);

  const onPressBackButton = () => {
    dispatch(setScreen("Home"));
    return true;
  };

  const onPressRegisterSubmitButton = () => {
    setLoading(true);
    const form = {
      email,
      name: fullname,
      username,
      password,
      confirm: confirmPassword,
    };
    api
      .signup(form, store.getState())
      .then(async (resp) => {
        const token = resp.data;
        tokenLocalStorage.setItem(token, store.getState());
        dispatch(setJWT(token));
        setLoading(false);
        navigate("Home");
      })
      .catch((error) => {
        const errCode = error.response.headers["www-authenticate"];
        if (errCode === "username_in_use") {
          setUsernameVaild(false);
          setUsernameErrorMsg(t("error.usernameInUse"));
        } else if (errCode === "email_in_use") {
          setEmailValid(false);
          setEmailErrorMsg(t("error.emailInUse"));
        } else {
          setEmailValid(false);
          setEmailErrorMsg(t("register.fail"));
        }
        setLoading(false);
      });
  };

  const checkVaildEmail = (value) => {
    const error = validators.email(value);
    if (error) {
      setEmailErrorMsg(t(error));
      return false;
    } else if (value === "") {
      setEmailErrorMsg(t("error.emailRequired"));
      return false;
    }
    return true;
  };
  const checkVaildFullname = (value) => {
    if (value === "") {
      setFullnameErrorMsg(t("error.fullnameRequired"));
      return false;
    } else if (value && value.length < 2) {
      setFullnameErrorMsg(t("error.fullnameTooShort"));
      return false;
    }
    return true;
  };
  const checkVaildUsername = (value) => {
    const error = validators.username(value);
    if (error) {
      setUsernameErrorMsg(t(error));
      return false;
    } else if (value === "") {
      setUsernameErrorMsg(t("error.usernameRequired"));
      return false;
    } else if (value && value.length < 5) {
      setUsernameErrorMsg(t("error.usernameTooShort"));
      return false;
    }
    return true;
  };
  const checkVaildPassword = (value) => {
    if (value.length >= 8) {
      return true;
    } else if (value === "") {
      setPasswordErrorMsg(t("error.passwordRequired"));
      return false;
    }
    setPasswordErrorMsg(t("error.passwordTooShort"));
    return false;
  };
  const checkVaildConfirmPassword = (value) => {
    if (value === password) {
      return true;
    }
    setConfirmPasswordErrorMsg(t("error.passwordNotMatch"));
    return false;
  };

  const onChangeEmail = ({ nativeEvent: { text } }) => {
    setEmail(text);
    const validity = checkVaildEmail(text);
    setEmailValid(validity);
  };
  const onChangeFullname = ({ nativeEvent: { text } }) => {
    setFullname(text);
    const validity = checkVaildFullname(text);
    setFullnameValid(validity);
  };
  const onChangeUsername = ({ nativeEvent: { text } }) => {
    setUsername(text);
    const validity = checkVaildUsername(text);
    setUsernameValid(validity);
  };
  const onChangePassword = ({ nativeEvent: { text } }) => {
    setPassword(text);
    const validity = checkVaildPassword(text);
    setPasswordValid(validity);
  };
  const onChangeConfirmPassword = ({ nativeEvent: { text } }) => {
    setConfirmPassword(text);
    const validity = checkVaildConfirmPassword(text);
    setConfirmPasswordValid(validity);
  };

  return (
    <KeyboardAwareScrollView style={{ ...styles.container }}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "600",
          paddingBottom: 24,
          paddingTop: iosStatusBarHeight + 40,
        }}
      >
        {`Vmeeting ${t("header.register")}`}
      </Text>
      {/* <TextDivider text={"Create an account using"} /> */}
      {/* <PostechLoginButton /> */}
      {/* <TextDivider text={"or create new account"} style={{ paddingTop: 20 }} /> */}
      <InputLabel name={t("register.email")} necessary={true} />
      <Form
        placeholder={t("register.emailExample")}
        value={email}
        onChange={onChangeEmail}
        valid={emailValid}
        errorMessage={emailErrorMsg}
      />
      <InputLabel name={t("register.fullName")} necessary={true} />
      <Form
        placeholder={t("register.fullNameExample")}
        value={fullname}
        onChange={onChangeFullname}
        valid={fullnameValid}
        errorMessage={fullnameErrorMsg}
      />
      <InputLabel name={t("register.username")} necessary={true} />
      <Form
        placeholder={t("register.usernameExample")}
        value={username}
        onChange={onChangeUsername}
        valid={usernameValid}
        errorMessage={usernameErrorMsg}
      />
      <InputLabel name={t("register.password")} necessary={true} />
      <Form
        type={"password"}
        value={password}
        onChange={onChangePassword}
        valid={passwordValid}
        errorMessage={passwordErrorMsg}
      />
      <InputLabel name={t("register.passwordConfirm")} necessary={true} />
      <Form
        type={"password"}
        value={confirmPassword}
        onChange={onChangeConfirmPassword}
        valid={confirmPasswordValid}
        errorMessage={confirmPasswordErrorMsg}
      />
      <SubmitButton
        name={t("register.title")}
        invalid={
          !(
            emailValid &&
            fullnameValid &&
            usernameValid &&
            passwordValid &&
            confirmPasswordValid
          )
        }
        onPress={onPressRegisterSubmitButton}
        loading={loading}
      />
      <Text
        onPress={() => navigate("Login")}
        style={{ ...styles.navigateText }}
      >
        {t("register.alreadyRegister")}
      </Text>
    </KeyboardAwareScrollView>
  );
};
const styles = {
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
  },
  navigateText: {
    alignSelf: "center",
    paddingVertical: 20,
    color: DARK_GRAY,
  },
};
export default RegisterScreen;
