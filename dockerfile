# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files to the working directory
COPY . .

# Expose the port your app runs on
EXPOSE 8000

# Set the environment variable for production (optional)
ENV NODE_ENV=production

# Command to run the application
CMD ["node", "index.js"]
