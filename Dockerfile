FROM --platform=linux/amd64 node:18.12.1-alpine3.17

WORKDIR /workspace

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD npm start
