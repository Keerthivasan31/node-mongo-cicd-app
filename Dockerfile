FROM node:20-slim
WORKDIR /app

# Install curl for the HEALTHCHECK command
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy package.json AND package-lock.json
COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:3000/health || exit 1

<<<<<<< HEAD
CMD ["npm", "start"]
=======
CMD ["npm", "start"]
>>>>>>> 83e540b59e7ebbd7743c733e9e151af8f14e8662
