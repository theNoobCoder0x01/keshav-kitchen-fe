# -------------------------
# 1. Base image
# -------------------------
FROM node:22-slim AS base

# Install dependencies for Chromium + Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    unzip \
    curl \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# -------------------------
# 3. Production runtime
# -------------------------
FROM base AS production

WORKDIR /app

COPY package*.json ./

ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN npm ci

COPY . .

ENV NODE_ENV=production

COPY ./docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

RUN npx prisma generate

RUN npm run build

EXPOSE 3002

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start"]

# -------------------------
# 4. Dev / Beta runtime
# -------------------------
FROM base AS dev

WORKDIR /app

COPY package*.json ./

ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN npm ci

COPY . .

ENV NODE_ENV=development

COPY ./docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

RUN npx prisma generate

RUN npm run build

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start"]