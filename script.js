// ============================================================================
// DICIONÁRIO DE DADOS INTERATIVO — TRANS AM WORLDWIDE (TAW-ERP)
// Governança de Dados: DAMA-DMBOK v2 & COBIT 2019
// ============================================================================

const RAW_DDL_SCRIPT = "-- ============================================================================\n-- PROJETO DE BANCO DE DADOS: TRANS AM WORLDWIDE\n-- SGBD: MySQL 8.0+\n-- ARQUIVO: 03_ddl_trans_am_worldwide.sql (Criação de Schema, Tabelas, Índices,\n--          Views e Triggers de Regras de Negócio)\n-- ============================================================================\n\nDROP DATABASE IF EXISTS trans_am_worldwide;\nCREATE DATABASE trans_am_worldwide\n    CHARACTER SET utf8mb4\n    COLLATE utf8mb4_unicode_ci;\n\nUSE trans_am_worldwide;\n\n-- ============================================================================\n-- 1. CRIAÇÃO DAS TABELAS (NORMALIZADAS ATÉ 3FN)\n-- ============================================================================\n\n-- Tabela: cliente (RF01, PR03)\nCREATE TABLE cliente (\n    id_cliente INT AUTO_INCREMENT PRIMARY KEY,\n    nome_razao VARCHAR(150) NOT NULL,\n    tipo_pessoa ENUM('PF', 'PJ') NOT NULL DEFAULT 'PF',\n    documento_fiscal VARCHAR(30) NOT NULL,\n    email VARCHAR(120) NOT NULL,\n    telefone VARCHAR(25) NOT NULL,\n    vip BOOLEAN NOT NULL DEFAULT FALSE,\n    ativo BOOLEAN NOT NULL DEFAULT TRUE,\n    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    CONSTRAINT uq_cliente_documento UNIQUE (documento_fiscal),\n    CONSTRAINT uq_cliente_email UNIQUE (email)\n) ENGINE=InnoDB;\n\n-- Tabela: endereco (RF02)\nCREATE TABLE endereco (\n    id_endereco INT AUTO_INCREMENT PRIMARY KEY,\n    id_cliente INT NOT NULL,\n    logradouro VARCHAR(150) NOT NULL,\n    numero VARCHAR(20) NOT NULL,\n    complemento VARCHAR(80) NULL,\n    cidade VARCHAR(80) NOT NULL,\n    estado VARCHAR(50) NOT NULL,\n    pais VARCHAR(60) NOT NULL DEFAULT 'Estados Unidos',\n    cep VARCHAR(20) NOT NULL,\n    principal BOOLEAN NOT NULL DEFAULT FALSE,\n    CONSTRAINT fk_endereco_cliente FOREIGN KEY (id_cliente)\n        REFERENCES cliente (id_cliente)\n        ON DELETE RESTRICT ON UPDATE CASCADE\n) ENGINE=InnoDB;\n\n-- Tabela: usuario (RF12)\nCREATE TABLE usuario (\n    id_usuario INT AUTO_INCREMENT PRIMARY KEY,\n    nome VARCHAR(120) NOT NULL,\n    login VARCHAR(60) NOT NULL,\n    senha_hash VARCHAR(255) NOT NULL,\n    perfil ENUM('CONSULTOR', 'ENGENHEIRO', 'FINANCEIRO', 'GERENTE', 'ADMINISTRADOR') NOT NULL,\n    ativo BOOLEAN NOT NULL DEFAULT TRUE,\n    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    CONSTRAINT uq_usuario_login UNIQUE (login)\n) ENGINE=InnoDB;\n\n-- Tabela: modelo_edicao (RF03, RN06)\nCREATE TABLE modelo_edicao (\n    id_modelo INT AUTO_INCREMENT PRIMARY KEY,\n    nome_modelo VARCHAR(100) NOT NULL,\n    ano_edicao INT NOT NULL,\n    motorizacao VARCHAR(100) NOT NULL,\n    potencia_hp INT NOT NULL,\n    preco_base DECIMAL(12,2) NOT NULL,\n    limite_unidades INT NOT NULL,\n    ativo BOOLEAN NOT NULL DEFAULT TRUE,\n    CONSTRAINT uq_modelo_ano UNIQUE (nome_modelo, ano_edicao),\n    CONSTRAINT chk_modelo_potencia CHECK (potencia_hp > 0),\n    CONSTRAINT chk_modelo_preco CHECK (preco_base >= 0),\n    CONSTRAINT chk_modelo_limite CHECK (limite_unidades > 0)\n) ENGINE=InnoDB;\n\n-- Tabela: veiculo (RF04, RN06, RN07, PR04)\nCREATE TABLE veiculo (\n    id_veiculo INT AUTO_INCREMENT PRIMARY KEY,\n    id_modelo INT NOT NULL,\n    vin CHAR(17) NOT NULL,\n    numero_serie_edicao INT NOT NULL,\n    ano_fabricacao INT NOT NULL,\n    cor_externa VARCHAR(60) NOT NULL,\n    cor_interna VARCHAR(60) NOT NULL,\n    valor_veiculo DECIMAL(12,2) NOT NULL,\n    status_veiculo ENUM('DISPONIVEL', 'RESERVADO', 'EM_CUSTOMIZACAO', 'VENDIDO', 'ENTREGUE') NOT NULL DEFAULT 'DISPONIVEL',\n    data_entrada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    CONSTRAINT uq_veiculo_vin UNIQUE (vin),\n    CONSTRAINT uq_veiculo_serie_modelo UNIQUE (id_modelo, numero_serie_edicao),\n    CONSTRAINT chk_veiculo_serie_pos CHECK (numero_serie_edicao > 0),\n    CONSTRAINT chk_veiculo_valor CHECK (valor_veiculo >= 0),\n    CONSTRAINT fk_veiculo_modelo FOREIGN KEY (id_modelo)\n        REFERENCES modelo_edicao (id_modelo)\n        ON DELETE RESTRICT ON UPDATE CASCADE\n) ENGINE=InnoDB;\n\n-- Tabela: categoria (RF05)\nCREATE TABLE categoria (\n    id_categoria INT AUTO_INCREMENT PRIMARY KEY,\n    nome VARCHAR(80) NOT NULL,\n    descricao VARCHAR(255) NULL,\n    CONSTRAINT uq_categoria_nome UNIQUE (nome)\n) ENGINE=InnoDB;\n\n-- Tabela: produto (RF05, RF06, RN04)\nCREATE TABLE produto (\n    id_produto INT AUTO_INCREMENT PRIMARY KEY,\n    id_categoria INT NOT NULL,\n    sku VARCHAR(40) NOT NULL,\n    descricao VARCHAR(150) NOT NULL,\n    preco_tabela DECIMAL(12,2) NOT NULL,\n    saldo_estoque INT NOT NULL DEFAULT 0,\n    estoque_minimo INT NOT NULL DEFAULT 2,\n    ativo BOOLEAN NOT NULL DEFAULT TRUE,\n    CONSTRAINT uq_produto_sku UNIQUE (sku),\n    CONSTRAINT chk_produto_preco CHECK (preco_tabela >= 0),\n    CONSTRAINT chk_produto_estoque CHECK (saldo_estoque >= 0),\n    CONSTRAINT chk_produto_est_min CHECK (estoque_minimo >= 0),\n    CONSTRAINT fk_produto_categoria FOREIGN KEY (id_categoria)\n        REFERENCES categoria (id_categoria)\n        ON DELETE RESTRICT ON UPDATE CASCADE\n) ENGINE=InnoDB;\n\n-- Tabela: pedido (RF07, RF10, RN01, RN02, RN03, RN05, PR01, PR02)\nCREATE TABLE pedido (\n    id_pedido INT AUTO_INCREMENT PRIMARY KEY,\n    id_cliente INT NOT NULL,\n    id_usuario INT NOT NULL,\n    id_veiculo INT NULL,\n    data_pedido DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    situacao ENUM('RASCUNHO', 'FINALIZADO', 'EM_PRODUCAO', 'CONCLUIDO', 'CANCELADO') NOT NULL DEFAULT 'RASCUNHO',\n    forma_pagamento ENUM('TRANSFERENCIA_BANCARIA', 'FINANCIAMENTO', 'CARTAO_CREDITO', 'ESCROW_INTERNACIONAL') NOT NULL,\n    valor_veiculo_venda DECIMAL(12,2) NOT NULL DEFAULT 0.00,\n    desconto DECIMAL(12,2) NOT NULL DEFAULT 0.00,\n    valor_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,\n    data_cancelamento DATETIME NULL,\n    motivo_cancelamento VARCHAR(255) NULL,\n    CONSTRAINT chk_pedido_valor_veic CHECK (valor_veiculo_venda >= 0),\n    CONSTRAINT chk_pedido_desconto CHECK (desconto >= 0),\n    CONSTRAINT chk_pedido_total CHECK (valor_total >= 0),\n    CONSTRAINT fk_pedido_cliente FOREIGN KEY (id_cliente)\n        REFERENCES cliente (id_cliente)\n        ON DELETE RESTRICT ON UPDATE CASCADE,\n    CONSTRAINT fk_pedido_usuario FOREIGN KEY (id_usuario)\n        REFERENCES usuario (id_usuario)\n        ON DELETE RESTRICT ON UPDATE CASCADE,\n    CONSTRAINT fk_pedido_veiculo FOREIGN KEY (id_veiculo)\n        REFERENCES veiculo (id_veiculo)\n        ON DELETE RESTRICT ON UPDATE CASCADE\n) ENGINE=InnoDB;\n\n-- Tabela: item_pedido (RF07, RN03, RN04, RN05)\nCREATE TABLE item_pedido (\n    id_item INT AUTO_INCREMENT PRIMARY KEY,\n    id_pedido INT NOT NULL,\n    id_produto INT NOT NULL,\n    quantidade INT NOT NULL,\n    preco_unitario_venda DECIMAL(12,2) NOT NULL,\n    CONSTRAINT chk_item_quantidade CHECK (quantidade > 0),\n    CONSTRAINT chk_item_preco CHECK (preco_unitario_venda >= 0),\n    CONSTRAINT fk_item_pedido FOREIGN KEY (id_pedido)\n        REFERENCES pedido (id_pedido)\n        ON DELETE RESTRICT ON UPDATE CASCADE,\n    CONSTRAINT fk_item_produto FOREIGN KEY (id_produto)\n        REFERENCES produto (id_produto)\n        ON DELETE RESTRICT ON UPDATE CASCADE\n) ENGINE=InnoDB;\n\n-- Tabela: ordem_customizacao (RF08, PR04)\nCREATE TABLE ordem_customizacao (\n    id_ordem INT AUTO_INCREMENT PRIMARY KEY,\n    id_veiculo INT NOT NULL,\n    id_pedido INT NOT NULL,\n    id_engenheiro INT NOT NULL,\n    etapa_atual ENUM('DESMONTAGEM', 'FUNILARIA_PINTURA', 'PREPARACAO_MOTOR', 'ACABAMENTO_INTERNO', 'TESTES_DINAMOMETRO', 'CONCLUIDO') NOT NULL DEFAULT 'DESMONTAGEM',\n    data_inicio DATE NOT NULL,\n    data_prevista_entrega DATE NOT NULL,\n    data_conclusao DATE NULL,\n    observacoes_tecnicas TEXT NULL,\n    CONSTRAINT fk_ordem_veiculo FOREIGN KEY (id_veiculo)\n        REFERENCES veiculo (id_veiculo)\n        ON DELETE RESTRICT ON UPDATE CASCADE,\n    CONSTRAINT fk_ordem_pedido FOREIGN KEY (id_pedido)\n        REFERENCES pedido (id_pedido)\n        ON DELETE RESTRICT ON UPDATE CASCADE,\n    CONSTRAINT fk_ordem_engenheiro FOREIGN KEY (id_engenheiro)\n        REFERENCES usuario (id_usuario)\n        ON DELETE RESTRICT ON UPDATE CASCADE\n) ENGINE=InnoDB;\n\n-- Tabela: pagamento (RF09, RN08, PR01, PR02)\nCREATE TABLE pagamento (\n    id_pagamento INT AUTO_INCREMENT PRIMARY KEY,\n    id_pedido INT NOT NULL,\n    data_pagamento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    valor_pago DECIMAL(12,2) NOT NULL,\n    tipo_pagamento ENUM('SINAL_RESERVA', 'PARCELA_INTERMEDIARIA', 'QUITACAO_FINAL') NOT NULL,\n    metodo_pagamento ENUM('TRANSFERENCIA_BANCARIA', 'FINANCIAMENTO', 'CARTAO_CREDITO', 'ESCROW_INTERNACIONAL') NOT NULL,\n    status_pagamento ENUM('PENDENTE', 'CONFIRMADO', 'ESTORNADO') NOT NULL DEFAULT 'CONFIRMADO',\n    CONSTRAINT chk_pagamento_valor CHECK (valor_pago > 0),\n    CONSTRAINT fk_pagamento_pedido FOREIGN KEY (id_pedido)\n        REFERENCES pedido (id_pedido)\n        ON DELETE RESTRICT ON UPDATE CASCADE\n) ENGINE=InnoDB;\n\n-- Tabela: log_auditoria (RF12, RNF01)\nCREATE TABLE log_auditoria (\n    id_log INT AUTO_INCREMENT PRIMARY KEY,\n    id_usuario INT NULL,\n    tabela_afetada VARCHAR(60) NOT NULL,\n    id_registro_afetado INT NOT NULL,\n    operacao VARCHAR(30) NOT NULL,\n    data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    detalhes TEXT NOT NULL,\n    CONSTRAINT fk_log_usuario FOREIGN KEY (id_usuario)\n        REFERENCES usuario (id_usuario)\n        ON DELETE SET NULL ON UPDATE CASCADE\n) ENGINE=InnoDB;\n\n-- ============================================================================\n-- 2. ÍNDICES DE DESEMPENHO (RNF02, Seção 6.3)\n-- ============================================================================\nCREATE INDEX idx_pedido_data ON pedido (data_pedido);\nCREATE INDEX idx_pedido_cliente ON pedido (id_cliente);\nCREATE INDEX idx_pedido_usuario ON pedido (id_usuario);\nCREATE INDEX idx_pedido_situacao ON pedido (situacao);\nCREATE INDEX idx_veiculo_status ON veiculo (status_veiculo);\nCREATE INDEX idx_ordem_etapa ON ordem_customizacao (etapa_atual);\n\n-- ============================================================================\n-- 3. GATILHOS (TRIGGERS) PARA REGRAS DE NEGÓCIO E AUDITORIA\n-- ============================================================================\nDELIMITER //\n\n-- RN06: Validar limite de unidades da edição limitada antes de inserir veículo\nCREATE TRIGGER trg_veiculo_before_insert\nBEFORE INSERT ON veiculo\nFOR EACH ROW\nBEGIN\n    DECLARE v_limite INT;\n    SELECT limite_unidades INTO v_limite\n    FROM modelo_edicao\n    WHERE id_modelo = NEW.id_modelo;\n\n    IF NEW.numero_serie_edicao > v_limite THEN\n        SIGNAL SQLSTATE '45000'\n        SET MESSAGE_TEXT = 'Erro RN06: Numero de serie excede o limite de unidades da edicao limitada.';\n    END IF;\nEND //\n\n-- RN03 & RN07: Ao criar pedido com veículo, validar disponibilidade e congelar valor do veículo\nCREATE TRIGGER trg_pedido_before_insert\nBEFORE INSERT ON pedido\nFOR EACH ROW\nBEGIN\n    DECLARE v_status VARCHAR(30);\n    DECLARE v_preco DECIMAL(12,2);\n\n    IF NEW.id_veiculo IS NOT NULL THEN\n        SELECT status_veiculo, valor_veiculo INTO v_status, v_preco\n        FROM veiculo\n        WHERE id_veiculo = NEW.id_veiculo;\n\n        IF v_status IN ('VENDIDO', 'RESERVADO', 'ENTREGUE') THEN\n            SIGNAL SQLSTATE '45000'\n            SET MESSAGE_TEXT = 'Erro RN07: O veiculo (VIN) selecionado ja esta reservado ou vendido.';\n        END IF;\n\n        IF NEW.valor_veiculo_venda = 0.00 THEN\n            SET NEW.valor_veiculo_venda = v_preco;\n        END IF;\n    END IF;\n\n    SET NEW.valor_total = GREATEST(0, NEW.valor_veiculo_venda - NEW.desconto);\nEND //\n\n-- RN07: Reservar veículo após inserção do pedido\nCREATE TRIGGER trg_pedido_after_insert\nAFTER INSERT ON pedido\nFOR EACH ROW\nBEGIN\n    IF NEW.id_veiculo IS NOT NULL AND NEW.situacao <> 'CANCELADO' THEN\n        UPDATE veiculo\n        SET status_veiculo = IF(NEW.situacao = 'FINALIZADO', 'VENDIDO', 'RESERVADO')\n        WHERE id_veiculo = NEW.id_veiculo;\n    END IF;\nEND //\n\n-- RN01, RN05 & RN07: Validar composição mínima ao finalizar pedido e recalcular total\nCREATE TRIGGER trg_pedido_before_update\nBEFORE UPDATE ON pedido\nFOR EACH ROW\nBEGIN\n    DECLARE v_qtd_itens INT DEFAULT 0;\n    DECLARE v_soma_itens DECIMAL(12,2) DEFAULT 0.00;\n\n    SELECT COUNT(*), IFNULL(SUM(quantidade * preco_unitario_venda), 0.00)\n    INTO v_qtd_itens, v_soma_itens\n    FROM item_pedido\n    WHERE id_pedido = NEW.id_pedido;\n\n    IF NEW.situacao = 'FINALIZADO' AND OLD.situacao <> 'FINALIZADO' THEN\n        IF NEW.id_veiculo IS NULL AND v_qtd_itens = 0 THEN\n            SIGNAL SQLSTATE '45000'\n            SET MESSAGE_TEXT = 'Erro RN01: Pedido nao pode ser finalizado sem veiculo ou itens de pecas.';\n        END IF;\n    END IF;\n\n    SET NEW.valor_total = GREATEST(0, NEW.valor_veiculo_venda + v_soma_itens - NEW.desconto);\n\n    IF NEW.situacao = 'CANCELADO' AND OLD.situacao <> 'CANCELADO' AND NEW.data_cancelamento IS NULL THEN\n        SET NEW.data_cancelamento = CURRENT_TIMESTAMP;\n    END IF;\nEND //\n\n-- RN07 & RNF01: Atualizar status do veículo e gravar auditoria na alteração de pedido\nCREATE TRIGGER trg_pedido_after_update\nAFTER UPDATE ON pedido\nFOR EACH ROW\nBEGIN\n    IF NEW.id_veiculo IS NOT NULL THEN\n        IF NEW.situacao = 'FINALIZADO' AND OLD.situacao <> 'FINALIZADO' THEN\n            UPDATE veiculo SET status_veiculo = 'VENDIDO' WHERE id_veiculo = NEW.id_veiculo;\n        ELSEIF NEW.situacao = 'CANCELADO' AND OLD.situacao <> 'CANCELADO' THEN\n            UPDATE veiculo SET status_veiculo = 'DISPONIVEL' WHERE id_veiculo = NEW.id_veiculo;\n        END IF;\n    END IF;\n\n    IF NEW.situacao <> OLD.situacao THEN\n        INSERT INTO log_auditoria (id_usuario, tabela_afetada, id_registro_afetado, operacao, detalhes)\n        VALUES (\n            NEW.id_usuario,\n            'pedido',\n            NEW.id_pedido,\n            'UPDATE_SITUACAO',\n            CONCAT('Situacao alterada de ', OLD.situacao, ' para ', NEW.situacao, '. Motivo: ', IFNULL(NEW.motivo_cancelamento, 'N/A'))\n        );\n    END IF;\nEND //\n\n-- RN03 & RN04: Validar estoque, congelar preço histórico e baixar saldo ao inserir item_pedido\nCREATE TRIGGER trg_item_pedido_before_insert\nBEFORE INSERT ON item_pedido\nFOR EACH ROW\nBEGIN\n    DECLARE v_saldo INT;\n    DECLARE v_preco DECIMAL(12,2);\n    DECLARE v_ativo BOOLEAN;\n\n    SELECT saldo_estoque, preco_tabela, ativo\n    INTO v_saldo, v_preco, v_ativo\n    FROM produto\n    WHERE id_produto = NEW.id_produto;\n\n    IF v_ativo = FALSE THEN\n        SIGNAL SQLSTATE '45000'\n        SET MESSAGE_TEXT = 'Erro RF05: Produto inativo nao pode ser incluido em pedidos.';\n    END IF;\n\n    IF NEW.quantidade > v_saldo THEN\n        SIGNAL SQLSTATE '45000'\n        SET MESSAGE_TEXT = 'Erro RN04: Quantidade solicitada excede o saldo disponivel em estoque.';\n    END IF;\n\n    IF NEW.preco_unitario_venda = 0.00 THEN\n        SET NEW.preco_unitario_venda = v_preco;\n    END IF;\n\n    UPDATE produto\n    SET saldo_estoque = saldo_estoque - NEW.quantidade\n    WHERE id_produto = NEW.id_produto;\nEND //\n\n-- RN05: Recalcular valor_total do pedido após inserção de item\nCREATE TRIGGER trg_item_pedido_after_insert\nAFTER INSERT ON item_pedido\nFOR EACH ROW\nBEGIN\n    UPDATE pedido p\n    SET p.valor_total = GREATEST(0,\n        p.valor_veiculo_venda +\n        (SELECT IFNULL(SUM(quantidade * preco_unitario_venda), 0.00) FROM item_pedido WHERE id_pedido = NEW.id_pedido) -\n        p.desconto\n    )\n    WHERE p.id_pedido = NEW.id_pedido;\nEND //\n\n-- RN08: Validar limite de pagamentos confirmados por pedido\nCREATE TRIGGER trg_pagamento_before_insert\nBEFORE INSERT ON pagamento\nFOR EACH ROW\nBEGIN\n    DECLARE v_total_pedido DECIMAL(12,2);\n    DECLARE v_total_pago DECIMAL(12,2);\n\n    SELECT valor_total INTO v_total_pedido\n    FROM pedido\n    WHERE id_pedido = NEW.id_pedido;\n\n    SELECT IFNULL(SUM(valor_pago), 0.00) INTO v_total_pago\n    FROM pagamento\n    WHERE id_pedido = NEW.id_pedido AND status_pagamento = 'CONFIRMADO';\n\n    IF NEW.status_pagamento = 'CONFIRMADO' AND (v_total_pago + NEW.valor_pago) > v_total_pedido THEN\n        SIGNAL SQLSTATE '45000'\n        SET MESSAGE_TEXT = 'Erro RN08: A soma dos pagamentos confirmados excede o valor total do pedido.';\n    END IF;\nEND //\n\n-- RNF01: Auditoria de alteração de preço de tabela no catálogo de produtos\nCREATE TRIGGER trg_produto_after_update\nAFTER UPDATE ON produto\nFOR EACH ROW\nBEGIN\n    IF NEW.preco_tabela <> OLD.preco_tabela THEN\n        INSERT INTO log_auditoria (id_usuario, tabela_afetada, id_registro_afetado, operacao, detalhes)\n        VALUES (\n            NULL,\n            'produto',\n            NEW.id_produto,\n            'ALTERACAO_PRECO',\n            CONCAT('SKU ', NEW.sku, ': preco_tabela alterado de ', OLD.preco_tabela, ' para ', NEW.preco_tabela)\n        );\n    END IF;\nEND //\n\nDELIMITER ;\n\n-- ============================================================================\n-- 4. VISÃO (VIEW) CONSOLIDADA DE FATURAMENTO E STATUS FINANCEIRO\n-- ============================================================================\nCREATE VIEW vw_resumo_financeiro_pedidos AS\nSELECT\n    p.id_pedido,\n    p.data_pedido,\n    c.nome_razao AS cliente,\n    c.vip AS cliente_vip,\n    u.nome AS consultor_responsavel,\n    m.nome_modelo AS modelo_veiculo,\n    v.vin AS chassi_vin,\n    v.numero_serie_edicao,\n    p.situacao AS situacao_pedido,\n    p.valor_veiculo_venda,\n    (p.valor_total + p.desconto - p.valor_veiculo_venda) AS total_pecas_upgrades,\n    p.desconto,\n    p.valor_total AS valor_liquido_pedido,\n    IFNULL(SUM(CASE WHEN pg.status_pagamento = 'CONFIRMADO' THEN pg.valor_pago ELSE 0 END), 0.00) AS total_pago_confirmado,\n    (p.valor_total - IFNULL(SUM(CASE WHEN pg.status_pagamento = 'CONFIRMADO' THEN pg.valor_pago ELSE 0 END), 0.00)) AS saldo_a_receber\nFROM pedido p\nINNER JOIN cliente c ON p.id_cliente = c.id_cliente\nINNER JOIN usuario u ON p.id_usuario = u.id_usuario\nLEFT JOIN veiculo v ON p.id_veiculo = v.id_veiculo\nLEFT JOIN modelo_edicao m ON v.id_modelo = m.id_modelo\nLEFT JOIN pagamento pg ON p.id_pedido = pg.id_pedido\nGROUP BY\n    p.id_pedido, p.data_pedido, c.nome_razao, c.vip, u.nome,\n    m.nome_modelo, v.vin, v.numero_serie_edicao, p.situacao,\n    p.valor_veiculo_venda, p.desconto, p.valor_total;";

const SCHEMA_DATA = [
  {
    name: "cliente",
    type: "TABLE",
    domain: "Comercial",
    rfs: ["RF01", "RF02", "RF07", "RF11"],
    rules: ["RN02", "PR03"],
    owner: "Diretoria Comercial / Vendas",
    steward: "Consultor Sênior & Compliance LGPD",
    retention: "5 anos (Receita Federal) / 7 anos (IRS) — Exclusão Lógica (ativo=FALSE)",
    description: "Cadastro central de colecionadores individuais (PF) e concessionárias autorizadas (PJ) que adquirem veículos sob encomenda ou peças de performance.",
    columns: [
      { name: "id_cliente", dataType: "INT", keys: ["PK", "NN"], defaultVal: "AUTO_INCREMENT", description: "Identificador único sequencial do cliente no sistema.", lgpd: "INTERNO", lgpdLabel: "Identificador Interno", lineage: "Gerado pelo SGBD (MySQL Sequence) no cadastro inicial (RF01).", rbac: "Leitura: Todos | Escrita: SGBD" },
      { name: "nome_razao", dataType: "VARCHAR(150)", keys: ["NN"], defaultVal: "—", description: "Nome completo do colecionador ou Razão Social da concessionária parceira.", lgpd: "PII", lgpdLabel: "Dado Pessoal (PII)", lineage: "Inserido pelo Consultor de Vendas via CRM/Showroom (RF01).", rbac: "Leitura: Consultor, Gerente, Financeiro, Admin | Escrita: Consultor, Gerente, Admin" },
      { name: "tipo_pessoa", dataType: "ENUM('PF','PJ')", keys: ["NN"], defaultVal: "'PF'", description: "Classificação jurídica do cliente: Pessoa Física (colecionador) ou Pessoa Jurídica (revenda).", lgpd: "INTERNO", lgpdLabel: "Cadastral", lineage: "Selecionado no formulário de cadastro de cliente (RF01).", rbac: "Leitura: Todos internos | Escrita: Consultor, Gerente, Admin" },
      { name: "documento_fiscal", dataType: "VARCHAR(30)", keys: ["UQ", "NN"], defaultVal: "—", description: "CPF, CNPJ ou Tax ID internacional (SSN/EIN) único para emissão contratual e fiscal.", lgpd: "SENSIVEL", lgpdLabel: "PII Fiscal Crítico", lineage: "Validado e inserido no onboarding do cliente; protegido por restrição UNIQUE (PR03).", rbac: "Leitura: Financeiro, Gerente, Admin (mascarado p/ Engenheiro) | Escrita: Consultor, Admin" },
      { name: "email", dataType: "VARCHAR(120)", keys: ["UQ", "NN"], defaultVal: "—", description: "Endereço de e-mail principal para envio de contratos, rastreamento de build e faturas.", lgpd: "PII", lgpdLabel: "Dado Pessoal (PII)", lineage: "Coletado no cadastro do cliente com validação de unicidade (RF01).", rbac: "Leitura: Consultor, Financeiro, Gerente, Admin | Escrita: Consultor, Gerente, Admin" },
      { name: "telefone", dataType: "VARCHAR(25)", keys: ["NN"], defaultVal: "—", description: "Telefone direto ou internacional com DDI para contato comercial e logística.", lgpd: "PII", lgpdLabel: "Dado Pessoal (PII)", lineage: "Informado pelo cliente no atendimento comercial (RF01).", rbac: "Leitura: Consultor, Financeiro, Gerente, Admin | Escrita: Consultor, Gerente, Admin" },
      { name: "vip", dataType: "BOOLEAN", keys: ["NN"], defaultVal: "FALSE", description: "Indicador de cliente colecionador VIP com prioridade de alocação em séries limitadas.", lgpd: "INTERNO", lgpdLabel: "Segmentação Comercial", lineage: "Atribuído pela Gerência Comercial com base no histórico de aquisições.", rbac: "Leitura: Consultor, Gerente, Admin | Escrita: Gerente, Admin" },
      { name: "ativo", dataType: "BOOLEAN", keys: ["NN"], defaultVal: "TRUE", description: "Flag de exclusão lógica para conformidade fiscal e direito à anonimização (PR01/PR03).", lgpd: "INTERNO", lgpdLabel: "Controle de Ciclo de Vida", lineage: "Inicia TRUE; alterado para FALSE em inativação sem apagar histórico.", rbac: "Leitura: Todos internos | Escrita: Gerente, Admin" },
      { name: "data_cadastro", dataType: "DATETIME", keys: ["NN"], defaultVal: "CURRENT_TIMESTAMP", description: "Carimbo temporal exato de criação do registro do cliente.", lgpd: "INTERNO", lgpdLabel: "Metadado Temporal", lineage: "Preenchido automaticamente pelo servidor MySQL.", rbac: "Leitura: Todos internos | Escrita: SGBD" }
    ]
  },
  {
    name: "endereco",
    type: "TABLE",
    domain: "Comercial",
    rfs: ["RF02"],
    rules: ["RN02", "PR03"],
    owner: "Logística & Operações Comerciais",
    steward: "Consultor de Vendas",
    retention: "Vinculado ao ciclo de vida do cliente e comprovantes de entrega",
    description: "Endereços residenciais, comerciais ou cofres/hangares para transporte fechado (Enclosed Transport) de veículos e envio de peças.",
    columns: [
      { name: "id_endereco", dataType: "INT", keys: ["PK", "NN"], defaultVal: "AUTO_INCREMENT", description: "Identificador único do endereço cadastrado.", lgpd: "INTERNO", lgpdLabel: "Identificador Interno", lineage: "Gerado automaticamente pelo MySQL.", rbac: "Leitura: Todos internos | Escrita: SGBD" },
      { name: "id_cliente", dataType: "INT", keys: ["FK", "NN"], defaultVal: "—", description: "Chave estrangeira referenciando cliente(id_cliente) com ON DELETE RESTRICT.", lgpd: "INTERNO", lgpdLabel: "Vínculo Relacional", lineage: "Associado obrigatoriamente a um cliente válido no cadastro (RF02).", rbac: "Leitura: Consultor, Financeiro, Gerente, Admin | Escrita: Consultor, Admin" },
      { name: "logradouro", dataType: "VARCHAR(150)", keys: ["NN"], defaultVal: "—", description: "Rua, avenida, rodovia ou identificação do complexo/hangar de entrega.", lgpd: "PII", lgpdLabel: "Dado Pessoal (PII)", lineage: "Informado pelo cliente no fechamento ou cadastro (RF02).", rbac: "Leitura: Consultor, Financeiro, Gerente, Admin | Escrita: Consultor, Admin" },
      { name: "numero", dataType: "VARCHAR(20)", keys: ["NN"], defaultVal: "—", description: "Número predial ou identificador da doca/lote.", lgpd: "PII", lgpdLabel: "Dado Pessoal (PII)", lineage: "Entrada manual no cadastro de endereço (RF02).", rbac: "Leitura: Consultor, Financeiro, Gerente, Admin | Escrita: Consultor, Admin" },
      { name: "complemento", dataType: "VARCHAR(80)", keys: [], defaultVal: "NULL", description: "Informações adicionais (ex.: VIP Vault, Hangar B, Showroom).", lgpd: "PII", lgpdLabel: "Dado Pessoal (PII)", lineage: "Opcional informado pelo cliente (RF02).", rbac: "Leitura: Consultor, Financeiro, Gerente, Admin | Escrita: Consultor, Admin" },
      { name: "cidade", dataType: "VARCHAR(80)", keys: ["NN"], defaultVal: "—", description: "Município ou cidade de destino da entrega/faturamento.", lgpd: "PII", lgpdLabel: "Localização", lineage: "Entrada cadastral validada (RF02).", rbac: "Leitura: Todos internos | Escrita: Consultor, Admin" },
      { name: "estado", dataType: "VARCHAR(50)", keys: ["NN"], defaultVal: "—", description: "Estado, província ou unidade federativa (ex.: FL, TX, SP).", lgpd: "PII", lgpdLabel: "Localização", lineage: "Entrada cadastral (RF02).", rbac: "Leitura: Todos internos | Escrita: Consultor, Admin" },
      { name: "pais", dataType: "VARCHAR(60)", keys: ["NN"], defaultVal: "'Estados Unidos'", description: "País de destino para definição de logística doméstica ou exportação.", lgpd: "INTERNO", lgpdLabel: "Localização", lineage: "Default 'Estados Unidos'; editável para clientes internacionais.", rbac: "Leitura: Todos internos | Escrita: Consultor, Admin" },
      { name: "cep", dataType: "VARCHAR(20)", keys: ["NN"], defaultVal: "—", description: "Código Postal (ZIP Code EUA ou CEP Brasil).", lgpd: "PII", lgpdLabel: "Dado Pessoal (PII)", lineage: "Informado no cadastro de endereço (RF02).", rbac: "Leitura: Consultor, Financeiro, Gerente, Admin | Escrita: Consultor, Admin" },
      { name: "principal", dataType: "BOOLEAN", keys: ["NN"], defaultVal: "FALSE", description: "Indica se este é o endereço padrão para despacho e faturamento.", lgpd: "INTERNO", lgpdLabel: "Preferência Logística", lineage: "Definido pelo Consultor no cadastro (RF02).", rbac: "Leitura: Todos internos | Escrita: Consultor, Admin" }
    ]
  },
  {
    name: "usuario",
    type: "TABLE",
    domain: "Governança",
    rfs: ["RF07", "RF08", "RF12"],
    rules: ["RN02", "RNF01", "PR03"],
    owner: "Segurança da Informação & TI",
    steward: "Administrador do Sistema",
    retention: "Permanente para rastreabilidade de auditoria e assinatura técnica",
    description: "Colaboradores internos da Trans Am Worldwide com controle de acesso baseado em papéis (RBAC).",
    columns: [
      { name: "id_usuario", dataType: "INT", keys: ["PK", "NN"], defaultVal: "AUTO_INCREMENT", description: "Identificador único do colaborador interno.", lgpd: "INTERNO", lgpdLabel: "Identificador Interno", lineage: "Gerado pelo SGBD na criação da conta interna (RF12).", rbac: "Leitura: Todos internos | Escrita: SGBD" },
      { name: "nome", dataType: "VARCHAR(120)", keys: ["NN"], defaultVal: "—", description: "Nome completo do consultor, engenheiro, analista financeiro ou gestor.", lgpd: "PII", lgpdLabel: "Dado Pessoal Colaborador", lineage: "Cadastrado pelo Administrador de TI/RH (RF12).", rbac: "Leitura: Todos internos | Escrita: Admin" },
      { name: "login", dataType: "VARCHAR(60)", keys: ["UQ", "NN"], defaultVal: "—", description: "Identificador único de autenticação no sistema TAW-ERP.", lgpd: "INTERNO", lgpdLabel: "Identidade de Acesso", lineage: "Definido pelo Administrador com restrição UNIQUE (RF12).", rbac: "Leitura: Gerente, Admin | Escrita: Admin" },
      { name: "senha_hash", dataType: "VARCHAR(255)", keys: ["NN"], defaultVal: "—", description: "Resumo criptográfico (bcrypt/Argon2) da senha; nunca armazenada em texto claro.", lgpd: "SENSIVEL", lgpdLabel: "Credencial Crítica", lineage: "Gerado pela camada de autenticação via hash unidirecional (RNF01).", rbac: "Leitura: Proibido em UI (somente serviço Auth) | Escrita: Admin / Próprio Usuário" },
      { name: "perfil", dataType: "ENUM(5 perfis)", keys: ["NN"], defaultVal: "—", description: "Papel RBAC: CONSULTOR, ENGENHEIRO, FINANCEIRO, GERENTE ou ADMINISTRADOR.", lgpd: "SENSIVEL", lgpdLabel: "Controle RBAC", lineage: "Atribuído pelo Administrador conforme matriz de segregação de funções (COBIT DSS05).", rbac: "Leitura: Gerente, Admin | Escrita: Admin" },
      { name: "ativo", dataType: "BOOLEAN", keys: ["NN"], defaultVal: "TRUE", description: "Status de habilitação de acesso do colaborador.", lgpd: "INTERNO", lgpdLabel: "Controle de Acesso", lineage: "Inicia TRUE; revogado (FALSE) no desligamento sem perder histórico.", rbac: "Leitura: Gerente, Admin | Escrita: Admin" },
      { name: "data_criacao", dataType: "DATETIME", keys: ["NN"], defaultVal: "CURRENT_TIMESTAMP", description: "Data e hora de criação da credencial.", lgpd: "INTERNO", lgpdLabel: "Metadado Temporal", lineage: "Carimbo automático do MySQL.", rbac: "Leitura: Admin | Escrita: SGBD" }
    ]
  },
  {
    name: "modelo_edicao",
    type: "TABLE",
    domain: "Catálogo",
    rfs: ["RF03", "RF11"],
    rules: ["RN06", "RNF04", "PR04"],
    owner: "Engenharia & Produto Trans Am",
    steward: "Gerente de Engenharia",
    retention: "Histórico permanente de catálogo e homologação",
    description: "Catálogo oficial de modelos e edições limitadas da Trans Am Worldwide (ex.: 455 Super Duty, Bandit Edition, Hurst Edition, 70/SS).",
    columns: [
      { name: "id_modelo", dataType: "INT", keys: ["PK", "NN"], defaultVal: "AUTO_INCREMENT", description: "Identificador único do modelo/edição limitada.", lgpd: "PUBLICO", lgpdLabel: "Catálogo Produto", lineage: "Gerado pelo SGBD no lançamento da série (RF03).", rbac: "Leitura: Todos | Escrita: SGBD" },
      { name: "nome_modelo", dataType: "VARCHAR(100)", keys: ["UQ", "NN"], defaultVal: "—", description: "Designação oficial da edição (compõe chave única com ano_edicao).", lgpd: "PUBLICO", lgpdLabel: "Catálogo Produto", lineage: "Definido pela Engenharia/Diretoria (RF03).", rbac: "Leitura: Todos | Escrita: Gerente Engenharia, Admin" },
      { name: "ano_edicao", dataType: "INT", keys: ["UQ", "NN"], defaultVal: "—", description: "Ano-modelo da série limitada (ex.: 2026).", lgpd: "PUBLICO", lgpdLabel: "Catálogo Produto", lineage: "Definido no planejamento anual de produção (RF03).", rbac: "Leitura: Todos | Escrita: Gerente Engenharia, Admin" },
      { name: "motorizacao", dataType: "VARCHAR(100)", keys: ["NN"], defaultVal: "—", description: "Especificação técnica do conjunto motriz (ex.: V8 7.4L 455 ci Magnuson Supercharged).", lgpd: "PUBLICO", lgpdLabel: "Especificação Técnica", lineage: "Homologado pela Engenharia Mecânica (RF03).", rbac: "Leitura: Todos | Escrita: Gerente Engenharia, Admin" },
      { name: "potencia_hp", dataType: "INT", keys: ["NN"], defaultVal: "—", description: "Potência nominal homologada em Horsepower (HP), sujeita a CHECK (potencia_hp > 0).", lgpd: "PUBLICO", lgpdLabel: "Especificação Técnica", lineage: "Aferido em dinamômetro de engenharia (RF03).", rbac: "Leitura: Todos | Escrita: Gerente Engenharia, Admin" },
      { name: "preco_base", dataType: "DECIMAL(12,2)", keys: ["NN"], defaultVal: "—", description: "Preço base sugerido em USD para conversão do modelo (CHECK >= 0).", lgpd: "INTERNO", lgpdLabel: "Tabela Comercial", lineage: "Definido pela Diretoria Financeira/Comercial (RNF04).", rbac: "Leitura: Todos internos | Escrita: Gerente, Admin" },
      { name: "limite_unidades", dataType: "INT", keys: ["NN"], defaultVal: "—", description: "Teto máximo de unidades produzidas na série limitada (validado via Trigger trg_veiculo_before_insert).", lgpd: "PUBLICO", lgpdLabel: "Regra de Exclusividade", lineage: "Definido no contrato de edição limitada (RN06).", rbac: "Leitura: Todos | Escrita: Admin" },
      { name: "ativo", dataType: "BOOLEAN", keys: ["NN"], defaultVal: "TRUE", description: "Indica se o modelo está aberto para novas encomendas.", lgpd: "PUBLICO", lgpdLabel: "Status Catálogo", lineage: "Gerenciado pela Engenharia/Admin.", rbac: "Leitura: Todos | Escrita: Gerente Engenharia, Admin" }
    ]
  },
  {
    name: "veiculo",
    type: "TABLE",
    domain: "Produção",
    rfs: ["RF04", "RF07", "RF08"],
    rules: ["RN06", "RN07", "PR04"],
    owner: "Engenharia de Produção & Fábrica",
    steward: "Engenheiro Chefe",
    retention: "Permanente (Rastreabilidade regulatória NHTSA / DOT / CONTRAN)",
    description: "Registro individual de cada veículo físico em estoque ou linha de conversão artesanal, rastreado pelo código VIN de 17 caracteres e número de série.",
    columns: [
      { name: "id_veiculo", dataType: "INT", keys: ["PK", "NN"], defaultVal: "AUTO_INCREMENT", description: "Identificador interno único da unidade veicular.", lgpd: "INTERNO", lgpdLabel: "Identificador Interno", lineage: "Gerado pelo SGBD na entrada do chassi na fábrica (RF04).", rbac: "Leitura: Todos internos | Escrita: SGBD" },
      { name: "id_modelo", dataType: "INT", keys: ["FK", "NN"], defaultVal: "—", description: "Referência à edição limitada em modelo_edicao(id_modelo).", lgpd: "INTERNO", lgpdLabel: "Vínculo Produto", lineage: "Associado na abertura da ficha do veículo (RF04).", rbac: "Leitura: Todos internos | Escrita: Engenheiro Chefe, Admin" },
      { name: "vin", dataType: "CHAR(17)", keys: ["UQ", "NN"], defaultVal: "—", description: "Vehicle Identification Number padrão ISO 3779 (17 caracteres únicos).", lgpd: "SENSIVEL", lgpdLabel: "Identificador Regulatório", lineage: "Extraído do chassi base recebido; obrigatório pela norma DOT/NHTSA (PR04).", rbac: "Leitura: Todos internos | Escrita: Engenheiro Chefe, Admin" },
      { name: "numero_serie_edicao", dataType: "INT", keys: ["UQ", "NN"], defaultVal: "—", description: "Numeração exclusiva da placa de série (ex.: #01/50), única por modelo e <= limite_unidades.", lgpd: "PUBLICO", lgpdLabel: "Série Limitada", lineage: "Validado pela Trigger trg_veiculo_before_insert (RN06).", rbac: "Leitura: Todos | Escrita: Engenheiro Chefe, Admin" },
      { name: "ano_fabricacao", dataType: "INT", keys: ["NN"], defaultVal: "—", description: "Ano de fabricação/conversão artesanal do veículo.", lgpd: "PUBLICO", lgpdLabel: "Ficha Técnica", lineage: "Informado no registro do veículo (RF04).", rbac: "Leitura: Todos | Escrita: Engenheiro Chefe, Admin" },
      { name: "cor_externa", dataType: "VARCHAR(60)", keys: ["NN"], defaultVal: "—", description: "Pintura externa e grafismos (ex.: Starlight Black / Gold Bird).", lgpd: "PUBLICO", lgpdLabel: "Especificação Visual", lineage: "Definido na configuração do veículo (RF04).", rbac: "Leitura: Todos | Escrita: Engenheiro Chefe, Consultor" },
      { name: "cor_interna", dataType: "VARCHAR(60)", keys: ["NN"], defaultVal: "—", description: "Acabamento de tapeçaria e painel (ex.: Camel Tan Full Leather).", lgpd: "PUBLICO", lgpdLabel: "Especificação Visual", lineage: "Definido na configuração do veículo (RF04).", rbac: "Leitura: Todos | Escrita: Engenheiro Chefe, Consultor" },
      { name: "valor_veiculo", dataType: "DECIMAL(12,2)", keys: ["NN"], defaultVal: "—", description: "Valor comercial vigente da unidade em USD antes de descontos.", lgpd: "INTERNO", lgpdLabel: "Precificação", lineage: "Calculado a partir do preco_base + opcionais de fábrica (RNF04).", rbac: "Leitura: Consultor, Financeiro, Gerente, Admin | Escrita: Gerente, Admin" },
      { name: "status_veiculo", dataType: "ENUM(5 status)", keys: ["NN"], defaultVal: "'DISPONIVEL'", description: "Ciclo de vida: DISPONIVEL, RESERVADO, EM_CUSTOMIZACAO, VENDIDO ou ENTREGUE.", lgpd: "INTERNO", lgpdLabel: "Controle Operacional", lineage: "Atualizado automaticamente pelas Triggers de pedido (RN07).", rbac: "Leitura: Todos internos | Escrita: Triggers SGBD / Gerente" },
      { name: "data_entrada", dataType: "DATETIME", keys: ["NN"], defaultVal: "CURRENT_TIMESTAMP", description: "Data/hora de registro do chassi na planta de Tallahassee.", lgpd: "INTERNO", lgpdLabel: "Metadado Temporal", lineage: "Carimbo automático do MySQL.", rbac: "Leitura: Todos internos | Escrita: SGBD" }
    ]
  },
  {
    name: "categoria",
    type: "TABLE",
    domain: "Catálogo",
    rfs: ["RF05"],
    rules: ["RNF07"],
    owner: "Gestão de Peças & Suprimentos",
    steward: "Gerente de Estoque",
    retention: "Permanente",
    description: "Taxonomia de classificação das peças de reposição, kits aerodinâmicos e pacotes de upgrade mecânico.",
    columns: [
      { name: "id_categoria", dataType: "INT", keys: ["PK", "NN"], defaultVal: "AUTO_INCREMENT", description: "Identificador único da categoria de produtos.", lgpd: "PUBLICO", lgpdLabel: "Taxonomia", lineage: "Gerado pelo SGBD (RF05).", rbac: "Leitura: Todos | Escrita: SGBD" },
      { name: "nome", dataType: "VARCHAR(80)", keys: ["UQ", "NN"], defaultVal: "—", description: "Nome único da categoria (ex.: Motor e Sobrealimentação, Suspensão e Freios).", lgpd: "PUBLICO", lgpdLabel: "Taxonomia", lineage: "Cadastrado pelo Gerente de Estoque/Admin (RF05).", rbac: "Leitura: Todos | Escrita: Gerente Estoque, Admin" },
      { name: "descricao", dataType: "VARCHAR(255)", keys: [], defaultVal: "NULL", description: "Escopo técnico dos componentes agrupados na categoria.", lgpd: "PUBLICO", lgpdLabel: "Taxonomia", lineage: "Informado no cadastro da categoria (RF05).", rbac: "Leitura: Todos | Escrita: Gerente Estoque, Admin" }
    ]
  },
  {
    name: "produto",
    type: "TABLE",
    domain: "Catálogo",
    rfs: ["RF05", "RF06", "RF07"],
    rules: ["RN03", "RN04", "RNF01"],
    owner: "Almoxarifado & Engenharia de Peças",
    steward: "Gerente de Estoque",
    retention: "Permanente (Inativação via ativo=FALSE; alterações de preço auditadas)",
    description: "Catálogo de peças exclusivas, capôs Shaker em fibra de carbono, rodas Honeycomb e kits Supercharger com controle transacional de saldo.",
    columns: [
      { name: "id_produto", dataType: "INT", keys: ["PK", "NN"], defaultVal: "AUTO_INCREMENT", description: "Identificador único da peça ou pacote de upgrade.", lgpd: "PUBLICO", lgpdLabel: "Catálogo Peças", lineage: "Gerado pelo SGBD (RF05).", rbac: "Leitura: Todos | Escrita: SGBD" },
      { name: "id_categoria", dataType: "INT", keys: ["FK", "NN"], defaultVal: "—", description: "Chave estrangeira para categoria(id_categoria).", lgpd: "PUBLICO", lgpdLabel: "Taxonomia", lineage: "Selecionado no cadastro da peça (RF05).", rbac: "Leitura: Todos | Escrita: Gerente Estoque, Admin" },
      { name: "sku", dataType: "VARCHAR(40)", keys: ["UQ", "NN"], defaultVal: "—", description: "Stock Keeping Unit único (ex.: TAW-CF-SHAKER01).", lgpd: "PUBLICO", lgpdLabel: "Código Logístico", lineage: "Padronizado pela Engenharia/Estoque com restrição UNIQUE (RF05).", rbac: "Leitura: Todos | Escrita: Gerente Estoque, Admin" },
      { name: "descricao", dataType: "VARCHAR(150)", keys: ["NN"], defaultVal: "—", description: "Descrição comercial e técnica da peça ou kit.", lgpd: "PUBLICO", lgpdLabel: "Catálogo Peças", lineage: "Informado no cadastro do produto (RF05).", rbac: "Leitura: Todos | Escrita: Gerente Estoque, Admin" },
      { name: "preco_tabela", dataType: "DECIMAL(12,2)", keys: ["NN"], defaultVal: "—", description: "Preço unitário vigente em USD; alterações disparam log em log_auditoria.", lgpd: "INTERNO", lgpdLabel: "Precificação", lineage: "Monitorado pela Trigger trg_produto_after_update (RNF01).", rbac: "Leitura: Todos internos | Escrita: Gerente Estoque, Admin" },
      { name: "saldo_estoque", dataType: "INT", keys: ["NN"], defaultVal: "0", description: "Quantidade física disponível em almoxarifado (CHECK >= 0; decrementado na venda).", lgpd: "INTERNO", lgpdLabel: "Inventário", lineage: "Atualizado por entradas de compra e Trigger trg_item_pedido_before_insert (RN04).", rbac: "Leitura: Todos internos | Escrita: Almoxarife, Triggers SGBD" },
      { name: "estoque_minimo", dataType: "INT", keys: ["NN"], defaultVal: "2", description: "Ponto de ressuprimento para alertas de reposição.", lgpd: "INTERNO", lgpdLabel: "Inventário", lineage: "Configurado pelo Gerente de Estoque (RF05).", rbac: "Leitura: Todos internos | Escrita: Gerente Estoque, Admin" },
      { name: "ativo", dataType: "BOOLEAN", keys: ["NN"], defaultVal: "TRUE", description: "Indica se a peça pode ser adicionada a novos pedidos.", lgpd: "INTERNO", lgpdLabel: "Ciclo de Vida", lineage: "Validado antes de inserir item_pedido (RF05).", rbac: "Leitura: Todos internos | Escrita: Gerente Estoque, Admin" }
    ]
  },
  {
    name: "pedido",
    type: "TABLE",
    domain: "Comercial",
    rfs: ["RF07", "RF10", "RF11"],
    rules: ["RN01", "RN02", "RN03", "RN05", "RN07", "PR01", "PR02"],
    owner: "Diretoria Comercial & Financeira",
    steward: "Gerente Comercial",
    retention: "5 a 7 anos obrigatórios (PR01 — Proibição absoluta de DELETE físico)",
    description: "Transação central de venda de veículo exclusivo (VIN) e/ou peças de performance, com cálculo atômico e congelamento histórico de valores.",
    columns: [
      { name: "id_pedido", dataType: "INT", keys: ["PK", "NN"], defaultVal: "AUTO_INCREMENT", description: "Número único do pedido de venda.", lgpd: "INTERNO", lgpdLabel: "Identificador Fiscal", lineage: "Gerado pelo SGBD na abertura da proposta/pedido (RF07).", rbac: "Leitura: Todos internos | Escrita: SGBD" },
      { name: "id_cliente", dataType: "INT", keys: ["FK", "NN"], defaultVal: "—", description: "Comprador vinculado em cliente(id_cliente) com ON DELETE RESTRICT (RN02).", lgpd: "INTERNO", lgpdLabel: "Vínculo Contratual", lineage: "Informado pelo Consultor na emissão do pedido.", rbac: "Leitura: Consultor, Financeiro, Gerente, Admin | Escrita: Consultor, Gerente" },
      { name: "id_usuario", dataType: "INT", keys: ["FK", "NN"], defaultVal: "—", description: "Consultor de vendas responsável em usuario(id_usuario) (RN02).", lgpd: "INTERNO", lgpdLabel: "Responsabilidade", lineage: "Capturado da sessão autenticada do consultor.", rbac: "Leitura: Todos internos | Escrita: Consultor, Gerente" },
      { name: "id_veiculo", dataType: "INT", keys: ["FK"], defaultVal: "NULL", description: "Veículo exclusivo vinculado (NULL quando o pedido for exclusivamente de peças).", lgpd: "INTERNO", lgpdLabel: "Alocação Chassi", lineage: "Validado pela Trigger trg_pedido_before_insert contra duplicidade de venda (RN07).", rbac: "Leitura: Todos internos | Escrita: Consultor, Gerente" },
      { name: "data_pedido", dataType: "DATETIME", keys: ["NN"], defaultVal: "CURRENT_TIMESTAMP", description: "Timestamp oficial de emissão do pedido (indexado em idx_pedido_data).", lgpd: "INTERNO", lgpdLabel: "Metadado Fiscal", lineage: "Gerado pelo servidor MySQL.", rbac: "Leitura: Todos internos | Escrita: SGBD" },
      { name: "situacao", dataType: "ENUM(5 status)", keys: ["NN"], defaultVal: "'RASCUNHO'", description: "Estado: RASCUNHO, FINALIZADO, EM_PRODUCAO, CONCLUIDO ou CANCELADO.", lgpd: "INTERNO", lgpdLabel: "Workflow Comercial", lineage: "Transições auditadas automaticamente em log_auditoria (trg_pedido_after_update).", rbac: "Leitura: Todos internos | Escrita: Consultor, Gerente, Admin" },
      { name: "forma_pagamento", dataType: "ENUM(4 métodos)", keys: ["NN"], defaultVal: "—", description: "Modalidade acordada: TRANSFERENCIA_BANCARIA, FINANCIAMENTO, CARTAO_CREDITO ou ESCROW_INTERNACIONAL.", lgpd: "SENSIVEL", lgpdLabel: "Dado Financeiro", lineage: "Selecionado no fechamento comercial (RF07).", rbac: "Leitura: Consultor, Financeiro, Gerente, Admin | Escrita: Consultor, Financeiro" },
      { name: "valor_veiculo_venda", dataType: "DECIMAL(12,2)", keys: ["NN"], defaultVal: "0.00", description: "Preço histórico congelado do veículo no ato da venda (RN03).", lgpd: "SENSIVEL", lgpdLabel: "Valor Contratual", lineage: "Copiado de veiculo.valor_veiculo via Trigger trg_pedido_before_insert.", rbac: "Leitura: Consultor, Financeiro, Gerente, Admin | Escrita: SGBD / Gerente" },
      { name: "desconto", dataType: "DECIMAL(12,2)", keys: ["NN"], defaultVal: "0.00", description: "Desconto comercial concedido em USD (CHECK >= 0).", lgpd: "SENSIVEL", lgpdLabel: "Valor Contratual", lineage: "Aplicado pelo Consultor/Gerente dentro da alçada comercial.", rbac: "Leitura: Consultor, Financeiro, Gerente, Admin | Escrita: Consultor, Gerente" },
      { name: "valor_total", dataType: "DECIMAL(12,2)", keys: ["NN"], defaultVal: "0.00", description: "Valor líquido consolidado: valor_veiculo_venda + soma(itens) - desconto (RN05).", lgpd: "SENSIVEL", lgpdLabel: "Valor Contratual", lineage: "Recalculado automaticamente pelas Triggers de pedido e item_pedido.", rbac: "Leitura: Consultor, Financeiro, Gerente, Admin | Escrita: Triggers SGBD" },
      { name: "data_cancelamento", dataType: "DATETIME", keys: [], defaultVal: "NULL", description: "Data/hora em que o pedido foi cancelado (PR02).", lgpd: "INTERNO", lgpdLabel: "Auditoria Cancelamento", lineage: "Preenchido automaticamente por trg_pedido_before_update ao cancelar.", rbac: "Leitura: Financeiro, Gerente, Admin | Escrita: Triggers SGBD / Gerente" },
      { name: "motivo_cancelamento", dataType: "VARCHAR(255)", keys: [], defaultVal: "NULL", description: "Justificativa formal do cancelamento ou exercício de direito de arrependimento (PR02).", lgpd: "INTERNO", lgpdLabel: "Auditoria Cancelamento", lineage: "Informado pelo Gerente/Financeiro autorizador (RF10).", rbac: "Leitura: Financeiro, Gerente, Admin | Escrita: Gerente, Financeiro" }
    ]
  },
  {
    name: "item_pedido",
    type: "TABLE",
    domain: "Comercial",
    rfs: ["RF06", "RF07"],
    rules: ["RN03", "RN04", "RN05", "PR01"],
    owner: "Comercial & Almoxarifado",
    steward: "Gerente Comercial",
    retention: "5 a 7 anos obrigatórios (PR01 — ON DELETE RESTRICT)",
    description: "Tabela associativa que resolve o relacionamento N:N entre pedido e produto, congelando preços históricos e baixando estoque.",
    columns: [
      { name: "id_item", dataType: "INT", keys: ["PK", "NN"], defaultVal: "AUTO_INCREMENT", description: "Identificador único da linha de item no pedido.", lgpd: "INTERNO", lgpdLabel: "Identificador Interno", lineage: "Gerado pelo SGBD (RF07).", rbac: "Leitura: Todos internos | Escrita: SGBD" },
      { name: "id_pedido", dataType: "INT", keys: ["FK", "NN"], defaultVal: "—", description: "Referência ao pedido pai em pedido(id_pedido).", lgpd: "INTERNO", lgpdLabel: "Vínculo Transacional", lineage: "Associado na inclusão do item ao carrinho/pedido.", rbac: "Leitura: Todos internos | Escrita: Consultor, Gerente" },
      { name: "id_produto", dataType: "INT", keys: ["FK", "NN"], defaultVal: "—", description: "Referência à peça/upgrade em produto(id_produto).", lgpd: "INTERNO", lgpdLabel: "Vínculo Produto", lineage: "Selecionado do catálogo ativo (RF05/RF07).", rbac: "Leitura: Todos internos | Escrita: Consultor, Gerente" },
      { name: "quantidade", dataType: "INT", keys: ["NN"], defaultVal: "—", description: "Quantidade vendida (CHECK > 0 e <= produto.saldo_estoque).", lgpd: "INTERNO", lgpdLabel: "Dado Transacional", lineage: "Validado por trg_item_pedido_before_insert antes de debitar estoque (RN04).", rbac: "Leitura: Todos internos | Escrita: Consultor, Gerente" },
      { name: "preco_unitario_venda", dataType: "DECIMAL(12,2)", keys: ["NN"], defaultVal: "—", description: "Preço unitário histórico congelado no momento da compra (RN03).", lgpd: "SENSIVEL", lgpdLabel: "Valor Fiscal", lineage: "Copiado de produto.preco_tabela pela Trigger se informado 0.00.", rbac: "Leitura: Consultor, Financeiro, Gerente, Admin | Escrita: Triggers SGBD" }
    ]
  },
  {
    name: "ordem_customizacao",
    type: "TABLE",
    domain: "Produção",
    rfs: ["RF08"],
    rules: ["RN07", "PR04"],
    owner: "Engenharia de Produção (Tallahassee, FL)",
    steward: "Engenheiro Chefe",
    retention: "Permanente (Histórico técnico de modificação estrutural e potência — PR04)",
    description: "Ordem de serviço artesanal que rastreia cada etapa de conversão do veículo na fábrica e o engenheiro responsável.",
    columns: [
      { name: "id_ordem", dataType: "INT", keys: ["PK", "NN"], defaultVal: "AUTO_INCREMENT", description: "Número único da ordem de produção/customização.", lgpd: "INTERNO", lgpdLabel: "Identificador Fábrica", lineage: "Gerado pelo SGBD na abertura da O.S. (RF08).", rbac: "Leitura: Todos internos | Escrita: SGBD" },
      { name: "id_veiculo", dataType: "INT", keys: ["FK", "NN"], defaultVal: "—", description: "Veículo em conversão em veiculo(id_veiculo).", lgpd: "INTERNO", lgpdLabel: "Vínculo Chassi", lineage: "Associado ao VIN em produção (RF08).", rbac: "Leitura: Todos internos | Escrita: Engenheiro Chefe, Gerente" },
      { name: "id_pedido", dataType: "INT", keys: ["FK", "NN"], defaultVal: "—", description: "Pedido comercial que originou a ordem em pedido(id_pedido).", lgpd: "INTERNO", lgpdLabel: "Vínculo Comercial", lineage: "Vinculado após confirmação do sinal de reserva.", rbac: "Leitura: Todos internos | Escrita: Engenheiro Chefe, Gerente" },
      { name: "id_engenheiro", dataType: "INT", keys: ["FK", "NN"], defaultVal: "—", description: "Engenheiro responsável técnico em usuario(id_usuario) (PR04).", lgpd: "INTERNO", lgpdLabel: "Responsabilidade Técnica", lineage: "Designado pelo Engenheiro Chefe/Gerente (RF08).", rbac: "Leitura: Todos internos | Escrita: Engenheiro Chefe, Gerente" },
      { name: "etapa_atual", dataType: "ENUM(6 etapas)", keys: ["NN"], defaultVal: "'DESMONTAGEM'", description: "Estágio: DESMONTAGEM, FUNILARIA_PINTURA, PREPARACAO_MOTOR, ACABAMENTO_INTERNO, TESTES_DINAMOMETRO ou CONCLUIDO.", lgpd: "INTERNO", lgpdLabel: "Status Produção", lineage: "Atualizado conforme avanço físico na linha de montagem.", rbac: "Leitura: Todos internos | Escrita: Engenheiro, Gerente" },
      { name: "data_inicio", dataType: "DATE", keys: ["NN"], defaultVal: "—", description: "Data de início efetivo da desmontagem/conversão.", lgpd: "INTERNO", lgpdLabel: "Cronograma", lineage: "Registrado na abertura da ordem (RF08).", rbac: "Leitura: Todos internos | Escrita: Engenheiro, Gerente" },
      { name: "data_prevista_entrega", dataType: "DATE", keys: ["NN"], defaultVal: "—", description: "Prazo estimado de conclusão e entrega ao cliente.", lgpd: "INTERNO", lgpdLabel: "Cronograma", lineage: "Calculado pelo cronograma de engenharia (RF08).", rbac: "Leitura: Todos internos | Escrita: Engenheiro Chefe, Gerente" },
      { name: "data_conclusao", dataType: "DATE", keys: [], defaultVal: "NULL", description: "Data real de aprovação final no dinamômetro e controle de qualidade.", lgpd: "INTERNO", lgpdLabel: "Cronograma", lineage: "Preenchido ao atingir etapa CONCLUIDO.", rbac: "Leitura: Todos internos | Escrita: Engenheiro Chefe, Gerente" },
      { name: "observacoes_tecnicas", dataType: "TEXT", keys: [], defaultVal: "NULL", description: "Laudos de dinamômetro, calibração de mapa e notas de tropicalização/exportação.", lgpd: "INTERNO", lgpdLabel: "Laudo Engenharia", lineage: "Documentado pelo engenheiro responsável (PR04).", rbac: "Leitura: Todos internos | Escrita: Engenheiro, Gerente" }
    ]
  },
  {
    name: "pagamento",
    type: "TABLE",
    domain: "Comercial",
    rfs: ["RF09", "RF10"],
    rules: ["RN08", "RNF04", "PR01", "PR02"],
    owner: "Controladoria & Tesouraria",
    steward: "Analista Financeiro Sênior",
    retention: "5 a 7 anos obrigatórios (PR01 — Legislação Tributária / IRS)",
    description: "Registro financeiro de sinais de reserva de construção, parcelas intermediárias, quitações finais e estornos.",
    columns: [
      { name: "id_pagamento", dataType: "INT", keys: ["PK", "NN"], defaultVal: "AUTO_INCREMENT", description: "Identificador único do lançamento financeiro.", lgpd: "SENSIVEL", lgpdLabel: "Identificador Financeiro", lineage: "Gerado pelo SGBD no registro do recebimento (RF09).", rbac: "Leitura: Financeiro, Gerente, Admin | Escrita: SGBD" },
      { name: "id_pedido", dataType: "INT", keys: ["FK", "NN"], defaultVal: "—", description: "Pedido quitado ou amortizado em pedido(id_pedido).", lgpd: "INTERNO", lgpdLabel: "Vínculo Contábil", lineage: "Associado no lançamento bancário/escrow (RF09).", rbac: "Leitura: Financeiro, Gerente, Admin | Escrita: Financeiro, Gerente" },
      { name: "data_pagamento", dataType: "DATETIME", keys: ["NN"], defaultVal: "CURRENT_TIMESTAMP", description: "Data e hora de registro/compensação do pagamento.", lgpd: "INTERNO", lgpdLabel: "Metadado Contábil", lineage: "Carimbo automático ou data da compensação.", rbac: "Leitura: Financeiro, Gerente, Admin | Escrita: Financeiro, SGBD" },
      { name: "valor_pago", dataType: "DECIMAL(12,2)", keys: ["NN"], defaultVal: "—", description: "Valor monetário da parcela em USD (CHECK > 0; soma confirmada <= pedido.valor_total).", lgpd: "SENSIVEL", lgpdLabel: "Dado Financeiro", lineage: "Validado pela Trigger trg_pagamento_before_insert (RN08).", rbac: "Leitura: Financeiro, Gerente, Admin | Escrita: Financeiro, Gerente" },
      { name: "tipo_pagamento", dataType: "ENUM(3 tipos)", keys: ["NN"], defaultVal: "—", description: "Natureza: SINAL_RESERVA, PARCELA_INTERMEDIARIA ou QUITACAO_FINAL.", lgpd: "INTERNO", lgpdLabel: "Classificação Financeira", lineage: "Informado pelo Financeiro conforme contrato (RF09).", rbac: "Leitura: Financeiro, Gerente, Admin | Escrita: Financeiro, Gerente" },
      { name: "metodo_pagamento", dataType: "ENUM(4 métodos)", keys: ["NN"], defaultVal: "—", description: "Canal: TRANSFERENCIA_BANCARIA, FINANCIAMENTO, CARTAO_CREDITO ou ESCROW_INTERNACIONAL.", lgpd: "SENSIVEL", lgpdLabel: "Dado Financeiro", lineage: "Registrado na conciliação financeira (RF09).", rbac: "Leitura: Financeiro, Gerente, Admin | Escrita: Financeiro, Gerente" },
      { name: "status_pagamento", dataType: "ENUM(3 status)", keys: ["NN"], defaultVal: "'CONFIRMADO'", description: "Situação: PENDENTE, CONFIRMADO ou ESTORNADO (PR02).", lgpd: "SENSIVEL", lgpdLabel: "Status Contábil", lineage: "Atualizado após compensação bancária ou processo de estorno.", rbac: "Leitura: Financeiro, Gerente, Admin | Escrita: Financeiro, Gerente" }
    ]
  },
  {
    name: "log_auditoria",
    type: "TABLE",
    domain: "Governança",
    rfs: ["RF10", "RF12"],
    rules: ["RNF01", "PR01", "PR03"],
    owner: "Auditoria Interna & Compliance",
    steward: "Administrador de Banco de Dados (DBA)",
    retention: "Permanente / Imutável (Trilha de Auditoria COBIT DSS05)",
    description: "Trilha automática de auditoria alimentada por Triggers para rastrear alterações críticas de preços, status de pedidos e cancelamentos.",
    columns: [
      { name: "id_log", dataType: "INT", keys: ["PK", "NN"], defaultVal: "AUTO_INCREMENT", description: "Identificador sequencial imutável do evento de auditoria.", lgpd: "INTERNO", lgpdLabel: "Trilha Auditoria", lineage: "Gerado automaticamente pelo SGBD (RNF01).", rbac: "Leitura: Gerente, Admin | Escrita: Somente Triggers SGBD" },
      { name: "id_usuario", dataType: "INT", keys: ["FK"], defaultVal: "NULL", description: "Colaborador responsável pela operação (NULL quando disparado por processo batch/catálogo).", lgpd: "INTERNO", lgpdLabel: "Rastreabilidade Ator", lineage: "Capturado via Trigger a partir da transação.", rbac: "Leitura: Gerente, Admin | Escrita: Somente Triggers SGBD" },
      { name: "tabela_afetada", dataType: "VARCHAR(60)", keys: ["NN"], defaultVal: "—", description: "Nome da tabela monitorada (ex.: pedido, produto).", lgpd: "INTERNO", lgpdLabel: "Metadado Técnico", lineage: "Gravado literalmente pela Trigger de auditoria.", rbac: "Leitura: Gerente, Admin | Escrita: Somente Triggers SGBD" },
      { name: "id_registro_afetado", dataType: "INT", keys: ["NN"], defaultVal: "—", description: "Chave primária do registro modificado na tabela de origem.", lgpd: "INTERNO", lgpdLabel: "Metadado Técnico", lineage: "Capturado de NEW.id_<entidade> na Trigger.", rbac: "Leitura: Gerente, Admin | Escrita: Somente Triggers SGBD" },
      { name: "operacao", dataType: "VARCHAR(30)", keys: ["NN"], defaultVal: "—", description: "Tipo de evento auditado (ex.: UPDATE_SITUACAO, ALTERACAO_PRECO).", lgpd: "INTERNO", lgpdLabel: "Evento Auditoria", lineage: "Definido pela Trigger de negócio.", rbac: "Leitura: Gerente, Admin | Escrita: Somente Triggers SGBD" },
      { name: "data_hora", dataType: "DATETIME", keys: ["NN"], defaultVal: "CURRENT_TIMESTAMP", description: "Timestamp exato da ocorrência da alteração crítica.", lgpd: "INTERNO", lgpdLabel: "Carimbo Temporal", lineage: "Gerado pelo servidor MySQL.", rbac: "Leitura: Gerente, Admin | Escrita: Somente Triggers SGBD" },
      { name: "detalhes", dataType: "TEXT", keys: ["NN"], defaultVal: "—", description: "Descrição completa contendo valores anteriores, novos valores e motivo.", lgpd: "INTERNO", lgpdLabel: "Payload Auditoria", lineage: "Concatenado dinamicamente pelas Triggers trg_pedido_after_update e trg_produto_after_update.", rbac: "Leitura: Gerente, Admin | Escrita: Somente Triggers SGBD" }
    ]
  },
  {
    name: "vw_resumo_financeiro_pedidos",
    type: "VIEW",
    domain: "Comercial",
    rfs: ["RF09", "RF11"],
    rules: ["RN05", "RN08", "RNF04"],
    owner: "Diretoria Executiva & Controladoria",
    steward: "Analista de BI & Financeiro",
    retention: "Visão dinâmica em tempo real (sem persistência física)",
    description: "Visão gerencial consolidada que cruza pedidos, clientes VIP, consultores, veículos (VIN) e pagamentos confirmados para apurar o saldo a receber.",
    columns: [
      { name: "id_pedido", dataType: "INT", keys: ["PK"], defaultVal: "—", description: "Origem: pedido.id_pedido.", lgpd: "INTERNO", lgpdLabel: "Identificador", lineage: "Projeção direta de pedido.id_pedido.", rbac: "Leitura: Financeiro, Gerente, Admin" },
      { name: "data_pedido", dataType: "DATETIME", keys: [], defaultVal: "—", description: "Origem: pedido.data_pedido.", lgpd: "INTERNO", lgpdLabel: "Temporal", lineage: "Projeção direta de pedido.data_pedido.", rbac: "Leitura: Financeiro, Gerente, Admin" },
      { name: "cliente", dataType: "VARCHAR(150)", keys: [], defaultVal: "—", description: "Origem: cliente.nome_razao.", lgpd: "PII", lgpdLabel: "Dado Pessoal (PII)", lineage: "INNER JOIN cliente ON p.id_cliente = c.id_cliente.", rbac: "Leitura: Financeiro, Gerente, Admin" },
      { name: "cliente_vip", dataType: "BOOLEAN", keys: [], defaultVal: "—", description: "Origem: cliente.vip.", lgpd: "INTERNO", lgpdLabel: "Segmentação", lineage: "Projeção direta de cliente.vip.", rbac: "Leitura: Financeiro, Gerente, Admin" },
      { name: "consultor_responsavel", dataType: "VARCHAR(120)", keys: [], defaultVal: "—", description: "Origem: usuario.nome.", lgpd: "PII", lgpdLabel: "Colaborador", lineage: "INNER JOIN usuario ON p.id_usuario = u.id_usuario.", rbac: "Leitura: Financeiro, Gerente, Admin" },
      { name: "modelo_veiculo", dataType: "VARCHAR(100)", keys: [], defaultVal: "NULL", description: "Origem: modelo_edicao.nome_modelo (NULL se pedido só de peças).", lgpd: "PUBLICO", lgpdLabel: "Produto", lineage: "LEFT JOIN veiculo -> modelo_edicao.", rbac: "Leitura: Financeiro, Gerente, Admin" },
      { name: "chassi_vin", dataType: "CHAR(17)", keys: [], defaultVal: "NULL", description: "Origem: veiculo.vin.", lgpd: "SENSIVEL", lgpdLabel: "Regulatório", lineage: "LEFT JOIN veiculo ON p.id_veiculo = v.id_veiculo.", rbac: "Leitura: Financeiro, Gerente, Admin" },
      { name: "valor_liquido_pedido", dataType: "DECIMAL(12,2)", keys: [], defaultVal: "—", description: "Origem: pedido.valor_total.", lgpd: "SENSIVEL", lgpdLabel: "Financeiro", lineage: "Valor líquido final após descontos.", rbac: "Leitura: Financeiro, Gerente, Admin" },
      { name: "total_pago_confirmado", dataType: "DECIMAL(12,2)", keys: [], defaultVal: "0.00", description: "Soma agregada de pagamento.valor_pago onde status_pagamento = 'CONFIRMADO'.", lgpd: "SENSIVEL", lgpdLabel: "Financeiro", lineage: "SUM(CASE WHEN pg.status_pagamento = 'CONFIRMADO' THEN pg.valor_pago ELSE 0 END).", rbac: "Leitura: Financeiro, Gerente, Admin" },
      { name: "saldo_a_receber", dataType: "DECIMAL(12,2)", keys: [], defaultVal: "0.00", description: "Diferença calculada entre valor_liquido_pedido e total_pago_confirmado.", lgpd: "SENSIVEL", lgpdLabel: "Financeiro", lineage: "Cálculo derivado: p.valor_total - total_pago_confirmado.", rbac: "Leitura: Financeiro, Gerente, Admin" }
    ]
  }
];

const BUSINESS_RULES = [
  { code: "RN01", title: "Composição Mínima do Pedido", mech: "TRIGGER trg_pedido_before_update", desc: "Impede finalizar pedido sem veículo vinculado (id_veiculo) e sem ao menos 1 item de peça." },
  { code: "RN02", title: "Vínculo Obrigatório Cliente/Consultor", mech: "FK NOT NULL + ON DELETE RESTRICT", desc: "Todo pedido exige cliente e consultor válidos, bloqueando exclusões físicas que quebrem histórico." },
  { code: "RN03", title: "Congelamento de Preço Histórico", mech: "TRIGGER BEFORE INSERT", desc: "Persiste valor_veiculo_venda e preco_unitario_venda no ato da venda, blindando pedidos antigos contra reajustes." },
  { code: "RN04", title: "Trava e Baixa Automática de Estoque", mech: "TRIGGER + CHECK (saldo >= 0)", desc: "Bloqueia venda acima do saldo físico disponível e decrementa produto.saldo_estoque atomicamente." },
  { code: "RN05", title: "Cálculo Atômico do Valor Total", mech: "TRIGGERS pedido & item_pedido", desc: "Recalcula valor_total = (valor_veiculo_venda + soma_itens) - desconto em qualquer inserção ou atualização." },
  { code: "RN06", title: "Controle de Série Limitada", mech: "UNIQUE + trg_veiculo_before_insert", desc: "Garante número de série único por modelo e impede ultrapassar modelo_edicao.limite_unidades." },
  { code: "RN07", title: "Exclusividade de Chassi (VIN)", mech: "TRIGGERS pedido INSERT/UPDATE", desc: "Impede venda duplicada de um mesmo VIN e transiciona status entre DISPONIVEL, RESERVADO e VENDIDO." },
  { code: "RN08", title: "Teto de Pagamentos Confirmados", mech: "TRIGGER trg_pagamento_before_insert", desc: "Impede que a soma dos pagamentos confirmados ultrapasse o valor_total líquido do pedido." },
  { code: "PR01", title: "Retenção Fiscal e Contratual", mech: "ON DELETE RESTRICT + Flag ativo", desc: "Preserva registros fiscais por 5 anos (Receita Federal) e 7 anos (IRS EUA) sem DELETE físico." },
  { code: "PR02", title: "Direito de Arrependimento / Estorno", mech: "data_cancelamento + ESTORNADO", desc: "Controla cancelamentos elegíveis (CDC Art. 49), devolvendo peças ao estoque e liberando chassi." },
  { code: "PR03", title: "Privacidade e LGPD (Lei 13.709/18)", mech: "RBAC + Hash + Anonimização", desc: "Protege PII de colecionadores (CPF, e-mail, endereço) com segregação de perfis e exclusão lógica." },
  { code: "PR04", title: "Rastreabilidade Veicular DOT/NHTSA", mech: "CHAR(17) UNIQUE + O.S.", desc: "Exige VIN de 17 caracteres e histórico técnico completo vinculado ao engenheiro responsável." }
];

// ============================================================================
// RENDERIZAÇÃO & FILTRAGEM EM TEMPO REAL
// ============================================================================

const state = {
  search: "",
  domain: "ALL",
  lgpd: "ALL",
  key: "ALL"
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function highlightText(text, term) {
  const safe = escapeHtml(text);
  if (!term) return safe;
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedTerm})`, "gi");
  return safe.replace(regex, '<mark class="highlight-match">$1</mark>');
}

function updateKPIs() {
  let totalCols = 0;
  let sensitiveCols = 0;
  SCHEMA_DATA.forEach(t => {
    totalCols += t.columns.length;
    t.columns.forEach(c => {
      if (c.lgpd === "PII" || c.lgpd === "SENSIVEL") sensitiveCols++;
    });
  });
  document.getElementById("kpi-columns").textContent = totalCols;
  document.getElementById("kpi-lgpd").textContent = sensitiveCols;
}

function renderRules() {
  const grid = document.getElementById("rules-grid");
  grid.innerHTML = BUSINESS_RULES.map(r => `
    <article class="rule-item">
      <div class="rule-item-head">
        <span class="rule-code">${r.code}</span>
        <span class="rule-mech">${escapeHtml(r.mech)}</span>
      </div>
      <h4>${escapeHtml(r.title)}</h4>
      <p>${escapeHtml(r.desc)}</p>
    </article>
  `).join("");
}

function renderCatalog() {
  const term = state.search.trim().toLowerCase();
  const container = document.getElementById("tables-container");
  const nav = document.getElementById("entity-nav");

  let visibleTables = 0;
  let visibleColumns = 0;
  const navItems = [];
  const cardsHtml = [];

  SCHEMA_DATA.forEach(table => {
    if (state.domain !== "ALL" && table.domain !== state.domain) return;

    const tableMetaMatch =
      !term ||
      table.name.toLowerCase().includes(term) ||
      table.description.toLowerCase().includes(term) ||
      table.domain.toLowerCase().includes(term) ||
      table.owner.toLowerCase().includes(term) ||
      table.rfs.some(r => r.toLowerCase().includes(term)) ||
      table.rules.some(r => r.toLowerCase().includes(term));

    const filteredCols = table.columns.filter(col => {
      if (state.lgpd !== "ALL" && col.lgpd !== state.lgpd) return false;
      if (state.key !== "ALL" && !col.keys.includes(state.key)) return false;

      if (!term) return true;
      if (tableMetaMatch && state.lgpd === "ALL" && state.key === "ALL") return true;

      return (
        col.name.toLowerCase().includes(term) ||
        col.dataType.toLowerCase().includes(term) ||
        col.description.toLowerCase().includes(term) ||
        col.lgpdLabel.toLowerCase().includes(term) ||
        col.lineage.toLowerCase().includes(term) ||
        col.rbac.toLowerCase().includes(term)
      );
    });

    if (filteredCols.length === 0) return;

    visibleTables++;
    visibleColumns += filteredCols.length;

    navItems.push(`
      <li>
        <a href="#entity-${table.name}">
          <span>${table.name}</span>
          <span class="col-badge">${filteredCols.length}</span>
        </a>
      </li>
    `);

    const rowsHtml = filteredCols.map(col => {
      const keyBadges = col.keys.map(k => {
        const cls = k === "PK" ? "pill-pk" : k === "FK" ? "pill-fk" : k === "UQ" ? "pill-uq" : "pill-nn";
        return `<span class="pill ${cls}">${k}</span>`;
      }).join("");

      const lgpdCls =
        col.lgpd === "PII" ? "lgpd-pii" :
        col.lgpd === "SENSIVEL" ? "lgpd-sensivel" :
        col.lgpd === "INTERNO" ? "lgpd-interno" : "lgpd-publico";

      return `
        <tr>
          <td>
            <div class="col-name">${highlightText(col.name, state.search)}</div>
            <div style="margin-top:4px;">${keyBadges || '<span class="pill pill-nn">NULL</span>'}</div>
          </td>
          <td>
            <div class="col-type">${highlightText(col.dataType, state.search)}</div>
            <div style="font-size:0.72rem; color:var(--text-muted); margin-top:3px;">Default: <code>${escapeHtml(col.defaultVal)}</code></div>
          </td>
          <td>${highlightText(col.description, state.search)}</td>
          <td>
            <span class="lgpd-badge ${lgpdCls}">${highlightText(col.lgpdLabel, state.search)}</span>
          </td>
          <td class="gov-cell">
            <div><strong>Linhagem:</strong> ${highlightText(col.lineage, state.search)}</div>
            <div style="margin-top:4px;"><strong>RBAC:</strong> ${highlightText(col.rbac, state.search)}</div>
          </td>
        </tr>
      `;
    }).join("");

    cardsHtml.push(`
      <article class="table-card" id="entity-${table.name}">
        <div class="table-card-header" onclick="this.parentElement.classList.toggle('collapsed')">
          <div class="table-title-group">
            <div class="table-name-row">
              <span class="table-name">${highlightText(table.name, state.search)}</span>
              <span class="domain-tag">${table.type} • ${table.domain}</span>
              ${table.rfs.map(rf => `<span class="rf-tag">${rf}</span>`).join("")}
              ${table.rules.map(rn => `<span class="rf-tag" style="color:var(--gold-bright);border-color:var(--border-gold);background:var(--gold-dim);">${rn}</span>`).join("")}
            </div>
            <p class="table-desc">${highlightText(table.description, state.search)}</p>
            <div class="table-gov-meta">
              <span><strong>Owner:</strong> ${escapeHtml(table.owner)}</span>
              <span><strong>Steward:</strong> ${escapeHtml(table.steward)}</span>
              <span><strong>Retenção:</strong> ${escapeHtml(table.retention)}</span>
            </div>
          </div>
          <span class="collapse-icon" aria-hidden="true">&#9662;</span>
        </div>
        <div class="table-responsive">
          <table class="dict-table">
            <thead>
              <tr>
                <th>Atributo &amp; Restrições</th>
                <th>Tipo &amp; Padrão</th>
                <th>Definição de Negócio</th>
                <th>Classificação LGPD</th>
                <th>Linhagem &amp; Controle de Acesso (RBAC)</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
      </article>
    `);
  });

  nav.innerHTML = navItems.join("");
  document.getElementById("sidebar-count").textContent = `${visibleTables} objetos`;

  if (cardsHtml.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h4>Nenhum atributo ou entidade encontrado</h4>
        <p style="margin-top:6px;">Tente ajustar os termos de busca ou limpar os filtros de domínio, LGPD e chaves.</p>
      </div>
    `;
  } else {
    container.innerHTML = cardsHtml.join("");
  }

  document.getElementById("results-status").innerHTML =
    `Exibindo <strong>${visibleTables}</strong> entidade(s) e <strong>${visibleColumns}</strong> atributo(s) do esquema <code>trans_am_worldwide</code>.`;
}

// ============================================================================
// SYNTAX HIGHLIGHTING PARA SCRIPT DDL SQL
// ============================================================================

function highlightSQL(sql) {
  let escaped = escapeHtml(sql);
  // Comments
  escaped = escaped.replace(/(--[^\n]*)/g, '<span class="sql-com">$1</span>');
  // Strings
  escaped = escaped.replace(/('[^']*')/g, '<span class="sql-str">$1</span>');
  // Keywords
  const keywords = /\b(CREATE|DATABASE|TABLE|VIEW|INDEX|TRIGGER|DROP|IF|EXISTS|NOT|NULL|PRIMARY|KEY|FOREIGN|REFERENCES|ON|DELETE|UPDATE|RESTRICT|CASCADE|SET|UNIQUE|CHECK|DEFAULT|AUTO_INCREMENT|ENGINE|CHARACTER|COLLATE|USE|BEFORE|AFTER|INSERT|FOR|EACH|ROW|BEGIN|END|DECLARE|SELECT|INTO|FROM|WHERE|SIGNAL|SQLSTATE|MESSAGE_TEXT|DELIMITER|AS|INNER|LEFT|JOIN|GROUP|BY|CASE|WHEN|THEN|ELSE)\b/g;
  escaped = escaped.replace(keywords, '<span class="sql-kw">$1</span>');
  // Data types
  const types = /\b(INT|VARCHAR|CHAR|DECIMAL|BOOLEAN|DATETIME|DATE|TEXT|ENUM)\b/g;
  escaped = escaped.replace(types, '<span class="sql-type">$1</span>');
  // Functions
  const funcs = /\b(CURRENT_TIMESTAMP|GREATEST|IFNULL|SUM|COUNT|CONCAT)\b/g;
  escaped = escaped.replace(funcs, '<span class="sql-fn">$1</span>');
  return escaped;
}

// ============================================================================
// MODAL DER: ZOOM & PAN INTERATIVO
// ============================================================================

function initDerViewer() {
  const viewport = document.getElementById("der-viewport");
  const stage = document.getElementById("der-stage");
  const img = document.getElementById("der-image");
  const zoomLabel = document.getElementById("der-zoom-level");

  let scale = 0.65;
  let posX = 20;
  let posY = 20;
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  function applyTransform() {
    stage.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
    zoomLabel.textContent = `${Math.round(scale * 100)}%`;
  }

  function resetView() {
    const vw = viewport.clientWidth || 1000;
    const iw = img.naturalWidth || 1600;
    scale = Math.min(0.95, Math.max(0.35, (vw - 40) / iw));
    posX = Math.max(10, (vw - iw * scale) / 2);
    posY = 16;
    applyTransform();
  }

  document.getElementById("der-zoom-in").addEventListener("click", () => {
    scale = Math.min(2.5, scale + 0.15);
    applyTransform();
  });

  document.getElementById("der-zoom-out").addEventListener("click", () => {
    scale = Math.max(0.25, scale - 0.15);
    applyTransform();
  });

  document.getElementById("der-reset").addEventListener("click", resetView);

  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    scale = Math.min(2.5, Math.max(0.25, scale + delta));
    applyTransform();
  }, { passive: false });

  viewport.addEventListener("mousedown", (e) => {
    isDragging = true;
    startX = e.clientX - posX;
    startY = e.clientY - posY;
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    posX = e.clientX - startX;
    posY = e.clientY - startY;
    applyTransform();
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
  });

  return { resetView };
}

// ============================================================================
// INICIALIZAÇÃO DE EVENTOS
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  updateKPIs();
  renderRules();
  renderCatalog();

  const searchInput = document.getElementById("search-input");
  const clearBtn = document.getElementById("clear-search");

  searchInput.addEventListener("input", (e) => {
    state.search = e.target.value;
    clearBtn.hidden = !state.search;
    renderCatalog();
  });

  clearBtn.addEventListener("click", () => {
    state.search = "";
    searchInput.value = "";
    clearBtn.hidden = true;
    renderCatalog();
    searchInput.focus();
  });

  document.getElementById("lgpd-filter").addEventListener("change", (e) => {
    state.lgpd = e.target.value;
    renderCatalog();
  });

  document.getElementById("key-filter").addEventListener("change", (e) => {
    state.key = e.target.value;
    renderCatalog();
  });

  document.querySelectorAll(".filter-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      state.domain = chip.dataset.domain;
      renderCatalog();
    });
  });

  document.getElementById("btn-expand-all").addEventListener("click", () => {
    document.querySelectorAll(".table-card").forEach(c => c.classList.remove("collapsed"));
  });

  document.getElementById("btn-collapse-all").addEventListener("click", () => {
    document.querySelectorAll(".table-card").forEach(c => c.classList.add("collapsed"));
  });

  // DER Modal
  const derViewer = initDerViewer();
  const modalDer = document.getElementById("modal-der");
  document.getElementById("btn-open-der").addEventListener("click", () => {
    modalDer.hidden = false;
    setTimeout(() => derViewer.resetView(), 30);
  });

  // DDL Modal
  const modalDdl = document.getElementById("modal-ddl");
  document.getElementById("ddl-code-block").innerHTML = highlightSQL(RAW_DDL_SCRIPT);
  document.getElementById("btn-open-ddl").addEventListener("click", () => {
    modalDdl.hidden = false;
  });

  document.getElementById("btn-copy-ddl").addEventListener("click", async () => {
    const label = document.getElementById("copy-ddl-text");
    try {
      await navigator.clipboard.writeText(RAW_DDL_SCRIPT);
      label.textContent = "Copiado com sucesso!";
      setTimeout(() => { label.textContent = "Copiar Script SQL"; }, 2200);
    } catch (err) {
      const ta = document.createElement("textarea");
      ta.value = RAW_DDL_SCRIPT;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      label.textContent = "Copiado com sucesso!";
      setTimeout(() => { label.textContent = "Copiar Script SQL"; }, 2200);
    }
  });

  // Close Modals
  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById(btn.dataset.close).hidden = true;
    });
  });

  document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) backdrop.hidden = true;
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      modalDer.hidden = true;
      modalDdl.hidden = true;
    }
  });
});
