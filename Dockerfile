FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src
COPY public ./public
COPY config.example.json ./config.example.json

ENV CONFIG_PATH=/config/config.json
EXPOSE 8080/tcp

CMD ["npm", "start"]
