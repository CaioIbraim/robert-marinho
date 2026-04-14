import { z } from 'zod';

export const empresaSchema = z.object({
  razao_social: z.string().min(3, 'Razão social deve ter pelo menos 3 caracteres'),
  nome_fantasia: z.string().optional(),
  cnpj: z.string().min(14, 'CNPJ inválido').max(18),
  email: z.string().email('Email inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  status: z.string().default('ativo'),
});

export const motoristaSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpf: z.string().min(11, 'CPF inválido').max(14),
  telefone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('Email inválido').optional(),
  cnh: z.string().min(5, 'CNH inválida'),
  categoria_cnh: z.string().optional(),
  validade_cnh: z.string().optional(),
  status: z.string().default('ativo'),
});

export const veiculoSchema = z.object({
  placa: z.string().min(7, 'Placa inválida').max(8),
  modelo: z.string().min(2, 'Modelo inválido'),
  capacidade: z.coerce.number().min(0).optional(),
  status: z.string().default('disponivel'),
});

export const ordemServicoSchema = z.object({
  empresa_id: z.string().uuid('Selecione uma empresa'),
  motorista_id: z.string().uuid('Selecione um motorista'),
  veiculo_id: z.string().uuid('Selecione um veículo'),
  origem: z.string().min(3, 'Origem inválida'),
  destino: z.string().min(3, 'Destino inválido'),
  valor_total: z.coerce.number().min(0, 'Valor deve ser positivo'),
  status: z.enum(['pendente', 'em_transito', 'concluida', 'cancelada']),
});

export type EmpresaFormData = z.infer<typeof empresaSchema>;
export type MotoristaFormData = z.infer<typeof motoristaSchema>;
export type VeiculoFormData = z.infer<typeof veiculoSchema>;
export type OrdemServicoFormData = z.infer<typeof ordemServicoSchema>;
