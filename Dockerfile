FROM node:18-alpine

WORKDIR /usr/src/app
COPY package*.json ./

RUN npm i --only=production

COPY . .

EXPOSE 3008

CMD ["node", "server.js"]
