FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy server code
COPY . .

# Expose server port
EXPOSE 3001

# Environment variable defaults
ENV PORT=3001
ENV NODE_ENV=production

# Start SyncStream signaling & streaming server
CMD ["node", "server.js"]
