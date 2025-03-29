# Use Node.js 18 as the base image
FROM node:18

# Install Python3 and pip so we can install Python packages
RUN apt-get update && apt-get install -y python3 python3-pip

# Set the working directory to /app inside the container
WORKDIR /app

# Copy everything in the current directory (the 'Back End' folder) into /app
COPY . .

# Install Python dependencies (pandas, etc.)
RUN pip3 install --break-system-packages -r itinerary/requirements.txt

# Install Node.js dependencies
RUN npm install

# Expose port 3000 (adjust if your server listens on a different port)
EXPOSE 3000

# Finally, start your Node server
CMD ["npm", "start"]
