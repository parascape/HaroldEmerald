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

# Create package-lock.json first
RUN npm install --package-lock-only

# Then install dependencies
RUN npm ci --only=production

# Copy the rest of the application
COPY . .

# Start the bot
CMD ["node", "index.js"]
