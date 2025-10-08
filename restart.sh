#!/bin/bash

git pull https://sarangkkl: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@github.com/sarangkkl/tradefair.git

sudo npm run build
sudo systemctl restart trade
echo "Restarted trade service"

echo "System redeploy succesfully"