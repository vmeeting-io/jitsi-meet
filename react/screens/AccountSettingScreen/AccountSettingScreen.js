import React, { useState, useEffect } from "react";
import { TouchableOpacity, Text, View, ActivityIndicator } from "react-native";
import { useDispatch, useSelector, useStore } from "react-redux";
import { setScreen } from "../../redux/screen/screen";
import { getStatusBarHeight } from "react-native-status-bar-height";
import { LIGHT_GRAY, DARK_GRAY } from "../../consts/colors";
import BackButton from "../../features/base/react/components/native/BackButton";
import AccountSettingForm from "../../components/AccountSettingForm/AccountSettingForm";
import api from "../../api";
import * as validators from "../../utils/validator";
import { useTranslation } from "react-i18next";
import { setJWT } from "../../features/base/jwt";
import { tokenLocalStorage } from "../../api/AuthApi";

const iosStatusBarHeight = getStatusBarHeight();

const AccountSettingScreen = () => {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation("vmeeting", { i18n });
  const store = useStore();

  const userInfo = useSelector((store) => store)["features/base/jwt"].user;
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [fullNameError, setFullNameError] = useState("");
  const [fullNameStatus, setFullNameStatus] = useState("");

  const onBlurFullName = ({ nativeEvent: { text } }) => {
    setFullNameError(undefined);
    if (text !== userInfo.name) {
      if (!text || text.length < 2) {
        setFullNameError(t("error.fullnameTooShort"));
      } else {
        setFullNameStatus("saving");
        const form = { name: text };
        api.updateAccount(form, store.getState()).then((resp) => {
          const { error } = resp.data;
          if (error) {
            setFullNameError(
              error.name === "name_too_short"
                ? t("error.fullnameTooShort")
                : t("error.invalidValue")
            );
          } else {
            const token = resp.data;
            tokenLocalStorage.setItem(token, store.getState());
            dispatch(setJWT(token));
            setFullNameError("");
            setFullNameStatus("saved");
            setTimeout(() => setFullNameStatus(""), 6000);
          }
        });
      }
    }
  };

  const onBlurEmail = ({ nativeEvent: { text } }) => {
    setEmailError(undefined);
    if (text !== userInfo.email) {
      if (!text || validators.email(text)) {
        setEmailError("invalid_params");
      } else {
        setEmailStatus("saving");
        const form = { email: text };
        api.updateAccount(form, store.getState()).then((resp) => {
          const { error } = resp.data;
          if (error) {
            setEmailError(
              error.email === "email_in_use"
                ? t("error.emailInUse")
                : t("error.invalidValue")
            );
          } else {
            const token = resp.data;
            tokenLocalStorage.setItem(token, store.getState());
            dispatch(setJWT(token));
            setEmailError("");
            setEmailStatus("saved");
            setTimeout(() => setEmailStatus(""), 6000);
          }
        });
      }
    }
  };

  const onResetPassword = () => {
    setLoading(true);
    api
      .passwordReset({}, store.getState())
      .then(() => {
        console.log("reset password is sent.");
        setLoading(false);
      })
      .catch((error) => {
        console.error("onResetPassword is failed:", error.response);
        setLoading(false);
      });
  };

  return (
    <>
      <View style={{ ...styles.header }}>
        <BackButton
          style={{ color: "white" }}
          onPress={() => {
            dispatch(setScreen("Home"));
          }}
        />
        <Text style={{ color: "white", fontSize: 18 }}>
          {t("account.title")}
        </Text>
        <View style={{ height: 32, width: 32, marginLeft: 12 }} />
      </View>
      <View style={{ ...styles.container }}>
        <AccountSettingForm
          editable={false}
          label={t("register.username")}
          value={userInfo.username}
          description={t("info.username")}
        />
        <AccountSettingForm
          onBlur={onBlurFullName}
          status={fullNameStatus}
          label={t("register.fullName")}
          defaultValue={userInfo.name}
          error={fullNameError}
          description={t("info.fullName")}
        />
        <AccountSettingForm
          onBlur={onBlurEmail}
          status={emailStatus}
          label={t("register.email")}
          defaultValue={userInfo.email}
          error={emailError}
          description={t("info.email")}
        />
        <View>
          <Text
            style={{
              fontSize: 18,
              paddingTop: 20,
              paddingBottom: 8,
              fontWeight: "300",
            }}
          >
            {t("register.password")}
          </Text>
          <TouchableOpacity
            onPress={onResetPassword}
            style={{
              width: 200,
              height: 40,
              borderColor: LIGHT_GRAY,
              borderWidth: 1,
              borderRadius: 5,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text
                style={{
                  color: DARK_GRAY,
                  fontWeight: "300",
                  fontSize: 16,
                }}
              >
                {t("login.passwordReset")}
              </Text>
            )}
          </TouchableOpacity>
          <Text
            style={{
              color: DARK_GRAY,
              paddingTop: 8,
              paddingBottom: 5,
              fontSize: 14,
            }}
          >
            {t("info.passwordReset")}{" "}
          </Text>
        </View>
      </View>
    </>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: 10,
    paddingHorizontal: 24,
  },
  header: {
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#44A5FF",
    color: "white",
    height: iosStatusBarHeight + 55,
    width: "100%",
    paddingHorizontal: 10,
    paddingTop: iosStatusBarHeight,
  },
};

export default AccountSettingScreen;
