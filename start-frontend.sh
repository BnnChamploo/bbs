#!/bin/bash
cd "$(dirname "$0")/client"
source ~/.nvm/nvm.sh
nvm use 18
npm run dev

