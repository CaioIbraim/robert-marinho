import { z } from 'zod';

export const empresaSchema = z.object({
  razao_social: z.string().min(3, 'Razão social deve ter pelo menos 3 caracteres'),
  nome_fantasia: z.string().optional(),
  cnpj: z.string().min(14, 'CNPJ inválido').max(18),
  email: z.string().email('Email inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  status: z.string().optional(),
});

export const motoristaSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpf: z.string().min(11, 'CPF inválido').max(14),
  telefone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
  cnh: z.string().min(5, 'CNH inválida'),
  categoria_cnh: z.string().optional(),
  validade_cnh: z.string().optional(),
  tipo_vinculo: z.enum(['fixo', 'terceiro']).default('fixo'),
  pix_key: z.string().optional(),
  status: z.string().optional(),
});

export const veiculoSchema = z.object({
  placa: z.string().min(7, 'Placa inválida').max(8),
  modelo: z.string().min(2, 'Modelo inválido'),
  capacidade: z.coerce.number().min(0).optional(),
  meta_faturamento: z.coerce.number().min(0).optional(),
  status: z.enum(['ativo', 'inativo']).optional(),
});

export const ordemServicoSchema = z.object({
  empresa_id: z.string().uuid('Selecione uma empresa'),
  motorista_id: z.string().uuid('Selecione um motorista'),
  veiculo_id: z.string().uuid('Selecione um veículo'),
  tarifario_id: z.string().uuid().optional().or(z.literal('')),
  origem: z.string().min(2, 'Origem inválida'),
  destino: z.string().min(2, 'Destino inválido'),
  passageiro: z.string().optional(),
  voucher: z.string().optional(),

  horario_inicio: z.string().nullable().optional(),
  horario_fim: z.string().nullable().optional(),

  data_execucao: z.string().min(1, 'Data de execução é obrigatória'),
  valor_faturamento: z.coerce.number().min(0, 'Valor deve ser positivo'),
  valor_custo_motorista: z.coerce.number().min(0).optional(),
  status: z.enum(['pendente', 'em_andamento', 'concluido', 'cancelado']),
});

export const tarifarioSchema = z.object({
  origem: z.string().min(2, 'Origem inválida'),
  destino: z.string().min(2, 'Destino inválida'),
  valor_venda: z.coerce.number().min(0, 'Valor de venda deve ser positivo'),
  valor_custo: z.coerce.number().min(0).optional(),
  descricao: z.string().optional(),
});

export type EmpresaFormData = z.infer<typeof empresaSchema>;
export type MotoristaFormData = z.infer<typeof motoristaSchema>;
export type VeiculoFormData = z.infer<typeof veiculoSchema>;
export type OrdemServicoFormData = z.infer<typeof ordemServicoSchema>;
export type TarifarioFormData = z.infer<typeof tarifarioSchema>;
