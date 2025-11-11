# Etapa 1: build do Vite
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

# Variável de ambiente compatível com Vite
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

COPY . .
RUN npm run build

# Etapa 2: servidor Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

