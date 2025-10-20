# Dockerfile para Frontend Angular
FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Instalar Angular CLI globalmente
RUN npm install -g @angular/cli@20

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 4200

# Comando para ejecutar en desarrollo
CMD ["ng", "serve", "--host", "0.0.0.0", "--port", "4200", "--poll", "2000"]