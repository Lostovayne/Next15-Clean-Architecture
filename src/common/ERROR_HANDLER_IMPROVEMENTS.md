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

### En Fetch a APIs Externas

```typescript
export class UserApiService {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async fetchUsers(): Promise<User[]> {
    const traceId = crypto.randomUUID();

    try {
      const response = await fetch(`${this.baseUrl}/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Timeout para evitar requests colgados
        signal: AbortSignal.timeout(10000), // 10 segundos
      });

      // Error HTTP específico
      if (!response.ok) {
        switch (response.status) {
          case 400:
            throw createError.validation(
              "Invalid request parameters",
              { status: response.status, url: response.url },
              traceId
            );
          case 401:
            throw createError.unauthorized("Authentication failed - invalid API key", traceId);
          case 403:
            throw createError.forbidden("Access denied to users endpoint", traceId);
          case 404:
            throw createError.notFound("Users endpoint", traceId);
          case 429:
            throw createError.rateLimit("Rate limit exceeded for external API", traceId);
          case 500:
          case 502:
          case 503:
          case 504:
            throw createError.network(
              "External API server error",
              {
                status: response.status,
                statusText: response.statusText,
                url: response.url,
              },
              traceId
            );
          default:
            throw createError.network(
              `Unexpected HTTP status: ${response.status}`,
              { status: response.status, url: response.url },
              traceId
            );
        }
      }

      // Parsear respuesta JSON
      const data = await response.json();

      // Validar estructura de datos
      if (!Array.isArray(data)) {
        throw createError.validation(
          "Invalid response format - expected array",
          { receivedType: typeof data, url: response.url },
          traceId
        );
      }

      return data;
    } catch (error) {
      // Errores de red (sin conexión, timeout, DNS, etc.)
      if (error instanceof TypeError) {
        const networkError = createError.network(
          "Network connection failed",
          {
            originalError: error.message,
            url: `${this.baseUrl}/users`,
            errorType: "NetworkError",
          },
          traceId
        );
        logError(networkError, "UserApiService.fetchUsers - Network error");
        throw networkError;
      }

      // Errores de timeout
      if (error instanceof DOMException && error.name === "TimeoutError") {
        const timeoutError = createError.network(
          "Request timeout - external API took too long to respond",
          {
            url: `${this.baseUrl}/users`,
            timeout: "10000ms",
            errorType: "TimeoutError",
          },
          traceId
        );
        logError(timeoutError, "UserApiService.fetchUsers - Timeout");
        throw timeoutError;
      }

      // Errores de AbortController
      if (error instanceof DOMException && error.name === "AbortError") {
        const abortError = createError.network(
          "Request was aborted",
          {
            url: `${this.baseUrl}/users`,
            errorType: "AbortError",
          },
          traceId
        );
        logError(abortError, "UserApiService.fetchUsers - Request aborted");
        throw abortError;
      }

      // Errores de parsing JSON
      if (error instanceof SyntaxError) {
        const parseError = createError.validation(
          "Invalid JSON response from external API",
          {
            originalError: error.message,
            url: `${this.baseUrl}/users`,
            errorType: "JSONParseError",
          },
          traceId
        );
        logError(parseError, "UserApiService.fetchUsers - JSON parse error");
        throw parseError;
      }

      // Si ya es ApplicationError, la relanzamos
      if (error instanceof ApplicationError) {
        logError(error, "UserApiService.fetchUsers - Application error");
        throw error;
      }

      // Cualquier otro error desconocido
      const unknownError = handleError(error, "UserApiService.fetchUsers", traceId);
      logError(unknownError, "UserApiService.fetchUsers - Unknown error");
      throw unknownError;
    }
  }

  async createUser(userData: CreateUserInput): Promise<User> {
    const traceId = crypto.randomUUID();

    try {
      const response = await fetch(`${this.baseUrl}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(userData),
        signal: AbortSignal.timeout(15000), // 15 segundos para POST
      });

      if (!response.ok) {
        // Intentar obtener detalles del error del servidor
        let errorDetails: any = null;
        try {
          errorDetails = await response.json();
        } catch {
          // Si no se puede parsear, usar información básica
          errorDetails = {
            status: response.status,
            statusText: response.statusText,
          };
        }

        switch (response.status) {
          case 400:
            throw createError.validation(
              errorDetails?.message || "Invalid user data",
              {
                ...errorDetails,
                submittedData: userData,
                url: response.url,
              },
              traceId
            );
          case 409:
            throw createError.conflict(
              errorDetails?.message || "User already exists",
              {
                email: userData.email,
                conflictField: errorDetails?.field || "email",
                url: response.url,
              },
              traceId
            );
          case 422:
            throw createError.validation(
              errorDetails?.message || "Validation failed",
              {
                validationErrors: errorDetails?.errors || [],
                submittedData: userData,
                url: response.url,
              },
              traceId
            );
          default:
            throw createError.network(
              `API error: ${response.status}`,
              {
                ...errorDetails,
                status: response.status,
                url: response.url,
              },
              traceId
            );
        }
      }

      const createdUser = await response.json();

      // Validación básica del usuario creado
      if (!createdUser.id || !createdUser.email) {
        throw createError.validation(
          "Invalid user object returned from API",
          { receivedUser: createdUser, url: response.url },
          traceId
        );
      }

      return createdUser;
    } catch (error) {
      // Misma lógica de manejo de errores que en fetchUsers
      if (error instanceof TypeError) {
        const networkError = createError.network(
          "Failed to create user - network error",
          {
            originalError: error.message,
            userData: userData,
            url: `${this.baseUrl}/users`,
          },
          traceId
        );
        logError(networkError, "UserApiService.createUser - Network error");
        throw networkError;
      }

      if (error instanceof ApplicationError) {
        logError(error, "UserApiService.createUser - Application error");
        throw error;
      }

      const unknownError = handleError(error, "UserApiService.createUser", traceId);
      logError(unknownError, "UserApiService.createUser - Unknown error");
      throw unknownError;
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
