import React from "react";
import { ActivityIndicator, View, Text, TextInput } from "react-native";
import { DARK_GRAY, LIGHT_GRAY, INVALID_RED } from "../../consts/colors";

const AccountSettingForm = ({
  label,
  editable,
  value,
  defaultValue,
  description,
  status,
  onBlur,
  error,
}) => {
  return (
    <View>
      <Text style={{ ...styles.label, paddingTop: 15, paddingBottom: 8 }}>
        {label}
      </Text>
      {editable === false ? (
        <Text style={{ fontSize: 22, color: DARK_GRAY }}>{value}</Text>
      ) : (
        <TextInput
          autoCorrect={false}
          autoCapitalize={false}
          editable={editable}
          defaultValue={defaultValue}
          style={{ ...styles.textInput }}
          onBlur={onBlur}
        ></TextInput>
      )}
      {error ? (
        <Text style={{ ...styles.error, paddingTop: 8, paddingBottom: 15 }}>
          {error}
        </Text>
      ) : (
        <>
          {status === "saving" && (
            <View
              style={{ ...styles.savingText, paddingTop: 8, paddingBottom: 20 }}
            >
              <ActivityIndicator />
              <Text style={{ marginLeft: 4, color: DARK_GRAY }}>
                {t("info.saving")}
              </Text>
            </View>
          )}
          {status === "saved" && (
            <View
              style={{ ...styles.savingText, paddingTop: 8, paddingBottom: 20 }}
            >
              <Text style={{ marginLeft: 4, color: DARK_GRAY }}>
                ✓ {t("info.changeSaved")}
              </Text>
            </View>
          )}
          {!status && (
            <Text
              style={{
                ...styles.description,
                paddingTop: 8,
                paddingBottom: 15,
              }}
            >
              {description}
            </Text>
          )}
        </>
      )}
    </View>
  );
};

const styles = {
  label: {
    fontSize: 18,
    fontWeight: "300",
  },
  textInput: {
    borderColor: LIGHT_GRAY,
    borderWidth: 1,
    height: 32,
    paddingHorizontal: 10,
  },
  savingText: {
    fontSize: 14,
    flexDirection: "row",
  },
  description: {
    color: DARK_GRAY,
    fontSize: 14,
  },
  error: {
    color: INVALID_RED,
    fontSize: 14,
  },
};

export default AccountSettingForm;
