import { z } from "zod";

export const quickOSSchema = z.object({
  empresa_id: z.string().min(1, "Empresa obrigatória"),

  motorista_id: z.string().optional(),
  veiculo_id: z.string().optional(),

  origem: z.string().min(3, "Origem obrigatória"),
  destino: z.string().min(3, "Destino obrigatório"),

  passageiro: z.string().optional(),

  data_execucao: z.string().min(1, "Data obrigatória"),

  horario_inicio: z.string().optional(),

  valor_faturamento: z.coerce.number().min(0),
  valor_custo_motorista: z.coerce.number().optional(),

  data_repasse: z.string().optional(),
})
.superRefine((data, ctx) => {
  // 💰 regra parceiro
  if (data.motorista_id && data.valor_custo_motorista && !data.data_repasse) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe a data de repasse",
      path: ["data_repasse"],
    });
  }
});