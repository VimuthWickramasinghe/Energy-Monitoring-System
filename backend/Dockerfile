# Use the official lightweight Node.js image.
# https://hub.docker.com/_/node
FROM node:20-alpine

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY package*.json ./

# Install production dependencies.
# If you add a package-lock.json speed your build by switching to 'npm ci'.
RUN npm install --only=production

# Copy local code to the container image.
COPY . .

# Run the web service on container startup.
# Cloud Run automatically sets the PORT environment variable to 8080 (or respects your config).
CMD [ "npm", "start" ]

