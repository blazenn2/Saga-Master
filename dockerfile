FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install -f

RUN npm install pm2 -g
RUN npm install bun -g

COPY . .

EXPOSE 8888

CMD ["pm2-runtime", "index.ts", "--name", "saga_master", "-i", "-1", "--", "-p", "8888"]
