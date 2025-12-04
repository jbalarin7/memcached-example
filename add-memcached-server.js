const { execSync } = require('child_process');

console.log(`\n🔧 Procurando próximo servidor disponível...\n`);

try {
    // 1. Listar todos os containers memcached existentes
    let memcachedContainers = [];
    try {
        const output = execSync('docker ps -a --filter "name=memcached" --format "{{.Names}}"', { encoding: 'utf8' });
        memcachedContainers = output.trim().split('\n').filter(name => name && name.startsWith('memcached'));
    } catch {
        // Nenhum container encontrado
    }

    // 2. Extrair números dos containers existentes
    const numeros = memcachedContainers
        .map(name => {
            const match = name.match(/^memcached(\d+)$/);
            return match ? parseInt(match[1]) : null;
        })
        .filter(num => num !== null);

    // 3. Determinar o próximo número
    const proximoNumero = numeros.length > 0 ? Math.max(...numeros) + 1 : 1;
    const novoServidor = `memcached${proximoNumero}`;

    console.log(`📋 Containers existentes: ${memcachedContainers.length > 0 ? memcachedContainers.join(', ') : 'nenhum'}`);
    console.log(`🎯 Próximo servidor: ${novoServidor}\n`);

    // 2. Obter a rede do docker-compose
    const network = 'memcached-example_app-network';

    // 3. Subir novo container memcached
    console.log(`🚀 Criando container ${novoServidor}...`);
    execSync(
        `docker run -d --name ${novoServidor} --network ${network} memcached:1.6-alpine memcached -m 64`,
        { stdio: 'inherit' }
    );

    // 4. Obter variável de ambiente atual do container app
    console.log('\n🔍 Obtendo servidores atuais...');
    const servidoresAtuais = execSync(
        'docker exec cache_demo_app printenv MEMCACHED_SERVERS',
        { encoding: 'utf8' }
    ).trim();

    // 5. Adicionar novo servidor
    const novosServidores = `${servidoresAtuais},${novoServidor}:11211`;
    
    console.log(`📝 Servidores atuais: ${servidoresAtuais}`);
    console.log(`📝 Novos servidores: ${novosServidores}`);

    // 6. Atualizar variável de ambiente do container app
    console.log(`\n🔄 Atualizando variável de ambiente no container...`);
    
    // Parar o container
    execSync('docker stop cache_demo_app', { stdio: 'inherit' });
    
    // Remover o container (mantém volumes)
    execSync('docker rm cache_demo_app', { stdio: 'inherit' });
    
    // Recriar com a nova variável de ambiente
    execSync(
        'docker-compose up -d app',
        { 
            stdio: 'inherit',
            env: {
                ...process.env,
                MEMCACHED_SERVERS: novosServidores
            }
        }
    );

    // 8. Aguardar alguns segundos
    console.log('\n⏳ Aguardando aplicação reiniciar...');
    const waitCommand = process.platform === 'win32' ? 'timeout /t 5 /nobreak' : 'sleep 5';
    try {
        execSync(waitCommand, { stdio: 'inherit' });
    } catch {
        // Timeout pode dar erro no Windows se Ctrl+C, mas não importa
    }

    console.log(`\n✅ Servidor ${novoServidor} adicionado com sucesso!`);
    console.log(`\n📊 Total de servidores: ${proximoNumero}`);
    console.log(`\n🔍 Verifique os servidores:`);
    console.log(`   docker ps | findstr memcached`);
    console.log(`\n📈 Acesse a interface:`);
    console.log(`   http://localhost:3000`);
    console.log(`\n💡 Dica: Clique em "📊 Estatísticas do Cache" para ver o novo servidor!`);
    console.log(`\n⚠️  IMPORTANTE: Este servidor existe fora do docker-compose.`);
    console.log(`   Use 'npm run docker:clean' para remover todos os containers.\n`);
    
} catch (error) {
    console.error('\n❌ Erro ao adicionar servidor:', error.message);
    console.error('\n💡 Certifique-se de que o docker-compose está rodando:');
    console.error('   npm run docker:up\n');
    process.exit(1);
}
