import { z } from "zod";
import { emptyToUndefined, pageQuerySchema } from "./common.dto";

export const categoryBodySchema = z.object({
  name: z
    .string({ error: "El nombre es obligatorio." })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(60, "El nombre no puede superar 60 caracteres."),
  description: z
    .string({ error: "La descripción debe ser texto." })
    .trim()
    .max(300, "La descripción no puede superar 300 caracteres.")
    .optional()
    .transform((value) => value || null),
});

export const categoryQuerySchema = pageQuerySchema.extend({
  search: z.preprocess(emptyToUndefined, z.string().trim().max(60).optional()),
});
