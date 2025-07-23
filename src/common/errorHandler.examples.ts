// @ts-nocheck
// This file contains examples of how to use the error handling utilities

import {
  ApplicationError,
  ErrorType,
  handleError,
  createError,
  logError,
  isUserFacingError,
  getUserFriendlyMessage,
} from "./errorHandler";

/**
 * Ejemplos de uso del errorHandler mejorado
 */

// Ejemplo 1: Manejo de errores en un API Route de Next.js
export async function apiRouteExample() {
  try {
    // Simulación de lógica de API
    const result = await someApiLogic();
    return Response.json(result);
  } catch (error) {
    const appError = handleError(error, "API Route Handler");
    logError(appError);

    // Determinar qué responder al cliente
    if (isUserFacingError(appError)) {
      return Response.json(
        {
          error: {
            message: getUserFriendlyMessage(appError),
            code: appError.code,
            traceId: appError.traceId,
          },
        },
        { status: getStatusCode(appError.type) }
      );
    }

    // Para errores internos, no exponer detalles
    return Response.json(
      {
        error: {
          message: "Internal server error",
          traceId: appError.traceId,
        },
      },
      { status: 500 }
    );
  }
}

// Ejemplo 2: Hook personalizado para manejo de errores en React
export function useErrorHandler() {
  const [error, setError] = useState<ApplicationError | null>(null);

  const handleErrorCallback = useCallback((error: unknown, context?: string) => {
    const appError = handleError(error, context);
    logError(appError);
    setError(appError);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError: handleErrorCallback,
    clearError,
    isUserFacing: error ? isUserFacingError(error) : false,
    userMessage: error ? getUserFriendlyMessage(error) : null,
  };
}

// Ejemplo 3: Middleware para wrappear handlers de API
export function withErrorHandling<T extends unknown[], R>(handler: (...args: T) => Promise<R>) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      const appError = handleError(error, "API Middleware");
      logError(appError);
      throw appError; // Re-lanzar el error estructurado
    }
  };
}

// Ejemplo 4: Creación de errores específicos para diferentes escenarios
export function businessLogicExamples(email: string, user: unknown, resource: unknown) {
  // Error de validación
  if (!isValidEmail(email)) {
    throw createError.validation("Invalid email format", { email });
  }

  // Error de recurso no encontrado
  if (!user) {
    throw createError.notFound("User");
  }

  // Error de autorización
  if (!hasPermission(user, resource)) {
    throw createError.forbidden("You don't have access to this resource");
  }

  // Error de conflicto (ej: email duplicado)
  const emailExists = true; // Simulación
  if (emailExists) {
    throw createError.conflict("Email already in use", { email });
  }

  // Error de red/external service
  throw createError.network("Failed to connect to external service", {
    service: "user-validation-api",
    endpoint: "/validate",
  });
}

// Ejemplo 5: Función helper para manejar errores async/await
export async function safeAsyncOperation<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<{ success: true; data: T } | { success: false; error: ApplicationError }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const appError = handleError(error, context);
    logError(appError);
    return { success: false, error: appError };
  }
}

// Ejemplo 6: Validación con manejo de errores personalizado
export function validateUserInput(input: unknown): { name: string; email: string } {
  try {
    // Simulación de validación con Zod
    if (!input || typeof input !== "object") {
      throw createError.validation("Input must be an object");
    }

    const data = input as Record<string, unknown>;

    if (!data.name || typeof data.name !== "string") {
      throw createError.validation("Name is required and must be a string");
    }

    if (!data.email || typeof data.email !== "string" || !isValidEmail(data.email)) {
      throw createError.validation("Valid email is required");
    }

    return {
      name: data.name,
      email: data.email,
    };
  } catch (error) {
    // Si ya es un ApplicationError, lo relanzamos
    if (error instanceof ApplicationError) {
      throw error;
    }

    // Si no, lo manejamos
    throw handleError(error, "validateUserInput");
  }
}

// Utilidades de soporte

function getStatusCode(errorType: ErrorType): number {
  switch (errorType) {
    case ErrorType.VALIDATION_ERROR:
      return 400;
    case ErrorType.AUTHENTICATION_ERROR:
      return 401;
    case ErrorType.AUTHORIZATION_ERROR:
      return 403;
    case ErrorType.NOT_FOUND_ERROR:
      return 404;
    case ErrorType.CONFLICT_ERROR:
      return 409;
    case ErrorType.RATE_LIMIT_ERROR:
      return 429;
    case ErrorType.DATABASE_ERROR:
    case ErrorType.NETWORK_ERROR:
    case ErrorType.UNKNOWN_ERROR:
    default:
      return 500;
  }
}

async function someApiLogic(): Promise<{ data: string }> {
  // Simulación de lógica de API
  return { data: "example" };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hasPermission(user: unknown, resource: unknown): boolean {
  // Simulación de lógica de permisos
  return true;
}

function useCallback(arg0: () => void, arg1: never[]) {
  throw new Error("Function not implemented.");
}
// Estas importaciones serían necesarias en un archivo real de React
// import { useState, useCallback } from 'react';
