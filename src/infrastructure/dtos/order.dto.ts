import { z } from "zod";
import { ORDER_STATUSES } from "../../domain/models/order";
import { emptyToUndefined, pageQuerySchema } from "./common.dto";

const statusSchema = z.enum(ORDER_STATUSES, { error: `El estado debe ser uno de: ${ORDER_STATUSES.join(", ")}.` });

const itemSchema = z.object({
  productId: z.coerce.number({ error: "productId debe ser un número." }).int().positive("productId no es válido."),
  quantity: z.coerce
    .number({ error: "La cantidad debe ser un número." })
    .int("La cantidad debe ser un número entero.")
    .min(1, "La cantidad mínima es 1.")
    .max(20, "La cantidad máxima por producto es 20."),
});

/** Acepta { items: [...] } o, por comodidad, { productId, quantity } para un solo producto. */
export const createOrderSchema = z
  .object({
    shippingAddress: z
      .string({ error: "La dirección de envío es obligatoria." })
      .trim()
      .min(5, "La dirección de envío debe tener al menos 5 caracteres.")
      .max(200, "La dirección de envío no puede superar 200 caracteres."),
    items: z.array(itemSchema).min(1, "El pedido debe tener al menos un producto.").max(20).optional(),
    productId: itemSchema.shape.productId.optional(),
    quantity: itemSchema.shape.quantity.optional(),
  })
  .transform((body, ctx) => {
    const items =
      body.items ?? (body.productId ? [{ productId: body.productId, quantity: body.quantity ?? 1 }] : []);
    if (items.length === 0) {
      ctx.addIssue({ code: "custom", path: ["items"], message: "El pedido debe tener al menos un producto." });
      return z.NEVER;
    }
    return { shippingAddress: body.shippingAddress, items };
  });

export const updateOrderStatusSchema = z.object({ status: statusSchema });

export const orderQuerySchema = pageQuerySchema.extend({
  status: z.preprocess(emptyToUndefined, statusSchema.optional()),
});
