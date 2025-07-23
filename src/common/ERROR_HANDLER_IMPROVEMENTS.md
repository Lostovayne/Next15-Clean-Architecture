# Error Handler Mejorado

## Resumen de Mejoras

El `errorHandler` ha sido significativamente mejorado para proporcionar un sistema robusto y completo de manejo de errores que sigue las mejores prácticas de arquitectura limpia y TypeScript.

## 🚀 Características Principales

### 1. **Sistema de Tipos Estructurado**

- **Enum `ErrorType`**: Categorización clara de errores (validación, red, base de datos, autenticación, etc.)
- **Interface `AppError`**: Estructura consistente para todos los errores
- **Clase `ApplicationError`**: Error personalizado con metadatos enriquecidos

### 2. **Metadatos Enriquecidos**

- **Trace ID**: Identificador único para seguimiento de errores
- **Timestamp**: Marca temporal automática
- **Contexto**: Información sobre dónde ocurrió el error
- **Detalles**: Información adicional específica del error
- **Código de error**: Identificador específico para el tipo de error

### 3. **Funciones de Utilidad**

- **`handleError()`**: Manejo centralizado de cualquier tipo de error
- **`createError`**: Factory para crear errores específicos fácilmente
- **`logError()`**: Logging inteligente de errores
- **`isUserFacingError()`**: Determina si un error debe mostrarse al usuario
- **`getUserFriendlyMessage()`**: Genera mensajes amigables para el usuario

## 📋 Comparación: Antes vs Después

### Antes

```typescript
export function handleZodError(error: unknown): string {
  if (error instanceof z.ZodError) {
    const validationError = fromError(error);
    return validationError.message;
  }
  return "UNKNOWN_ERROR";
}
```

### Después

```typescript
// Manejo completo de errores con contexto y trazabilidad
const appError = handleError(error, "CreateUserUseCase.execute", traceId);
logError(appError, "Failed to create user");
throw appError;

// Creación de errores específicos
throw createError.validation("Invalid email format", { email });
throw createError.notFound("User");
throw createError.conflict("Email already in use", { email });
```

## 🎯 Beneficios de las Mejoras

### 1. **Trazabilidad Completa**

- Cada error tiene un ID único (`traceId`) para seguimiento
- Contexto detallado sobre dónde y cuándo ocurrió el error
- Stack trace preservado correctamente

### 2. **Tipado Fuerte**

- Sistema de tipos completo en TypeScript
- No más `string` genéricos - errores estructurados
- IntelliSense completo para manejo de errores

### 3. **Separación de Responsabilidades**

- Errores técnicos vs errores de usuario claramente separados
- Mensajes específicos para desarrolladores vs usuarios finales
- Logging automático e inteligente

### 4. **Escalabilidad**

- Fácil adición de nuevos tipos de error
- Sistema extensible para diferentes contextos
- Preparado para integración con servicios externos (Sentry, DataDog)

### 5. **Consistencia**

- Todos los errores siguen la misma estructura
- API consistente en toda la aplicación
- Manejo uniforme en casos de uso, APIs y UI

## 🛠️ Ejemplos de Uso

### En Use Cases

```typescript
export class CreateUserUseCase {
  async execute(input: CreateUserInput): Promise<User> {
    const traceId = crypto.randomUUID();

    try {
      const validInput = CreateUserInputSchema.parse(input);
      const user = await this.userRepository.create(validInput);
      return user;
    } catch (error) {
      // Manejo específico para conflictos
      if (error instanceof Error && error.message.includes("duplicate")) {
        const conflictError = createError.conflict(
          "A user with this email already exists",
          { email: input.email },
          traceId
        );
        logError(conflictError, "CreateUserUseCase.execute - Duplicate user");
        throw conflictError;
      }

      // Manejo genérico
      const appError = handleError(error, "CreateUserUseCase.execute", traceId);
      logError(appError, "Failed to create user");
      throw appError;
    }
  }
}
```

### En API Routes

```typescript
export async function POST(req: Request) {
  try {
    const result = await createUserUseCase.execute(data);
    return Response.json(result);
  } catch (error) {
    const appError = handleError(error, "POST /api/users");
    logError(appError);

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

    return Response.json(
      { error: { message: "Internal server error", traceId: appError.traceId } },
      { status: 500 }
    );
  }
}
```

## 🧪 Testing

Los tests han sido actualizados para trabajar con el nuevo sistema:

```typescript
it("should throw an ApplicationError for invalid data", async () => {
  try {
    await useCase.execute();
    expect.fail("Should have thrown an error");
  } catch (error) {
    expect(error).toBeInstanceOf(ApplicationError);
    expect((error as ApplicationError).type).toBe(ErrorType.VALIDATION_ERROR);
    expect((error as ApplicationError).code).toBe("ZOD_VALIDATION_FAILED");
  }
});
```

## 🔧 Configuración de Logging

El sistema está preparado para integración con servicios de logging:

```typescript
export function logError(error: ApplicationError, context?: string): void {
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

  // Integración futura con servicios externos:
  // Sentry.captureException(error);
  // DataDog.logger.error(error);
  // Winston.error(error);
}
```

## 📁 Estructura de Archivos

```
src/common/
├── errorHandler.ts          # Sistema principal de manejo de errores
└── errorHandler.examples.ts # Ejemplos de uso y patrones
```

## 🎉 Resultado

El sistema de manejo de errores ahora es:

- **🔍 Trazable**: Cada error tiene contexto completo
- **📝 Tipado**: Completamente tipado en TypeScript
- **🎯 Específico**: Diferentes tipos de error para diferentes situaciones
- **👤 User-friendly**: Mensajes apropiados para usuarios finales
- **📊 Observable**: Preparado para logging y monitoreo
- **⚡ Escalable**: Fácil de extender y mantener
- **✅ Testeable**: Fácil de testear y verificar
