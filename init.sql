-- Criar tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    estoque INTEGER DEFAULT 0,
    categoria VARCHAR(50),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir dados de exemplo - Produtos
INSERT INTO produtos (nome, descricao, preco, estoque, categoria) VALUES
('Notebook Dell XPS 13', 'Notebook ultrafino com processador Intel i7', 6999.99, 15, 'Eletrônicos'),
('Mouse Logitech MX Master', 'Mouse ergonômico sem fio', 499.90, 50, 'Periféricos'),
('Teclado Mecânico RGB', 'Teclado gamer com iluminação RGB', 599.00, 30, 'Periféricos'),
('Monitor LG 27" 4K', 'Monitor 4K IPS 27 polegadas', 1899.00, 20, 'Eletrônicos'),
('Webcam Logitech C920', 'Webcam Full HD 1080p', 449.90, 40, 'Periféricos'),
('Headset HyperX Cloud', 'Headset gamer com microfone', 399.00, 35, 'Áudio'),
('SSD Samsung 1TB', 'SSD NVMe M.2 1TB', 699.00, 60, 'Armazenamento'),
('Cadeira Gamer DT3', 'Cadeira ergonômica para escritório', 1299.00, 10, 'Móveis'),
('Mousepad Gamer XL', 'Mousepad speed 90x40cm', 89.90, 100, 'Periféricos'),
('Hub USB-C 7 em 1', 'Hub USB-C com HDMI e USB 3.0', 249.00, 45, 'Acessórios'),
('Microfone Blue Yeti', 'Microfone condensador USB', 799.00, 25, 'Áudio'),
('Switch TP-Link 8 Portas', 'Switch Gigabit 8 portas', 159.90, 80, 'Rede'),
('Impressora HP LaserJet', 'Impressora laser monocromática', 899.00, 12, 'Periféricos'),
('Mouse Pad RGB', 'Mouse pad com iluminação RGB', 129.90, 70, 'Periféricos'),
('Fonte Corsair 750W', 'Fonte modular 80 Plus Gold', 699.00, 30, 'Hardware');

-- Criar índices para melhor performance
CREATE INDEX idx_produtos_categoria ON produtos(categoria);
CREATE INDEX idx_produtos_preco ON produtos(preco);

-- Criar tabela de contadores (para comparação de performance)
CREATE TABLE IF NOT EXISTS contadores (
    nome VARCHAR(100) PRIMARY KEY,
    valor BIGINT NOT NULL DEFAULT 0,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir contadores de exemplo
INSERT INTO contadores (nome, valor) VALUES
('visitas', 0),
('downloads', 0),
('likes', 0)
ON CONFLICT (nome) DO NOTHING;
