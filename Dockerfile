FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

# ---------- 2. Production ----------
FROM node:22-alpine AS production

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

COPY --from=deps /app/dist ./dist
COPY .env .env

EXPOSE 3000

CMD ["node", "dist/main.js"]
