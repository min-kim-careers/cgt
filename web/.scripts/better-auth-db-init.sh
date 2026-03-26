#!/bin/bash

BETTER_AUTH_CONFIG_PATH=src/lib/utils/better-auth/config.ts

docker exec -it cgt_dev_web-container \
  npx @better-auth/cli@latest generate --yes --config $BETTER_AUTH_CONFIG_PATH

docker exec -it cgt_dev_web-container \
  npx @better-auth/cli@latest migrate --yes --config $BETTER_AUTH_CONFIG_PATH
