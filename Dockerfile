FROM node:26-alpine AS builder
FROM nginx:1.31-alpine AS runner

FROM builder as build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM runner
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80