FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    build-base \
    ffmpeg \
    git

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with legacy peer deps
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Start the bot
CMD ["node", "index.js"] 