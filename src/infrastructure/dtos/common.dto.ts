import { z } from "zod";

export const idParamSchema = z.object({
  id: z.coerce
    .number({ error: "El id debe ser un número." })
    .int("El id debe ser un número entero.")
    .positive("El id debe ser mayor que cero."),
});

export const pageQuerySchema = z.object({
  page: z.coerce
    .number({ error: "page debe ser un número." })
    .int("page debe ser un número entero.")
    .positive("page debe ser mayor que cero.")
    .default(1),
  limit: z.coerce
    .number({ error: "limit debe ser un número." })
    .int("limit debe ser un número entero.")
    .positive("limit debe ser mayor que cero.")
    .max(100, "limit no puede ser mayor que 100.")
    .default(10),
});

/** Convierte "" en undefined: el frontend puede mandar filtros vacíos. */
export const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);
