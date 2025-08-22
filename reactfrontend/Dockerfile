# Use an official Node.js image as the base. We specify a version for consistency.
FROM node:18-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker layer caching
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application for production
# This creates a 'build' folder with static files
RUN npm run build

# ---

# Use a lightweight Nginx image for the production environment
FROM nginx:1.25-alpine

# Copy the static files from the 'build' stage to the Nginx server's public directory
COPY --from=build /app/build /usr/share/nginx/html

# Remove the default Nginx configuration file
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d

# Expose port 80 to the outside world
EXPOSE 80

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]