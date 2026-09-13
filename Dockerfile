FROM node:24-alpine AS ssdp-helper-build

WORKDIR /build
RUN apk add --no-cache build-base
COPY src/ssdp-helper.c ./ssdp-helper.c
RUN mkdir -p /out \
  && gcc -Os -Wall -Wextra -o /out/loxevo-ssdp-helper ./ssdp-helper.c

FROM node:24-alpine

WORKDIR /app

LABEL org.opencontainers.image.title="LoxEvo"
LABEL org.opencontainers.image.description="LoxBerry gateway for Loxone automation and Alexa Echo TTS"
LABEL org.opencontainers.image.source="https://github.com/herdan75/loxevo"
ARG VCS_REF=unknown
LABEL org.opencontainers.image.revision=$VCS_REF
ENV LOXEVO_BUILD_REVISION=$VCS_REF

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

COPY src ./src
COPY public ./public
COPY tools/tts-soak.mjs ./tools/tts-soak.mjs
COPY config.example.json ./config.example.json
COPY --from=ssdp-helper-build /out/loxevo-ssdp-helper /app/bin/loxevo-ssdp-helper

ENV CONFIG_PATH=/config/config.json
ENV PORT=8080
ENV SSDP_HELPER_PATH=/app/bin/loxevo-ssdp-helper
EXPOSE 8080/tcp
EXPOSE 80/tcp
EXPOSE 1900/udp

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" >/dev/null || exit 1

CMD ["node", "src/index.js"]
