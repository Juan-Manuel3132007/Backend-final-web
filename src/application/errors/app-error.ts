export interface FieldError {
  field: string;
  message: string;
}

/** Error de negocio con su código HTTP. Lo traduce a respuesta el middleware de errores. */
export class AppError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly errors?: FieldError[],
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, errors?: FieldError[]) {
    super(message, 400, errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Debes iniciar sesión para continuar.") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "No tienes permiso para realizar esta acción.") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}
