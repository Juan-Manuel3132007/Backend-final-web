import { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { ZodError } from "zod";
import { AppError, type FieldError } from "../../application/errors/app-error";
import { MAX_IMAGE_SIZE_MB } from "./upload.middleware";

interface ErrorResponse {
  status: number;
  message: string;
  errors?: FieldError[];
}

function fromZod(error: ZodError): ErrorResponse {
  const errors = error.issues.map((issue) => ({
    field: issue.path.join(".") || "body",
    message: issue.message,
  }));
  return { status: 400, message: "Datos inválidos.", errors };
}

function fromPrisma(error: Prisma.PrismaClientKnownRequestError): ErrorResponse {
  switch (error.code) {
    case "P2002":
      return { status: 409, message: "Ya existe un registro con ese valor único." };
    case "P2003":
      return { status: 400, message: "El registro relacionado no existe." };
    case "P2025":
      return { status: 404, message: "El registro no existe." };
    default:
      return { status: 500, message: "Error en la base de datos." };
  }
}

function fromMulter(error: MulterError): ErrorResponse {
  if (error.code === "LIMIT_FILE_SIZE") {
    return { status: 400, message: `La imagen no puede pesar más de ${MAX_IMAGE_SIZE_MB} MB.` };
  }
  return { status: 400, message: `Archivo inválido: envía una sola imagen en el campo "image".` };
}

function isJsonSyntaxError(error: unknown): boolean {
  return error instanceof SyntaxError && "type" in error && error.type === "entity.parse.failed";
}

function toResponse(error: unknown): ErrorResponse {
  if (error instanceof AppError) {
    return { status: error.statusCode, message: error.message, errors: error.errors };
  }
  if (error instanceof ZodError) return fromZod(error);
  if (error instanceof Prisma.PrismaClientKnownRequestError) return fromPrisma(error);
  if (error instanceof Prisma.PrismaClientValidationError) {
    return { status: 400, message: "Los datos enviados no son válidos." };
  }
  if (error instanceof MulterError) return fromMulter(error);
  if (isJsonSyntaxError(error))
    return { status: 400, message: "El cuerpo de la petición no es un JSON válido." };
  return { status: 500, message: "Error interno del servidor." };
}

/** Último middleware: convierte cualquier error en JSON. Nunca envía el stack trace. */
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const { status, message, errors } = toResponse(error);
  if (status >= 500) {
    console.error(error);
  }
  res.status(status).json(errors ? { message, errors } : { message });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ message: `La ruta ${req.method} ${req.originalUrl} no existe.` });
}
