import { z } from "zod";
import { PLATFORMS } from "../../domain/models/product";
import { emptyToUndefined, pageQuerySchema } from "./common.dto";

const platformSchema = z.enum(PLATFORMS, { error: `La plataforma debe ser una de: ${PLATFORMS.join(", ")}.` });

/** Llega como multipart/form-data, así que los números vienen como texto y se convierten. */
export const productBodySchema = z.object({
  name: z
    .string({ error: "El nombre es obligatorio." })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(120, "El nombre no puede superar 120 caracteres."),
  description: z
    .string({ error: "La descripción es obligatoria." })
    .trim()
    .min(10, "La descripción debe tener al menos 10 caracteres.")
    .max(2000, "La descripción no puede superar 2000 caracteres."),
  price: z.coerce
    .number({ error: "El precio debe ser un número." })
    .positive("El precio debe ser mayor que cero.")
    .max(9_999_999_999, "El precio es demasiado alto."),
  stock: z.coerce
    .number({ error: "El stock debe ser un número." })
    .int("El stock debe ser un número entero.")
    .min(0, "El stock no puede ser negativo."),
  platform: platformSchema,
  categoryId: z.coerce
    .number({ error: "La categoría es obligatoria." })
    .int("La categoría no es válida.")
    .positive("La categoría es obligatoria."),
});

export const productQuerySchema = pageQuerySchema.extend({
  search: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
  categoryId: z.preprocess(
    emptyToUndefined,
    z.coerce.number({ error: "categoryId debe ser un número." }).int().positive().optional(),
  ),
  platform: z.preprocess(emptyToUndefined, platformSchema.optional()),
  minPrice: z.preprocess(
    emptyToUndefined,
    z.coerce.number({ error: "minPrice debe ser un número." }).min(0, "minPrice no puede ser negativo.").optional(),
  ),
  maxPrice: z.preprocess(
    emptyToUndefined,
    z.coerce.number({ error: "maxPrice debe ser un número." }).min(0, "maxPrice no puede ser negativo.").optional(),
  ),
});
