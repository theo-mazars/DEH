FROM node:16-alpine
WORKDIR /usr/src/app

COPY package.json .
COPY yarn.lock .

RUN yarn && yarn global add prisma

COPY . .

RUN npx prisma generate

CMD ["yarn", "start"]
