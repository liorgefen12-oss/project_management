# Build context is the repo root (see docker-compose.yml), because the frontend
# imports images from the shared repo-root assets/ folder.
FROM node:22-alpine

RUN apk add --no-cache nginx

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY assets /app/assets
COPY frontend/index.html frontend/tsconfig.json frontend/vite.config.ts ./
COPY frontend/src ./src
RUN npm run build && mkdir -p /usr/share/nginx/html && cp -R dist/. /usr/share/nginx/html/

COPY frontend/nginx.conf /etc/nginx/http.d/default.conf
# index.html links the favicon from assets/pictures/, which Vite does not bundle
COPY assets/pictures /usr/share/nginx/html/assets/pictures
# copy the pictures into nginx directory
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
