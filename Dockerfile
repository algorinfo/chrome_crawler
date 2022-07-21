FROM node:14-alpine as builder
# https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-on-alpine
# python is needed for gc-stats
ENV PYTHONUNBUFFERED=1
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn \
    python3 \
    && ln -sf python3 /usr/bin/python \
    && addgroup -S nuxion && adduser -S nuxion -G nuxion \
    && mkdir app && chown nuxion:nuxion /app

# Create app directory
WORKDIR /app
USER nuxion
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_ENV="prod"
COPY . .
RUN yarn install --ignore-scripts

CMD ["node", "src/server.js"]
