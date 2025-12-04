FROM node:18-alpine

WORKDIR /app

# Copiar package.json e instalar dependências
COPY package.json package-lock.json* ./
RUN npm install --production

# Copiar código da aplicação
COPY . .

# Expor portas
EXPOSE 3000
EXPOSE 9229

# Comando para iniciar a aplicação (pode ser sobrescrito no docker-compose)
CMD ["node", "server.js"]
