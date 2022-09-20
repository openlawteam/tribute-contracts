#!/usr/bin/env bash
set -eo pipefail
date=`date '+%F_%T'`
network="$1"
proxyAddress="$2"
echo "[arg1] Network: ${network}"
npx hardhat upgradeTributeERC721 $2 --network $1 2>&1 | tee "./logs/${network}-upgradeTributeERC721_${date}.log"
