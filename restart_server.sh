#! /bin/bash
ssh example@example.webfactional.com pkill node
ssh example@example.webfactional.com "export PORT=15291 MONGO_URL='mongodb://localhost:18099/shukbox';nohup ~/bin/node ~/webapps/shukbox/main.js; bg"
