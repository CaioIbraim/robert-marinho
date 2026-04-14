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
  status: string;
  created_at: string;
  updated_at?: string;
};

export type Veiculo = {
  id: string;
  placa: string;
  modelo: string;
  capacidade?: number;
  status: string;
  created_at: string;
};

export type OrdemServico = {
  id: string;
  empresa_id: string;
  motorista_id: string;
  veiculo_id: string;
  origem: string;
  destino: string;
  valor_total: number;
  status: 'pendente' | 'em_transito' | 'concluida' | 'cancelada';
  financeiro_status: 'pendente' | 'pago';
  created_at: string;
  
  // Joins
  empresa?: Empresa;
  motorista?: Motorista;
  veiculo?: Veiculo;
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
