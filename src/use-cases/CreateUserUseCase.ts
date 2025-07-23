import type { UserRepository } from "../adapters/UserRepository";
import { handleError, logError, createError } from "../common/errorHandler";
import type { User } from "../entities/User";

import * as z from "zod/v4";

const CreateUserInputSchema = z.object({
  name: z.string().min(1, { message: "NAME_REQUIRED" }),
  email: z.email({ message: "INVALID_EMAIL_FORMAT" }),
});

type CreateUserInput = Pick<User, "name" | "email">;

export class CreateUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(input: CreateUserInput): Promise<User> {
    const traceId = crypto.randomUUID();

    try {
      const validInput = CreateUserInputSchema.parse(input);

      const user: User = {
        id: crypto.randomUUID(), // Assuming the ID is generated here
        name: validInput.name,
        email: validInput.email,
      };

      const createdUser = await this.userRepository.create(user);
      return createdUser;
    } catch (error) {
      // Manejo específico para errores de duplicado (ejemplo)
      if (
        error instanceof Error &&
        (error.message.includes("duplicate") || error.message.includes("already exists"))
      ) {
        const conflictError = createError.conflict(
          "A user with this email already exists",
          { email: input.email },
          traceId
        );
        logError(conflictError, "CreateUserUseCase.execute - Duplicate user");
        throw conflictError;
      }

      const appError = handleError(error, "CreateUserUseCase.execute", traceId);
      logError(appError, "Failed to create user");
      throw appError;
    }
  }
}
