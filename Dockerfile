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

# Copy package manifests first (for caching)
COPY package*.json ./

# Skip Chromium download (we use system Chrome)
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Install dependencies (dev included for build)
RUN npm install

# Copy app source
COPY . .

ENV NODE_ENV=production

# Entrypoint handles DB setup + app start
COPY ./docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

RUN npx prisma generate

# Build Next.js
RUN npm run build

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start"]

# -------------------------
# 4. Dev runtime (optional)
# -------------------------
FROM base AS dev

WORKDIR /app

# Copy package manifests first (for caching)
COPY package*.json ./

# Skip Chromium download (we use system Chrome)
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Install dependencies (dev included for build)
RUN npm install

# Copy app source
COPY . .

ENV NODE_ENV=development

# Entrypoint handles DB setup + app start
COPY ./docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

RUN npx prisma generate

# Build Next.js
RUN npm run build

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start"]