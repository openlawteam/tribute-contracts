#!/usr/bin/env bash
set -eo pipefail
date=`date '+%F_%T'`
network="$1"
echo "[arg1] Network: ${network}"
npx hardhat deploy --network $1 2>&1 | tee "./logs/${network}-deploy_${date}.log"