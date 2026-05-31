# Backend Docker image.
# It builds and runs the Node.js + Express REST API
# using a production-like container setup.

# Base image providing Node.js 20 on a minimal Alpine Linux distribution.
FROM node:20-alpine

# Application working directory inside the container
WORKDIR /usr/src/app

# Install dependencies first to leverage Docker layer caching
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy the rest of the backend source code
COPY . .

# Expose the API port
EXPOSE 3000

# Start the Express application
CMD ["node", "src/app.js"]
