const { execSync } = require('child_process');

// Obter nome do servidor da linha de comando
const servidorRemover = process.argv[2];

if (!servidorRemover) {
    console.error('❌ Erro: Informe o nome do servidor para remover!');
    console.log('Uso: npm run remove-server <nome>');
    console.log('Exemplo: npm run remove-server memcached4');
    process.exit(1);
}

console.log(`\n🗑️  Removendo servidor: ${servidorRemover}\n`);

try {
    // 1. Verificar se o container existe
    try {
        execSync(`docker inspect ${servidorRemover}`, { stdio: 'ignore' });
    } catch {
        console.error(`❌ Erro: Container ${servidorRemover} não existe!`);
        process.exit(1);
    }

    // 2. Verificar se é um dos servidores iniciais do docker-compose
    if (['memcached1', 'memcached2', 'memcached3'].includes(servidorRemover)) {
        console.error(`❌ Erro: Não é possível remover ${servidorRemover}!`);
        console.error('Este servidor faz parte da configuração inicial do docker-compose.');
        console.error('Use "npm run docker:down" para parar todos os servidores.');
        process.exit(1);
    }

    // 3. Obter variável de ambiente atual do container app
    console.log('🔍 Obtendo servidores atuais...');
    const servidoresAtuais = execSync(
        'docker exec cache_demo_app printenv MEMCACHED_SERVERS',
        { encoding: 'utf8' }
    ).trim();

    // 4. Remover servidor da lista
    const listaServidores = servidoresAtuais.split(',');
    const novosServidores = listaServidores
        .filter(s => !s.includes(servidorRemover))
        .join(',');

    if (servidoresAtuais === novosServidores) {
        console.log(`⚠️  ${servidorRemover} não está na lista de servidores da aplicação`);
    } else {
        console.log(`📝 Servidores atuais: ${servidoresAtuais}`);
        console.log(`📝 Novos servidores: ${novosServidores}`);
    }

    // 5. Parar e remover o container
    console.log(`\n⏸️  Parando container ${servidorRemover}...`);
    execSync(`docker stop ${servidorRemover}`, { stdio: 'inherit' });

    console.log(`🗑️  Removendo container ${servidorRemover}...`);
    execSync(`docker rm ${servidorRemover}`, { stdio: 'inherit' });

    // 6. Se o servidor estava na lista, atualizar aplicação
    if (servidoresAtuais !== novosServidores && novosServidores) {
        console.log(`\n🔄 Atualizando aplicação com novos servidores...`);

        // Parar o container do app
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

        // Aguardar alguns segundos
        console.log('\n⏳ Aguardando aplicação reiniciar...');
        const waitCommand = process.platform === 'win32' ? 'timeout /t 5 /nobreak' : 'sleep 5';
        try {
            execSync(waitCommand, { stdio: 'inherit' });
        } catch {
            // Timeout pode dar erro no Windows se Ctrl+C, mas não importa
        }
    }

    console.log(`\n✅ Servidor ${servidorRemover} removido com sucesso!`);
    console.log(`\n📊 Verifique os servidores restantes:`);
    console.log(`   docker ps | findstr memcached`);
    console.log(`\n📈 Acesse a interface:`);
    console.log(`   http://localhost:3000`);
    console.log(`\n💡 Dica: Clique em "📊 Estatísticas do Cache" para ver os servidores ativos!\n`);

} catch (error) {
    console.error('\n❌ Erro ao remover servidor:', error.message);
    console.error('\n💡 Certifique-se de que o docker-compose está rodando:');
    console.error('   npm run docker:up\n');
    process.exit(1);
}
