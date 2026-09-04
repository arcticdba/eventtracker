# syntax=docker/dockerfile:1

# Build stage - compile TypeScript and build React frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev). The lockfile contains an optional
# Vitest/Vite peer mismatch, so avoid npm's expensive peer backtracking here.
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps --no-audit --no-fund

# Copy source files
COPY . .

# Build the React frontend and bundled CommonJS server
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --legacy-peer-deps --no-audit --no-fund

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

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health > /dev/null || exit 1

# Start the server
CMD ["node", "server.cjs"]
