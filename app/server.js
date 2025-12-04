const express = require('express');
const { Pool } = require('pg');
const Memcached = require('memcached');

const app = express();
const PORT = 3000;

// Configuração do PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'admin123',
    database: process.env.DB_NAME || 'myapp',
});

// Configuração do Memcached (pool)
const memcachedServers = (process.env.MEMCACHED_SERVERS).split(',');
const memcached = new Memcached(memcachedServers, {
    retries: 10,
    retry: 10000,
    remove: true,
    failOverServers: memcachedServers
});

const CACHE_TTL = 300; // 5 minutos

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Logs de inicialização
console.log('🚀 Iniciando aplicação...');
console.log('📊 PostgreSQL:', process.env.DB_HOST);
console.log('💾 Memcached:', memcachedServers.join(', '));

// Testar conexão com o banco
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Erro ao conectar no PostgreSQL:', err);
    } else {
        console.log('✅ Conectado ao PostgreSQL:', res.rows[0].now);
    }
});

// ============= ROTAS DA API =============

// Rota para buscar todos os produtos
app.get('/api/produtos', async (req, res) => {
    const chaveCache = 'produtos:todos';
    const inicio = Date.now();

    try {
        // Tentar buscar do cache
        const dadosCache = await getCache(chaveCache);

        if (dadosCache) {
            const tempo = Date.now() - inicio;
            return res.json({
                sucesso: true,
                origem: 'cache',
                tempo: tempo,
                dados: dadosCache
            });
        }

        // Buscar do banco
        const result = await pool.query('SELECT * FROM produtos ORDER BY id');
        const tempo = Date.now() - inicio;

        // Armazenar no cache
        const TESTE_VALOR_GRANDE = false; // Alterar para false para voltar ao normal

        if (TESTE_VALOR_GRANDE) {
            // Criar um valor absurdamente grande para teste
            const valorGigante = {
                produtos: result.rows,
                dadosExtras: Array(500).fill(null).map((_, i) => ({
                    id: i,
                    descricao: `Item de teste número ${i} com uma descrição bem longa para ocupar mais espaço no cache. `.repeat(10),
                    metadados: {
                        timestamp: new Date().toISOString(),
                        indice: i,
                        dados_aleatorios: Math.random().toString(36).repeat(50)
                    }
                }))
            };
            console.log(`💾 Salvando no cache com valor GIGANTE: ~${JSON.stringify(valorGigante).length} bytes`);
            await setCache(chaveCache, valorGigante, CACHE_TTL);
            console.log(`💾 Cache salvo com valor GIGANTE: ~${JSON.stringify(valorGigante).length} bytes`);
        } else {
            await setCache(chaveCache, result.rows, CACHE_TTL);
        }

        res.json({
            sucesso: true,
            origem: 'database',
            tempo: tempo,
            dados: result.rows
        });
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// Rota para buscar produto por ID
app.get('/api/produtos/:id', async (req, res) => {
    const id = req.params.id;
    const chaveCache = `produto:${id}`;
    const inicio = Date.now();

    try {
        // Tentar buscar do cache
        const dadosCache = await getCache(chaveCache);

        if (dadosCache) {
            const tempo = Date.now() - inicio;
            return res.json({
                sucesso: true,
                origem: 'cache',
                tempo: tempo,
                dados: dadosCache
            });
        }

        // Buscar do banco
        const result = await pool.query('SELECT * FROM produtos WHERE id = $1', [id]);
        const tempo = Date.now() - inicio;

        if (result.rows.length === 0) {
            return res.status(404).json({ sucesso: false, erro: 'Produto não encontrado' });
        }

        // Armazenar no cache
        await setCache(chaveCache, result.rows[0], CACHE_TTL);

        res.json({
            sucesso: true,
            origem: 'database',
            tempo: tempo,
            dados: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// Rota para buscar produtos por categoria
app.get('/api/produtos/categoria/:categoria', async (req, res) => {
    const categoria = req.params.categoria;
    const chaveCache = `produtos:categoria:${categoria}`;
    const inicio = Date.now();

    try {
        // Tentar buscar do cache
        const dadosCache = await getCache(chaveCache);

        if (dadosCache) {
            const tempo = Date.now() - inicio;
            return res.json({
                sucesso: true,
                origem: 'cache',
                tempo: tempo,
                dados: dadosCache
            });
        }

        // Buscar do banco
        const result = await pool.query(
            'SELECT * FROM produtos WHERE categoria = $1 ORDER BY nome',
            [categoria]
        );
        const tempo = Date.now() - inicio;

        // Armazenar no cache
        await setCache(chaveCache, result.rows, CACHE_TTL);

        res.json({
            sucesso: true,
            origem: 'database',
            tempo: tempo,
            dados: result.rows
        });
    } catch (error) {
        console.error('Erro ao buscar produtos por categoria:', error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// Rota para buscar produtos por preço máximo
app.get('/api/produtos/preco/:max', async (req, res) => {
    const precoMax = req.params.max;
    const chaveCache = `produtos:preco:${precoMax}`;
    const inicio = Date.now();

    try {
        // Tentar buscar do cache
        const dadosCache = await getCache(chaveCache);

        if (dadosCache) {
            const tempo = Date.now() - inicio;
            return res.json({
                sucesso: true,
                origem: 'cache',
                tempo: tempo,
                dados: dadosCache
            });
        }

        // Buscar do banco
        const result = await pool.query(
            'SELECT * FROM produtos WHERE preco <= $1 ORDER BY preco',
            [precoMax]
        );
        const tempo = Date.now() - inicio;

        // Armazenar no cache
        await setCache(chaveCache, result.rows, CACHE_TTL);

        res.json({
            sucesso: true,
            origem: 'database',
            tempo: tempo,
            dados: result.rows
        });
    } catch (error) {
        console.error('Erro ao buscar produtos por preço:', error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// Rota para limpar cache
app.post('/api/cache/limpar', async (req, res) => {
    const { chave } = req.body;

    try {
        if (chave) {
            await deleteCache(chave);
            res.json({ sucesso: true, mensagem: `Cache "${chave}" removido` });
        } else {
            // Limpar todo o cache
            await limparTodoCache();
            res.json({ sucesso: true, mensagem: 'Todo o cache foi limpo' });
        }
    } catch (error) {
        console.error('Erro ao limpar cache:', error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// Rota para deletar um item específico do cache
app.delete('/api/cache/item/:chave', async (req, res) => {
    const chave = decodeURIComponent(req.params.chave);

    try {
        await deleteCache(chave);
        res.json({ sucesso: true, mensagem: `Item "${chave}" removido do cache` });
    } catch (error) {
        console.error('Erro ao deletar item do cache:', error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// Rota para obter estatísticas do cache
app.get('/api/cache/stats', async (req, res) => {
    try {
        const stats = await obterEstatisticas();
        res.json({ sucesso: true, stats });
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// Rota para obter categorias disponíveis
app.get('/api/categorias', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT DISTINCT categoria FROM produtos ORDER BY categoria'
        );
        res.json({
            sucesso: true,
            dados: result.rows.map(row => row.categoria)
        });
    } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// Rota para inspecionar itens do cache (cachedump)
app.get('/api/cache/dump', async (req, res) => {
    try {
        const dumpData = await cachedump();
        res.json({ sucesso: true, dados: dumpData });
    } catch (error) {
        console.error('Erro ao fazer cachedump:', error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// Rota para obter valor de um contador
app.get('/api/contador/:nome', async (req, res) => {
    const nome = req.params.nome;
    const chaveCache = `contador:${nome}`;
    
    try {
        const valor = await getCache(chaveCache);
        res.json({ 
            sucesso: true, 
            contador: nome,
            valor: valor || 0 
        });
    } catch (error) {
        console.error('Erro ao buscar contador:', error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// Rota para incrementar um contador
app.post('/api/contador/:nome/incrementar', async (req, res) => {
    const nome = req.params.nome;
    const chaveCache = `contador:${nome}`;
    const quantidade = parseInt(req.body.quantidade) || 1;
    
    try {
        const novoValor = await incrementCache(chaveCache, quantidade);
        res.json({ 
            sucesso: true, 
            contador: nome,
            valor: novoValor,
            operacao: `+${quantidade}`
        });
    } catch (error) {
        console.error('Erro ao incrementar contador:', error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// Rota para decrementar um contador
app.post('/api/contador/:nome/decrementar', async (req, res) => {
    const nome = req.params.nome;
    const chaveCache = `contador:${nome}`;
    const quantidade = parseInt(req.body.quantidade) || 1;
    
    try {
        const novoValor = await decrementCache(chaveCache, quantidade);
        res.json({ 
            sucesso: true, 
            contador: nome,
            valor: novoValor,
            operacao: `-${quantidade}`
        });
    } catch (error) {
        console.error('Erro ao decrementar contador:', error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// Rota para resetar um contador
app.post('/api/contador/:nome/resetar', async (req, res) => {
    const nome = req.params.nome;
    const chaveCache = `contador:${nome}`;
    
    try {
        await setCache(chaveCache, 0, 0);
        res.json({ 
            sucesso: true, 
            contador: nome,
            valor: 0,
            operacao: 'reset'
        });
    } catch (error) {
        console.error('Erro ao resetar contador:', error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// ============= ENDPOINTS CONTADORES NO BANCO =============

// Rota para obter valor de um contador no banco
app.get('/api/contador-db/:nome', async (req, res) => {
    const nome = req.params.nome;
    const inicio = Date.now();
    
    try {
        const result = await pool.query(
            'SELECT valor FROM contadores WHERE nome = $1',
            [nome]
        );
        
        const tempo = Date.now() - inicio;
        
        if (result.rows.length > 0) {
            res.json({ 
                sucesso: true, 
                contador: nome,
                valor: parseInt(result.rows[0].valor),
                tempo: tempo
            });
        } else {
            // Se não existir, criar com valor 0
            await pool.query(
                'INSERT INTO contadores (nome, valor) VALUES ($1, 0) ON CONFLICT (nome) DO NOTHING',
                [nome]
            );
            res.json({ 
                sucesso: true, 
                contador: nome,
                valor: 0,
                tempo: tempo
            });
        }
    } catch (error) {
        console.error('Erro ao buscar contador no banco:', error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// Rota para incrementar um contador no banco
app.post('/api/contador-db/:nome/incrementar', async (req, res) => {
    const nome = req.params.nome;
    const quantidade = parseInt(req.body.quantidade) || 1;
    const inicio = Date.now();
    
    try {
        // Garantir que o contador existe
        await pool.query(
            'INSERT INTO contadores (nome, valor) VALUES ($1, 0) ON CONFLICT (nome) DO NOTHING',
            [nome]
        );
        
        // Incrementar
        const result = await pool.query(
            'UPDATE contadores SET valor = valor + $1, atualizado_em = CURRENT_TIMESTAMP WHERE nome = $2 RETURNING valor',
            [quantidade, nome]
        );
        
        const tempo = Date.now() - inicio;
        
        res.json({ 
            sucesso: true, 
            contador: nome,
            valor: parseInt(result.rows[0].valor),
            operacao: `+${quantidade}`,
            tempo: tempo
        });
    } catch (error) {
        console.error('Erro ao incrementar contador no banco:', error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// Rota para decrementar um contador no banco
app.post('/api/contador-db/:nome/decrementar', async (req, res) => {
    const nome = req.params.nome;
    const quantidade = parseInt(req.body.quantidade) || 1;
    const inicio = Date.now();
    
    try {
        // Garantir que o contador existe
        await pool.query(
            'INSERT INTO contadores (nome, valor) VALUES ($1, 0) ON CONFLICT (nome) DO NOTHING',
            [nome]
        );
        
        // Decrementar
        const result = await pool.query(
            'UPDATE contadores SET valor = valor - $1, atualizado_em = CURRENT_TIMESTAMP WHERE nome = $2 RETURNING valor',
            [quantidade, nome]
        );
        
        const tempo = Date.now() - inicio;
        
        res.json({ 
            sucesso: true, 
            contador: nome,
            valor: parseInt(result.rows[0].valor),
            operacao: `-${quantidade}`,
            tempo: tempo
        });
    } catch (error) {
        console.error('Erro ao decrementar contador no banco:', error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// Rota para resetar um contador no banco
app.post('/api/contador-db/:nome/resetar', async (req, res) => {
    const nome = req.params.nome;
    const inicio = Date.now();
    
    try {
        await pool.query(
            'INSERT INTO contadores (nome, valor) VALUES ($1, 0) ON CONFLICT (nome) DO UPDATE SET valor = 0, atualizado_em = CURRENT_TIMESTAMP',
            [nome]
        );
        
        const tempo = Date.now() - inicio;
        
        res.json({ 
            sucesso: true, 
            contador: nome,
            valor: 0,
            operacao: 'reset',
            tempo: tempo
        });
    } catch (error) {
        console.error('Erro ao resetar contador no banco:', error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// ============= FUNÇÕES AUXILIARES =============

function getCache(chave) {
    return new Promise((resolve) => {
        memcached.get(chave, (err, data) => {
            if (err) {
                console.error(`Erro ao ler cache "${chave}":`, err.message);
                resolve(null);
            } else {
                resolve(data);
            }
        });
    });
}

function setCache(chave, valor, ttl = 0) {
    return new Promise((resolve, reject) => {
        memcached.set(chave, valor, ttl, (err) => {
            if (err) {
                console.error(`Erro ao gravar cache "${chave}":`, err.message);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function deleteCache(chave) {
    return new Promise((resolve, reject) => {
        memcached.del(chave, (err) => {
            if (err) {
                console.error(`Erro ao deletar cache "${chave}":`, err.message);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function incrementCache(chave, quantidade = 1) {
    return new Promise((resolve, reject) => {
        memcached.incr(chave, quantidade, (err, result) => {
            if (err || result === false) {
                // Se a chave não existe, criar com o valor inicial
                memcached.set(chave, quantidade, 0, (setErr) => {
                    if (setErr) {
                        console.error(`Erro ao inicializar contador "${chave}":`, setErr.message);
                        reject(setErr);
                    } else {
                        resolve(quantidade);
                    }
                });
            } else {
                resolve(result);
            }
        });
    });
}

function decrementCache(chave, quantidade = 1) {
    return new Promise((resolve, reject) => {
        memcached.decr(chave, quantidade, (err, result) => {
            if (err || result === false) {
                // Se a chave não existe, criar com 0
                memcached.set(chave, 0, 0, (setErr) => {
                    if (setErr) {
                        console.error(`Erro ao inicializar contador "${chave}":`, setErr.message);
                        reject(setErr);
                    } else {
                        resolve(0);
                    }
                });
            } else {
                resolve(result);
            }
        });
    });
}

function limparTodoCache() {
    return new Promise((resolve, reject) => {
        memcached.flush((err) => {
            if (err) {
                console.error('Erro ao limpar cache:', err.message);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function obterEstatisticas() {
    return new Promise((resolve, reject) => {
        memcached.stats((err, stats) => {
            if (err) {
                reject(err);
            } else {
                // Transformar em array ordenado por servidor
                const statsArray = [];
                for (const servidor in stats) {
                    statsArray.push({
                        server: servidor,
                        ...stats[servidor]
                    });
                }
                // Ordenar por nome do servidor para manter ordem consistente
                statsArray.sort((a, b) => a.server.localeCompare(b.server));
                resolve(statsArray);
            }
        });
    });
}

async function cachedump() {
    try {
        // Obter lista de items de todos os servidores
        const itemsList = await new Promise((resolve, reject) => {
            memcached.items((err, result) => {
                if (err) reject(err);
                else resolve(result || []);
            });
        });

        if (itemsList.length === 0) {
            return [];
        }

        // Processar cada servidor sequencialmente
        const resultadoPorServidor = {};

        for (const itemSet of itemsList) {
            const servidor = itemSet.server;
            if (!servidor) continue;

            resultadoPorServidor[servidor] = { chaves: [] };

            // Obter IDs dos slabs (remove 'server' da lista)
            const slabKeys = Object.keys(itemSet).filter(key => key !== 'server');

            if (slabKeys.length === 0) continue;

            // Coletar todas as chaves de todos os slabs deste servidor
            const chavesDoServidor = [];

            for (const slabKey of slabKeys) {
                const slabId = Number(slabKey);
                const itemCount = itemSet[slabKey].number;

                try {

                    let cacheItems = await new Promise((resolve, reject) => {
                        memcached.cachedump(servidor, slabId, itemCount, (err, items) => {
                            if (err) reject(err);
                            else resolve(Array.isArray(items) ? [...items] : items);
                        });
                    });
                    if (cacheItems && typeof cacheItems === 'object' && cacheItems.key) {
                        cacheItems = [cacheItems];
                    }
                    if (cacheItems && Array.isArray(cacheItems)) {
                        for (const item of cacheItems) {
                            chavesDoServidor.push({
                                chave: item.key,
                                tamanho: item.b,
                                expiracao: item.s
                            });
                        }
                    }
                } catch (err) {
                    console.error(`Erro ao fazer cachedump de ${servidor} slab ${slabId}:`, err.message);
                }
            }

            // Buscar valores de todas as chaves coletadas
            for (const item of chavesDoServidor) {
                try {
                    const valor = await new Promise((resolve) => {
                        memcached.get(item.chave, (err, data) => {
                            if (err) resolve(null);
                            else resolve(data);
                        });
                    });
                    let valorPreview;
                    if (valor !== null && valor !== undefined) {
                        if (typeof valor === 'object') {
                            const jsonStr = JSON.stringify(valor);
                            valorPreview = jsonStr.substring(0, 100);
                            if (jsonStr.length > 100) valorPreview += '...';
                        } else {
                            const strValor = String(valor);
                            valorPreview = strValor.substring(0, 100);
                            if (strValor.length > 100) valorPreview += '...';
                        }

                    }
                    resultadoPorServidor[servidor].chaves.push({
                        chave: item.chave,
                        tamanho: item.tamanho,
                        expiracao: item.expiracao,
                        valor: valorPreview
                    });
                } catch (err) {
                    console.error(`Erro ao buscar valor da chave ${item.chave}:`, err.message);
                }
            }
        }

        // Converter para array ordenado por nome do servidor
        const resultadoArray = Object.keys(resultadoPorServidor)
            .sort()
            .map(servidor => ({
                servidor: servidor,
                chaves: resultadoPorServidor[servidor].chaves
            }));

        return resultadoArray;

    } catch (error) {
        console.error('Erro ao fazer cachedump:', error);
        throw error;
    }
}

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🌐 Servidor rodando em http://localhost:${PORT}`);
    console.log('📱 Acesse pelo navegador para usar a interface\n');
});
