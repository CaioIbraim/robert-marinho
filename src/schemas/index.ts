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
  veiculo_id: z.string().uuid().nullable().optional(),
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
  // === ABA 1: OPERACIONAL ===
  empresa_id: z.string().uuid('Selecione uma empresa válida'),
  motorista_id: z.string().uuid().nullable().optional(),
  veiculo_id: z.string().uuid().nullable().optional(),
  numero_os: z.string().nullable().optional(),
  data_execucao: z.string().min(1, 'Data de execução é obrigatória'),
  horario_inicio: z.string().nullable().optional(),
  horario_fim: z.string().nullable().optional(),
  status: z.enum(['pendente', 'em_andamento', 'concluido', 'cancelado']),
  passageiro: z.string().nullable().optional(),
  nome_passageiro: z.string().nullable().optional(),
  voucher: z.string().nullable().optional(),

  // === ABA 2: CLIENTE & TARIFAS ===
  tarifario_id: z.string().uuid().nullable().optional().or(z.literal('')),
  origem: z.string().min(2, 'Origem inválida'),
  destino: z.string().min(2, 'Destino inválido'),
  valor_faturamento: z.coerce.number().min(0, 'Valor deve ser positivo'),
  valor_custo_motorista: z.coerce.number().nullable().optional(),
  tipo_cobranca: z.string().nullable().optional(),
  possui_retorno: z.boolean().nullable().optional(),
  classificacao_trajeto: z.string().nullable().optional(),
  atividade_motivo: z.string().nullable().optional(),
  divisao_departamento: z.string().nullable().optional(),
  autorizado_por: z.string().nullable().optional(),
  centro_custo_cliente: z.string().nullable().optional(),
  numero_requisicao_bu: z.string().nullable().optional(),
  forma_faturamento: z.string().nullable().optional(),
  observacoes_gerais: z.string().nullable().optional(),

  // === ABA 3: ROTAS E PARADAS ===
  trajeto_manual: z.boolean().nullable().optional(),
  origem_latitude: z.coerce.number().nullable().optional(),
  origem_longitude: z.coerce.number().nullable().optional(),
  destino_latitude: z.coerce.number().nullable().optional(),
  destino_longitude: z.coerce.number().nullable().optional(),
});

export const tarifarioSchema = z.object({
  origem: z.string().min(2, 'Origem inválida'),
  destino: z.string().min(2, 'Destino inválida'),
  valor_venda: z.coerce.number().min(0, 'Valor de venda deve ser positivo'),
  valor_custo: z.coerce.number().min(0).optional(),
  descricao: z.string().optional(),
});

// Política de senha forte: mínimo 8 chars, maiúscula, minúscula, número e símbolo
export const senhaFortaSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .regex(/[A-Z]/, 'Adicione pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Adicione pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Adicione pelo menos um número')
  .regex(/[^A-Za-z0-9]/, 'Adicione pelo menos um símbolo (ex: @, #, !)');

export type EmpresaFormData = z.infer<typeof empresaSchema>;
export type MotoristaFormData = z.infer<typeof motoristaSchema>;
export type VeiculoFormData = z.infer<typeof veiculoSchema>;
export type OrdemServicoFormData = z.infer<typeof ordemServicoSchema>;
export type TarifarioFormData = z.infer<typeof tarifarioSchema>;
