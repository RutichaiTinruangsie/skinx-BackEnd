FROM node:18.18.2

ENV NODE_ENV=production

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production

COPY . .

RUN npm install -g ts-node

CMD ["ts-node", "src/index.ts"]

# COPY post.json .
