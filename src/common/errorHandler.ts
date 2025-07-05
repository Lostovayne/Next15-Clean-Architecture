import { fromError } from "zod-validation-error";
import * as z from "zod/v4";

export function handleZodError(error: unknown): string {
  if (error instanceof z.ZodError) {
    const validationError = fromError(error);
    return validationError.message;
  }

  return "UNKNOWN_ERROR";
}
