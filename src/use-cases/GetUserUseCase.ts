import * as z from "zod/v4";
import { UserRepository } from "../adapters/UserRepository";
import { handleError, logError } from "../common/errorHandler";
import { User } from "../entities/User";

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email({ message: "INVALID_EMAIL_FORMAT" }),
});

export class GetUsersUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(): Promise<User[]> {
    const traceId = crypto.randomUUID();

    try {
      const users = await this.userRepository.getAll();
      return users.map((user) => UserSchema.parse(user));
    } catch (error) {
      const appError = handleError(error, "GetUserUseCase.execute", traceId);
      logError(appError, "Failed to get users");
      throw appError;
    }
  }
}
