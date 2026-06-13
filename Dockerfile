# Single application image: builds the Vue frontend and runs the Express backend.

# 1) Build the Vue frontend into static files.
FROM node:20-alpine AS frontend-build
WORKDIR /usr/src/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --include=dev --no-audit --no-fund
COPY frontend/ ./
ARG VITE_API_BASE=/api
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build

# 2) Install backend dependencies and copy the backend source.
FROM node:20-alpine AS app
WORKDIR /usr/src/app
ENV NODE_ENV=production

COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY backend/ ./

# Copy the compiled Vue static files where Express expects them.
COPY --from=frontend-build /usr/src/frontend/dist ./public

EXPOSE 3000
CMD ["node", "src/app.js"]
