import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string({ error: "El nombre es obligatorio." })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(100, "El nombre no puede superar 100 caracteres."),
  email: z.email({ error: "El correo no tiene un formato válido." }).max(150),
  password: z
    .string({ error: "La contraseña es obligatoria." })
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(72, "La contraseña no puede superar 72 caracteres."),
});

export const loginSchema = z.object({
  email: z.email({ error: "El correo no tiene un formato válido." }),
  password: z.string({ error: "La contraseña es obligatoria." }).min(1, "La contraseña es obligatoria."),
});
