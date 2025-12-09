FROM alpine:latest

RUN apk update && apk upgrade

RUN apk add --no-cache openssl ncurses-libs libstdc++

RUN apk add --no-cache \
    nodejs \
    npm \
    python3 \
    py3-setuptools \
    make \
    g++

RUN addgroup -S node && adduser -S node -G node
RUN npm install -g nodemon
RUN npm install -g vite

RUN mkdir -p /opt/bookminder/bookminder_server/node_modules
RUN mkdir -p /opt/bookminder/bookminder_vite/node_modules

COPY bookminder_server/package.json /opt/bookminder/bookminder_server/package.json
COPY bookminder_vite/package.json /opt/bookminder/bookminder_vite/package.json

WORKDIR /opt/bookminder/bookminder_server
RUN npm install
RUN npm rebuild
WORKDIR /opt/bookminder/bookminder_vite
RUN npm install
RUN npm rebuild

COPY bundle_docker/entry.sh /opt/bookminder/entry.sh

RUN chown -R node:node /opt/bookminder

EXPOSE 3010
EXPOSE 5183

#USER node
