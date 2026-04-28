export type UserProfile = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'admin' | 'operador' | 'motorista' | 'cliente';
  empresa_id?: string;
  status?: 'pendente' | 'aprovado' | 'bloqueado';
};

export type Empresa = {
  id: string;
  razao_social: string;
  nome_fantasia?: string;
  cnpj: string;
  email: string;
  telefone: string;
  status: string;
  created_at: string;
  updated_at?: string;
};

export type Motorista = {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email?: string;
  cnh: string;
  categoria_cnh?: string;
  validade_cnh?: string;
  tipo_vinculo: 'fixo' | 'terceiro';
  pix_key?: string;
  status: string;
  created_at: string;
  updated_at?: string;
};

export type Veiculo = {
  id: string;
  placa: string;
  modelo: string;
  capacidade?: number;
  meta_faturamento?: number;
  meta_faturamento_mensal?: number;
  faturamento_real?: number; 
  status: 'ativo' | 'inativo';
  created_at: string;
};

export type Tarifario = {
  id: string;
  origem: string;
  destino: string;
  valor_venda: number;
  valor_custo?: number;
  descricao?: string;
  created_at: string;
};

export type OrdemServico = {
  id: string;
  numero_os?: string;
  empresa_id: string;
  cliente_final_id?: string;
  motorista_id: string;
  veiculo_id: string;
  tarifario_id?: string;
  origem: string;
  destino: string;
  passageiro?: string;
  voucher?: string;
  data_execucao: string;
  horario_inicio?: string;
  horario_fim?: string;
  valor_faturamento: number;
  valor_custo_motorista?: number;
  status: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
  financeiro_status: 'pendente' | 'pago';
  created_at: string;

  // Identificação e Aprovação
  atividade_motivo?: string;
  divisao_departamento?: string;
  autorizado_por?: string;
  centro_custo_cliente?: string;
  numero_requisicao_bu?: string;
  forma_faturamento?: string;
  numero_cte?: string;
  numero_nfe?: string;

  // Geolocalização
  origem_latitude?: number;
  origem_longitude?: number;
  destino_latitude?: number;
  destino_longitude?: number;
  trajeto_manual?: boolean;
  tipo_cobranca?: string;
  possui_retorno?: boolean;
  classificacao_trajeto?: string;

  // Fechamento financeiro / KM
  km_inicial?: number;
  km_final?: number;
  km_total_rodado?: number;
  valor_custo_estacionamento?: number;
  valor_custo_pedagio?: number;
  valor_custo_extra_terceiros?: number;

  // Horas de parada
  tempo_hora_parada?: string; // interval HH:MM:SS
  valor_unitario_hora_parada?: number;
  valor_total_hora_parada?: number;
  obs_hora_parada?: string;

  // Auditoria financeira
  resumo_financeiro?: string;
  observacoes_financeiras?: string;
  conferida_financeiro?: boolean;
  observacoes_gerais?: string;

  // Joins
  empresa?: Empresa;
  motorista?: Motorista;
  veiculo?: Veiculo;
  tarifario?: Tarifario;
};


export type Financeiro = {
  id: string;
  ordem_id: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: 'pendente' | 'pago';
  created_at: string;
  
  // Joins
  ordem?: OrdemServico;
};
