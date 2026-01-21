# Build stage - compile TypeScript and build React frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source files
COPY . .

# Build the React frontend (run via node to avoid permission issues on QNAP)
RUN node node_modules/typescript/bin/tsc && node node_modules/vite/bin/vite.js build

# Compile the server TypeScript and rename to .cjs for CommonJS compatibility
RUN node node_modules/typescript/bin/tsc server.ts --esModuleInterop --module commonjs --target ES2020 --outDir ./compiled \
    && mv ./compiled/server.js ./compiled/server.cjs

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built frontend from builder
COPY --from=builder /app/dist ./dist

# Copy compiled server
COPY --from=builder /app/compiled/server.cjs ./

# Create data directory
RUN mkdir -p /data

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_FILE=/data/data.json
ENV SETTINGS_FILE=/data/settings.json

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "server.cjs"]
