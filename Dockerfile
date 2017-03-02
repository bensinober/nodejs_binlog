FROM mhart/alpine-node:7.7.0

WORKDIR /src

RUN apk add --no-cache make gcc g++

ADD . .
RUN npm install

EXPOSE 8001
CMD ["node", "index.js"]