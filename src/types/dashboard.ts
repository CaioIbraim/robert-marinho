export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  empresaId: string;
  veiculoId: string;
  motoristaId: string;
}

export interface DashboardData {
  ordens: number;
  motoristas: number;
  veiculos: number;
  faturamento: number;
  repasse: number;
  lucro: number;
  ordensList: Array<{ data_execucao: string | null }>;
}

export interface ComparativoData {
  ontem: number;
}

export interface Empresa {
  id: string;
  razao_social: string;
}

export interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
}

export interface Motorista {
  id: string;
  nome: string;
}