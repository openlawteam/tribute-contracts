#!/usr/bin/env bash
set -eo pipefail
date=`date '+%F_%T'`
network="$1"
name="$2"
symbol="$3"
daoAddress="$4"
baseURI="$5"
echo "[arg1] Network: ${network}"
npx hardhat deployTributeERC721 $2 $3 $4 $5 --network $1 2>&1 | tee "./logs/${network}-deployTributeERC721_${date}.log"
