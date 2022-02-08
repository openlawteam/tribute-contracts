#!/usr/bin/env bash

if [ -d "build/contracts" ] 
then 
    rm -rf "build/contracts"
fi
mkdir -p "build/contracts"

find "build/artifacts/contracts" -type f -name "*.json" -exec cp "{}" build/contracts \;

find "build/contracts" -type f -name "*.dbg.json" -delete 