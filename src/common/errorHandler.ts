import { fromError } from "zod-validation-error";
import * as z from "zod/v4";

// Enum para tipos de errores comunes
export enum ErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
  NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
  CONFLICT_ERROR = "CONFLICT_ERROR",
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

// Interface para errores estructurados
export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: string;
  traceId?: string;
}

// Clase personalizada para errores de la aplicación
export class ApplicationError extends Error {
  public readonly type: ErrorType;
  public readonly code?: string;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: string;
  public readonly traceId?: string;

  constructor(
    type: ErrorType,
    message: string,
    code?: string,
    details?: Record<string, unknown>,
    traceId?: string
  ) {
    super(message);
    this.name = "ApplicationError";
    this.type = type;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.traceId = traceId || crypto.randomUUID();

    // Mantiene el stack trace correcto
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApplicationError);
    }
  }

  toJSON(): AppError {
    return {
      type: this.type,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      traceId: this.traceId,
    };
  }
}

// Función mejorada para manejar errores de Zod
export function handleZodError(error: unknown, traceId?: string): never {
  if (error instanceof z.ZodError) {
    const validationError = fromError(error);
    throw new ApplicationError(
      ErrorType.VALIDATION_ERROR,
      validationError.message,
      "ZOD_VALIDATION_FAILED",
      {
        issues: error.issues,
        path: error.issues.map((issue) => issue.path.join(".")).join(", "),
        invalidFields: error.issues.length,
      },
      traceId
    );
  }

  // Si no es un error de Zod, relanza el error original
  throw error;
}

// Función para manejar diferentes tipos de errores
export function handleError(error: unknown, context?: string, traceId?: string): ApplicationError {
  // Si ya es una ApplicationError, la retornamos
  if (error instanceof ApplicationError) {
    return error;
  }

  // Manejo de errores de Zod
  if (error instanceof z.ZodError) {
    const validationError = fromError(error);
    return new ApplicationError(
      ErrorType.VALIDATION_ERROR,
      validationError.message,
      "ZOD_VALIDATION_FAILED",
      {
        issues: error.issues,
        context,
        invalidFields: error.issues.length,
      },
      traceId
    );
  }

  // Manejo de errores de red/fetch
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return new ApplicationError(
      ErrorType.NETWORK_ERROR,
      "Network request failed",
      "NETWORK_REQUEST_FAILED",
      { originalError: error.message, context },
      traceId
    );
  }

  // Manejo de errores genéricos de Error
  if (error instanceof Error) {
    // Detectar errores comunes por mensaje
    if (error.message.toLowerCase().includes("unauthorized")) {
      return new ApplicationError(
        ErrorType.AUTHENTICATION_ERROR,
        "Authentication failed",
        "UNAUTHORIZED",
        { originalError: error.message, context },
        traceId
      );
    }

    if (error.message.toLowerCase().includes("forbidden")) {
      return new ApplicationError(
        ErrorType.AUTHORIZATION_ERROR,
        "Access denied",
        "FORBIDDEN",
        { originalError: error.message, context },
        traceId
      );
    }

    if (error.message.toLowerCase().includes("not found")) {
      return new ApplicationError(
        ErrorType.NOT_FOUND_ERROR,
        "Resource not found",
        "NOT_FOUND",
        { originalError: error.message, context },
        traceId
      );
    }

    return new ApplicationError(
      ErrorType.UNKNOWN_ERROR,
      error.message,
      "GENERIC_ERROR",
      { originalError: error.message, context },
      traceId
    );
  }

  // Manejo de errores que no son instancias de Error
  return new ApplicationError(
    ErrorType.UNKNOWN_ERROR,
    "An unknown error occurred",
    "UNKNOWN_ERROR",
    { originalError: String(error), context },
    traceId
  );
}

// Función para crear errores específicos fácilmente
export const createError = {
  validation: (message: string, details?: Record<string, unknown>, traceId?: string) =>
    new ApplicationError(ErrorType.VALIDATION_ERROR, message, "VALIDATION_ERROR", details, traceId),

  notFound: (resource: string, traceId?: string) =>
    new ApplicationError(
      ErrorType.NOT_FOUND_ERROR,
      `${resource} not found`,
      "NOT_FOUND",
      { resource },
      traceId
    ),

  unauthorized: (message = "Authentication required", traceId?: string) =>
    new ApplicationError(
      ErrorType.AUTHENTICATION_ERROR,
      message,
      "UNAUTHORIZED",
      undefined,
      traceId
    ),

  forbidden: (message = "Access denied", traceId?: string) =>
    new ApplicationError(ErrorType.AUTHORIZATION_ERROR, message, "FORBIDDEN", undefined, traceId),

  conflict: (message: string, details?: Record<string, unknown>, traceId?: string) =>
    new ApplicationError(ErrorType.CONFLICT_ERROR, message, "CONFLICT", details, traceId),

  database: (message: string, details?: Record<string, unknown>, traceId?: string) =>
    new ApplicationError(ErrorType.DATABASE_ERROR, message, "DATABASE_ERROR", details, traceId),

  network: (
    message = "Network error occurred",
    details?: Record<string, unknown>,
    traceId?: string
  ) => new ApplicationError(ErrorType.NETWORK_ERROR, message, "NETWORK_ERROR", details, traceId),

  rateLimit: (message = "Rate limit exceeded", traceId?: string) =>
    new ApplicationError(
      ErrorType.RATE_LIMIT_ERROR,
      message,
      "RATE_LIMIT_EXCEEDED",
      undefined,
      traceId
    ),
};

// Función para logging de errores (placeholder para futura implementación)
export function logError(error: ApplicationError, context?: string): void {
  // En desarrollo, mostramos el error en consola
  if (process.env.NODE_ENV === "development") {
    console.error(`[${error.type}] ${error.message}`, {
      code: error.code,
      details: error.details,
      timestamp: error.timestamp,
      traceId: error.traceId,
      context,
      stack: error.stack,
    });
  }

  // Aquí se podría integrar con servicios de logging como Sentry, DataDog, etc.
  // Example: Sentry.captureException(error);
}

// Función para determinar si un error debe mostrarse al usuario
export function isUserFacingError(error: ApplicationError): boolean {
  return [
    ErrorType.VALIDATION_ERROR,
    ErrorType.NOT_FOUND_ERROR,
    ErrorType.AUTHENTICATION_ERROR,
    ErrorType.AUTHORIZATION_ERROR,
    ErrorType.CONFLICT_ERROR,
    ErrorType.RATE_LIMIT_ERROR,
  ].includes(error.type);
}

// Función para obtener un mensaje amigable para el usuario
export function getUserFriendlyMessage(error: ApplicationError): string {
  switch (error.type) {
    case ErrorType.VALIDATION_ERROR:
      return "Please check your input data and try again.";
    case ErrorType.NOT_FOUND_ERROR:
      return "The requested resource was not found.";
    case ErrorType.AUTHENTICATION_ERROR:
      return "Please log in to continue.";
    case ErrorType.AUTHORIZATION_ERROR:
      return "You don't have permission to perform this action.";
    case ErrorType.NETWORK_ERROR:
      return "Network error. Please check your connection and try again.";
    case ErrorType.RATE_LIMIT_ERROR:
      return "Too many requests. Please wait and try again.";
    case ErrorType.CONFLICT_ERROR:
      return "There was a conflict with your request. Please try again.";
    case ErrorType.DATABASE_ERROR:
      return "A database error occurred. Please try again later.";
    default:
      return "An unexpected error occurred. Please try again later.";
  }
}
