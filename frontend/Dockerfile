# First stage: build the Vue application with Node.
# This stage contains the development dependencies needed by Vite.
FROM node:20-alpine AS build

# Set the working directory inside the build container.
WORKDIR /usr/src/app

# Copy only package.json first so Docker can cache dependency installation.
COPY package.json ./

# Use the official npm registry and install dependencies.
# Dev dependencies are included because Vite is required to build the frontend.
RUN npm config set registry https://registry.npmjs.org/ \
    && npm install --include=dev

# Copy the frontend source code into the build container.
COPY . .

# Default API base path used by the frontend.
# It is relative so the same build can work on localhost or on a public server.
ARG VITE_API_BASE=/api
ENV VITE_API_BASE=$VITE_API_BASE

# Build the production static files into the dist directory.
RUN npm run build

# Second stage: serve the compiled frontend with Nginx.
# The final image does not contain Node modules or build tools.
FROM nginx:1.27-alpine

# Replace the default Nginx configuration with our SPA + API proxy config.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy only the compiled Vue files from the build stage.
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Expose the HTTP port used by Nginx inside the container.
EXPOSE 80
