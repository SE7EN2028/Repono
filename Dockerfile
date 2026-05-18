FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY client/package*.json ./client/
RUN cd client && npm install --include=dev

COPY . .
RUN npm run build

RUN mkdir -p repos vector-store/data

EXPOSE 3001
CMD ["npm", "start"]
