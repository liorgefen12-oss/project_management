# Build context is the repo root (see docker-compose.yml), because the frontend
# imports images from the shared repo-root assets/ folder.
FROM node:22-alpine AS build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY assets /app/assets
COPY frontend/index.html frontend/tsconfig.json frontend/vite.config.ts ./
COPY frontend/src ./src
RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
# index.html links the favicon from assets/pictures/, which Vite does not bundle
COPY assets/pictures /usr/share/nginx/html/assets/pictures

EXPOSE 80
