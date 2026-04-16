export type UserProfile = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'admin' | 'operator' | 'driver';
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
