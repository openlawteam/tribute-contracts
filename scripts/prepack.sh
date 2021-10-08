#!/usr/bin/env bash

if [ -d "build/contracts" ] 
then 
    rm -rf "build/contracts"
fi
mkdir -p "build"

cp -rf artifacts/contracts build
find "build/contracts" -type f -name "*.dbg.json" -delete