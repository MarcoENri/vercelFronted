# --- ETAPA 1: BUILD ---
FROM node:20-alpine AS build

# Directorio de trabajo
WORKDIR /app

# Copiamos package.json y package-lock.json
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto del proyecto
COPY . .

# Build de producción
RUN npm run build

# --- ETAPA 2: SERVIR CON NGINX ---
FROM nginx:alpine

# Copiamos el build de React al directorio de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Configuración para React Router (SPA)
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx-default.conf /etc/nginx/conf.d/default.conf

# Puerto de exposición
EXPOSE 80

# Comando por defecto
CMD ["nginx", "-g", "daemon off;"]
