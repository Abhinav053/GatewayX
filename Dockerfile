FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY services/payment-orchestrator/package.json services/payment-orchestrator/package.json
COPY services/metrics-service/package.json services/metrics-service/package.json
COPY services/experiment-service/package.json services/experiment-service/package.json
COPY shared/package.json shared/package.json

RUN npm install

COPY . .

RUN npx prisma generate

CMD ["npm", "run", "dev:orchestrator"]
