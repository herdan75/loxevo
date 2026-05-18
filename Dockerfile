FROM node:20-alpine

WORKDIR /app

LABEL org.opencontainers.image.title="LoxEvo"
LABEL org.opencontainers.image.description="LoxBerry gateway for Loxone light control and Alexa Echo TTS"
LABEL org.opencontainers.image.source="https://github.com/herdan75/loxevo"

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src
COPY public ./public
COPY config.example.json ./config.example.json

ENV CONFIG_PATH=/config/config.json
EXPOSE 8080/tcp

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health >/dev/null || exit 1

CMD ["npm", "start"]
