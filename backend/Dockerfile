# Use official Node.js LTS image
FROM node:20-alpine

# Install Python3 and pip for the ML service
RUN apk add --no-cache python3 py3-pip

# Set working directory
WORKDIR /app

# Copy package files and install Node dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the backend source
COPY . .

# Set the Python executable path for the ML script
ENV PYTHON_EXECUTABLE=/usr/bin/python3

# Expose the backend port
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
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

# Set environment variables
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=energy-management-system-fd6fb

# Expose the port the app runs on
EXPOSE 8080

# Run the web service on container startup.
# Cloud Run automatically sets the PORT environment variable to 8080 (or respects your config).
CMD [ "npm", "start" ]
