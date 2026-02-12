#!/bin/bash

export | sed -e 's/declare -x //' | sed -e 's/"//g' > .env

# Recreate config file
rm -rf ./env-config.js
touch ./env-config.js

# Add assignment 
echo "window._env_ = {" >> ./env-config.js

WHITELIST="
  ENABLE_REDUX_LOG
  ENABLE_TELEGRAF
  DEFAULT_SITE_ID
  JWT_TOKEN_VERSION
  NODE_ENV
  VMEETING_API_BASE
  VMEETING_API_TOKEN
  VMEETING_FRONT_BASE
  VMEETING_TAG
  VMEETING_UPDATE_TIME
  VMEETING_WHITEBOARD_BASE
"

function in_whitelist() {
  for x in $WHITELIST; do
    if [ "$x" = "$1" ]; then
      return 0
    fi
  done
  return 1
}

# Read each line in .env file
# Each line represents key=value pairs
while read -r line || [[ -n "$line" ]];
do
  # Split env variables by character `=`
  if printf '%s\n' "$line" | grep -q -e '='; then
    varname=$(printf '%s\n' "$line" | sed -e 's/=.*//')
    varvalue=$(printf '%s\n' "$line" | sed -e 's/^[^=]*=//')
  fi

  if in_whitelist $varname; then
    # Read value of current variable if exists as Environment variable
    value=$(printf '%s\n' "${!varname}")
    # Otherwise use value from .env file
    [[ -z $value ]] && value=${varvalue}
    
    # Append configuration property to JS file
    echo "  $varname: \"$value\"," >> ./env-config.js
  fi
done < .env

echo "  VMEETING_UPDATE_TIME: \"$(date --utc +%FT%TZ)\"" >> ./env-config.js
echo "}" >> ./env-config.js