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