# ===== Build stage =====
FROM node:22-alpine AS build
WORKDIR /app

# Installa le dipendenze (npm install fresco: niente lockfile committato,
# così i binari nativi per Linux vengono risolti correttamente)
COPY package.json ./
RUN npm install

# Build statico di Astro
COPY . .
RUN npm run build

# ===== Serve stage =====
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 4321
CMD ["nginx", "-g", "daemon off;"]
