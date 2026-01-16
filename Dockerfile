# Build stage - compile TypeScript and build React frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source files
COPY . .

# Build the React frontend (use npx to avoid permission issues)
RUN npx tsc && npx vite build

# Compile the server TypeScript
RUN npx tsc server.ts --esModuleInterop --module commonjs --outDir ./compiled

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
COPY --from=builder /app/compiled/server.js ./

# Create data directory
RUN mkdir -p /data

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_FILE=/data/data.json

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
