#!/bin/bash
kill $(ps aux | grep 'node app.js' | awk '{print $2}')
cd /volume1/zso_app/node-app/
nohup node app.js &
