FROM node:20-alpine AS builder

WORKDIR /app/backend

# Install dependencies
COPY backend/package*.json ./
RUN npm ci

# Copy source and build
COPY backend/ ./
RUN npm run build

# ── Production image ──────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Copy backend production deps
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy compiled backend
COPY --from=builder /app/backend/dist ./backend/dist

# Copy frontend static files
COPY frontend/ ./frontend/

WORKDIR /app/backend

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/server.js"]
