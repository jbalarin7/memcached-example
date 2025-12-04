const { execSync } = require('child_process');

console.log('\n🧹 Limpando TODOS os containers do projeto...\n');

try {
    // 1. Parar e remover containers do docker-compose
    console.log('📦 Parando containers do docker-compose...');
    try {
        execSync('docker-compose down', { stdio: 'inherit' });
    } catch (error) {
        console.log('⚠️  Docker-compose não está rodando ou já foi parado');
    }

    // 2. Listar todos os containers memcached (incluindo os criados manualmente)
    console.log('\n🔍 Procurando containers memcached adicionais...');
    let memcachedContainers = [];
    
    try {
        const output = execSync('docker ps -a --filter "name=memcached" --format "{{.Names}}"', { encoding: 'utf8' });
        memcachedContainers = output.trim().split('\n').filter(name => name);
    } catch {
        // Nenhum container encontrado
    }

    if (memcachedContainers.length > 0) {
        console.log(`\n🗑️  Removendo ${memcachedContainers.length} container(s) memcached adicional(is)...`);
        
        for (const container of memcachedContainers) {
            try {
                console.log(`   Parando ${container}...`);
                execSync(`docker stop ${container}`, { stdio: 'ignore' });
                
                console.log(`   Removendo ${container}...`);
                execSync(`docker rm ${container}`, { stdio: 'ignore' });
                
                console.log(`   ✅ ${container} removido`);
            } catch (error) {
                console.log(`   ⚠️  Erro ao remover ${container}`);
            }
        }
    } else {
        console.log('✅ Nenhum container memcached adicional encontrado');
    }

    // 3. Verificar se ainda há containers rodando
    console.log('\n🔍 Verificando containers restantes...');
    try {
        const remainingContainers = execSync(
            'docker ps --filter "name=memcached" --filter "name=cache_demo_app" --filter "name=postgres_db" --format "{{.Names}}"',
            { encoding: 'utf8' }
        ).trim();
        
        if (remainingContainers) {
            console.log('⚠️  Containers ainda rodando:');
            console.log(remainingContainers);
        } else {
            console.log('✅ Todos os containers foram removidos');
        }
    } catch {
        console.log('✅ Todos os containers foram removidos');
    }

    console.log('\n✅ Limpeza concluída!');
    console.log('\n💡 Para subir novamente:');
    console.log('   npm run docker:up\n');

} catch (error) {
    console.error('\n❌ Erro ao limpar containers:', error.message);
    process.exit(1);
}
