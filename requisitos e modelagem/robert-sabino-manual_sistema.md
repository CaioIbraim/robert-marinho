# 📘 Manual de Utilização — Robert Marinho Logística

> **Sistema de Gestão Logística** — Versão 2.0  
> Acesso: [www.robertmarinho.com.br](https://www.robertmarinho.com.br)


---

## 🗺️ Mapa de Acesso por Perfil

| Perfil | URL de Login | Dashboard |
|---|---|---|
| **Administrador / Operador** | `www.robertmarinho.com.br/admin/login` | `/admin/dashboard` |
| **Cliente / Empresa** | `www.robertmarinho.com.br/portal/login` | `/portal/dashboard` |
| **Motorista** | `www.robertmarinho.com.br/motorista/login` | `/motorista/dashboard` |


---

## 👑 Manual do Administrador

### 1. Como acessar o sistema

1. Acesse `/admin/login`
2. Insira seu **e-mail** e **senha** cadastrados pelo administrador
3. Você será redirecionado ao painel administrativo em `/admin/dashboard`

---

### 2. Dashboard

O Dashboard exibe os **KPIs da operação** com base no filtro de datas selecionado:

- **Ordens Hoje / por Período**: Contador dinâmico. Quando você aplica um filtro de intervalo (ex: 01/04 a 27/04), o título muda automaticamente para mostrar o período.
- **Motoristas Ativos**: Quantidade de motoristas com status `ativo`
- **Veículos Ativos**: Frota com status `ativo`
- **Faturamento e Custos**: Totais financeiros do período filtrado

**Filtros Disponíveis:**
- Data início / Data fim
- Por empresa clientes
- Por veículo

---

### 3. Ordens de Serviço

**Criar nova OS:**

1. Acesse `/ordens` e clique em **Nova OS**
2. O formulário está dividido em seções:
   - **Empresa e Passageiro**: Selecione a empresa cliente e dados do passageiro
   - **Motorista e Veículo**: Atribua o motorista e o veículo responsáveis
   - **Trajeto (Tarifário)**: Selecione o trajeto da tabela de tarifas (auto-popula o valor)
   - **Cronograma**: Data do serviço, **Check-in** e **Check-out** (apenas hora HH:mm)
   - **Financeiro**: Valor do frete e status

**Paradas Programadas:**

Na aba "Rotas e Paradas" do formulário, você pode adicionar N paradas intermediárias com:
- Endereço/Ponto
- Horário Previsto
- Observações (ex: "Coleta de carga", "Entrega expressa")
- As paradas são salvas na tabela `ordem_servico_paradas`

**Status possíveis:** `Pendente` → `Em Andamento` → `Concluído` | `Cancelado`

---

### 4. Fechamento Financeiro (`/fechamento`)

Tela de auditoria pós-viagem para Ordens com status **Concluído**:

1. Selecione a OS na lista à esquerda
2. Preencha os dados de fechamento:
   - **KM Inicial e Final** (o sistema calcula o Total automaticamente)
   - **Custos**: Pedágio, Estacionamento, Extra Terceiros
   - **Horas de Parada**: Informe os minutos e o valor/hora (total calculado automaticamente)
   - **NF-e** e **Observações Financeiras**
3. Visualize o **Resumo Financeiro** com Lucro Líquido em tempo real
4. Ao marcar como **Conferida**, a OS é travada para edições

---

### 5. Gestão de Empresas, Motoristas e Veículos

- **Empresas** (`/empresas`): CRUD completo. Cada empresa pode ter ordens vinculadas.
- **Motoristas** (`/motoristas`): CRUD com dados de CNH, PIX, tipo de vínculo (fixo/terceiro) e status operacional.
- **Veículos** (`/veiculos`): CRUD com controle de KM, status operacional e manutenções.

---

### 6. Financeiro (`/financeiro`)

Gerenciamento de recebimentos vinculados às Ordens de Serviço:
- Filtros por empresa, status e data
- Exportação para Excel e PDF

---

### 7. Gestão de Notificações

Acesse `/notificacoes` para visualizar alertas do sistema (ex: aprovações pendentes, ordens concluídas).

---

## 🚛 Manual do Motorista

### 1. Como acessar

1. Acesse `/motorista/login`
2. Insira seu **e-mail** e **senha** fornecidos pela equipe operacional
3. Você será direcionado ao **Painel do Motorista**

> ⚠️ Seu perfil precisa estar **vinculado** a um cadastro de motorista pelo administrador para visualizar suas corridas.

---

### 2. Visualizando suas Corridas

Na tela principal você verá todas as OSs **Pendentes** e **Em Andamento** atribuídas ao seu CPF/Perfil.

Cada card mostra:
- Origem → Destino
- Número da OS
- Status atual
- Data e hora de execução

---

### 3. Executando uma Corrida

Clique em uma corrida para ver os detalhes:

1. **Check-in**: Toque em "Fazer Check-in" para registrar o início da corrida (salva `horario_inicio`)
2. **Paradas**: Execute o check-in de cada parada intermediária clicando no botão **Check-in** ao lado de cada ponto — isso registra `horario_realizado` e marca `realizada = true`
3. **Check-out**: Após concluir, toque em "Fazer Check-out" (salva `horario_fim`)

---

## 🏢 Manual do Cliente / Empresa

### 1. Como solicitar acesso

1. Acesse `/portal/login`
2. Clique em **"Solicite aqui"** para cadastro
3. Preencha seus dados (Nome, Empresa, CNPJ, E-mail, Senha)
4. Após o cadastro, clique em **"Notificar via WhatsApp"** para agilizar a aprovação

> ⏳ Seu acesso estará disponível após aprovação por um administrador do sistema.

---

### 2. Primeira entrada após aprovação

1. Acesse `/portal/login`
2. Insira seu e-mail e senha cadastrados
3. Você verá apenas as ordens de serviço vinculadas à **sua empresa**

---

### 3. Painel do Cliente

O portal exibe:
- **Ordens Ativas**: Lista de OSs com status, origem, destino e motorista
- **Notificações**: Atualizações sobre suas solicitações
- **Histórico**: Corridas concluídas com detalhes financeiros

---

## 🔒 Regras de Acesso (RBAC)

| Ação | admin | operador | motorista | cliente |
|---|:---:|:---:|:---:|:---:|
| Dashboard Admin | ✅ | ✅ | ❌ | ❌ |
| Criar/Editar OS | ✅ | ✅ | ❌ | ❌ |
| Fechamento Financeiro | ✅ | ✅ | ❌ | ❌ |
| Aprovar Usuários | ✅ | ✅ | ❌ | ❌ |
| Portal do Cliente | ❌ | ❌ | ❌ | ✅ |
| Dashboard Motorista | ❌ | ❌ | ✅ | ❌ |
| Check-in em Paradas | ❌ | ❌ | ✅ | ❌ |

---

## 🛠️ Suporte Técnico

- **WhatsApp**: [+55 21 99330-6919](https://wa.me/5521993306919)
- **E-mail**: logistica.robertmarinho@gmail.com
- **Horário**: 24h / 7 dias por semana
