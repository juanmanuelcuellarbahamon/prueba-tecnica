FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --production=false

COPY . .

RUN npm run build

RUN npm install -g http-server

EXPOSE 8080

CMD ["npm", "run", "start"]