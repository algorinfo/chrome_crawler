FROM node:18-alpine as builder
# https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-on-alpine
# python is needed for gc-stats
ENV PYTHONUNBUFFERED=1
RUN apk add --no-cache \
    libstdc++ \
    chromium \
    nss \
    freetype \
    freetype-dev \
    ttf-freefont \
    font-noto-emoji \
    harfbuzz \
    ca-certificates \
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
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV CHROME_PATH=/usr/lib/chromium/ 
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV NODE_ENV="prod"
ENV WEB_ADDR="0.0.0.0"
COPY . .
RUN yarn install --ignore-scripts

CMD ["node", "src/server.js"]
