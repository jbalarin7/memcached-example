# 🚀 Demo Completo: PostgreSQL + Memcached Pool + Interface Web

> Aplicação full-stack demonstrando o padrão **cache-aside** com Memcached em cluster, PostgreSQL e interface web interativa.

[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18-339933?logo=node.js)](https://nodejs.org/)
[![Memcached](https://img.shields.io/badge/Memcached-1.6-blue)](https://memcached.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)](https://www.postgresql.org/)

## ✨ Recursos

- 🎯 **Interface Web Moderna** com abas e design responsivo
- ⚡ **Pool de 3 servidores Memcached** com distribuição automática
- 💾 **PostgreSQL** com dados de exemplo (15 produtos)
- 📊 **Estatísticas em tempo real** (hit rate, memória, uptime)
- 🔢 **Contadores atômicos** (increment/decrement)
- 🔍 **Inspeção de cache** (cachedump com preview de valores)
- 🗑️ **Gerenciamento de itens** (deletar chaves individuais)
- 🔄 **Hot-reload** com Nodemon (desenvolvimento)
- 🐛 **Debug integrado** (Node.js Inspector na porta 9229)
- 🚀 **Escalabilidade** (adicionar/remover servidores dinamicamente)

## � Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- [Docker Desktop](https://www.docker.com/products/docker-desktop) instalado e rodando
- Git (opcional, para clonar o repositório)

## 🚀 Quick Start

```bash
# 1. Instalar dependências
npm install

# 2. Subir todos os serviços (PostgreSQL + 3x Memcached + App Web)
npm run docker:up

# 3. Aguardar ~10 segundos para inicialização

# 4. Abrir no navegador
# 🌐 http://localhost:3000
```

**Pronto!** 🎉 A aplicação está rodando com:
- ✅ PostgreSQL com 15 produtos de exemplo
- ✅ 3 servidores Memcached em pool
- ✅ Interface web na porta 3000
- ✅ Debug habilitado na porta 9229
## 🎯 Funcionalidades da Interface Web

### 📦 Aba "Produtos"

**Consultas Rápidas:**
- 🔍 Buscar todos os produtos
- 🆔 Buscar por ID específico
- 🏷️ Filtrar por categoria (Eletrônicos, Periféricos, Áudio, Acessórios)
- 💰 Filtrar por preço máximo

**Comparação Visual:**
- ⚡ Badge verde = **CACHE** (1-5ms)
- 💾 Badge vermelho = **BANCO DE DADOS** (50-100ms)
- ⏱️ Tempo de resposta em milissegundos

**Gerenciamento:**
- 📊 Estatísticas por servidor (hit rate, memória, uptime)
- 🔍 Inspecionar itens do cache com preview de valores
- 🗑️ Deletar itens individuais do cache
- 🧹 Limpar todo o cache

### � Aba "Contadores"

**Operações Atômicas:**
- ➕ Incrementar (+1 ou quantidade customizada)
- ➖ Decrementar (-1 ou quantidade customizada)
- � Consultar valor atual
- 🔄 Resetar contador

**Casos de Uso:**
- 👥 Contador de visitantes
- ❤️ Likes/curtidas
- 👁️ Views de página
- 🛒 Itens no carrinho

### 📊 Performance Esperada

| Operação | Primeira vez | Cache Hit | Ganho |
|----------|-------------|-----------|-------|
| Todos produtos | ~80ms | ~2ms | **40x** |
| Por categoria | ~60ms | ~1ms | **60x** |
| Por ID | ~50ms | ~1ms | **50x** |
| Incremento | - | ~0.5ms | **Atômico** |

## � Comandos Disponíveis

### 🐳 Docker

```bash
# Subir todos os serviços
npm run docker:up

# Parar serviços do docker-compose
npm run docker:down

# Parar e remover TUDO (incluindo servidores adicionados manualmente)
npm run docker:clean

# Ver logs em tempo real
npm run docker:logs              # Todos os serviços
npm run docker:logs:app          # Apenas aplicação
npm run docker:logs:db           # Apenas PostgreSQL

# Monitorar recursos (CPU, memória, rede)
npm run docker:stats
```

### 🗄️ Banco de Dados

```bash
# Conectar ao PostgreSQL via psql
npm run db:connect

# Dentro do psql:
# SELECT * FROM produtos;
# SELECT COUNT(*) FROM produtos;
# \d produtos
# \q (sair)
```

### 💾 Memcached

```bash
# Conectar ao shell do memcached1
npm run memcached:connect

# Adicionar novo servidor ao pool (ex: memcached4)
npm run add-memcached

# Remover servidor específico
npm run remove-memcached memcached4
```

### 🧪 Telnet (Comandos Memcached)

[![DigitalOcean](https://img.shields.io/badge/DigitalOcean-Tutorial-0080FF?logo=digitalocean)](https://www.digitalocean.com/community/tutorials/memcached-telnet-commands-example)
```bash
# Windows: Habilitar cliente Telnet
dism /online /Enable-Feature /FeatureName:TelnetClient

# Conectar ao Memcached1
telnet localhost 11211
# Comandos úteis:
stats                # Estatísticas gerais
stats items          # Itens por slab
stats slabs          # Informações dos slabs
get <chave>          # Buscar valor

set <chave> 0 60 5   # Armazenar (flags, TTL, bytes)
VALUE <valor>

replace <chave> 0 60 5 # Reatribuir (flags, TTL, bytes)
<valor>

delete <chave>       # Deletar
flush_all            # Limpar tudo
quit                 # Sair
```

## 🐛 Desenvolvimento & Debug

### Hot-Reload Automático

O código é sincronizado em tempo real via **volume bind**:
- ✅ Edite `app/server.js` → Nodemon reinicia automaticamente
- ✅ Edite `app/public/index.html` → Refresh no navegador
- ✅ Sem rebuild de imagem necessário

### Debug no VS Code

1. Inicie os containers: `npm run docker:up`
2. Pressione **F5** ou vá em "Run and Debug"
3. Selecione **"Attach to Docker"**
4. Coloque breakpoints em `app/server.js`
5. Faça requisições na interface web

> 💡 O arquivo `.vscode/launch.json` já está configurado!

### Debug no Chrome DevTools

1. Abra `chrome://inspect` no Chrome
2. Clique em **"Configure"** e adicione: `localhost:9229`
3. O container aparecerá em "Remote Target"
4. Clique em **"inspect"** para abrir o DevTools

### Estrutura do Projeto

```
memcached-example/
├── app/
│   ├── server.js              # Backend Express + Memcached
│   ├── public/
│   │   └── index.html         # Frontend com abas
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml         # 3x Memcached + PostgreSQL + App
├── init.sql                   # Script de inicialização do banco
├── add-memcached-server.js    # Script para adicionar servidor
├── remove-memcached-server.js # Script para remover servidor
├── clean-all-containers.js    # Script para limpar tudo
└── .vscode/
    └── launch.json            # Configuração de debug
```

## 🔧 Arquitetura

### Padrão Cache-Aside

```
┌─────────┐      ┌──────────────┐      ┌─────────────┐
│ Cliente │─────→│   Express    │─────→│  Memcached  │
│  (Web)  │←─────│   Backend    │←─────│   Pool      │
└─────────┘      └──────────────┘      │ (3 servers) │
                        │               └─────────────┘
                        ↓
                  ┌──────────────┐
                  │  PostgreSQL  │
                  │  (produtos)  │
                  └──────────────┘
```

**Fluxo de leitura:**
1. Cliente solicita dados
2. Backend verifica cache
3. **Cache Hit**: Retorna do Memcached (rápido)
4. **Cache Miss**: Busca no PostgreSQL → Armazena no cache → Retorna

### Pool de Memcached

O cliente Memcached distribui as chaves automaticamente usando **Consistent Hashing**:

```javascript
// Configuração do pool
const memcachedServers = [
  'memcached1:11211',
  'memcached2:11211', 
  'memcached3:11211'
];

// Distribuição automática
// produtos:todos    → memcached2
// produto:1         → memcached1
// contador:likes    → memcached3
```

## 🚀 Escalabilidade

### Adicionar Servidor Dinamicamente

```bash
# Adiciona automaticamente memcached4, memcached5, etc.
npm run add-memcached

# O que acontece:
# 1. Cria novo container memcached
# 2. Atualiza variável MEMCACHED_SERVERS
# 3. Reinicia aplicação
# 4. Pool agora tem 4 servidores!
```

### Remover Servidor

```bash
# Remove servidor específico
npm run remove-memcached memcached4

# Proteção: Não permite remover memcached1, 2 ou 3
```

## 📚 Operações do Memcached

### Básicas

```javascript
// Armazenar (TTL de 300 segundos)
await memcached.set('chave', valor, 300);

// Recuperar
const valor = await memcached.get('chave');

// Deletar
await memcached.del('chave');

// Limpar tudo
await memcached.flush();
```

### Contadores (Atômicos)

```javascript
// Incrementar
const novoValor = await memcached.incr('contador', 1);

// Decrementar
const novoValor = await memcached.decr('contador', 1);

// ⚡ Operações atômicas = thread-safe!
```

### Inspeção

```javascript
// Listar itens do cache
await memcached.items();           // Lista slabs
await memcached.cachedump(slab);   // Lista chaves do slab

// Estatísticas
await memcached.stats();
```

## 🎓 Conceitos Demonstrados

- ✅ **Cache-Aside Pattern** (Lazy Loading)
- ✅ **Consistent Hashing** (distribuição de chaves)
- ✅ **TTL** (Time To Live - expiração)
- ✅ **Cache Invalidation** (limpeza seletiva)
- ✅ **Hit Rate Monitoring** (métricas de eficiência)
- ✅ **Atomic Operations** (increment/decrement)
- ✅ **Connection Pooling** (múltiplos servidores)

## 📖 Recursos Adicionais

- [Documentação Oficial Memcached](https://github.com/memcached/memcached/wiki)
- [NPM: memcached](https://www.npmjs.com/package/memcached)
- [Memcached Protocol](https://github.com/memcached/memcached/blob/master/doc/protocol.txt)
- [Cache Patterns](https://docs.aws.amazon.com/whitepapers/latest/database-caching-strategies-using-redis/caching-patterns.html)

## 📝 Licença

ISC

---