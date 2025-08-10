# Dockerfile for JARVI Application
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Expose ports
EXPOSE 5173 3001 3002 3003 3004

# Create directories for data persistence
RUN mkdir -p /app/voice-notes /app/tasks/data /app/tasks/audio /app/meetings/recordings

# Start script
CMD ["npm", "run", "start:all"]