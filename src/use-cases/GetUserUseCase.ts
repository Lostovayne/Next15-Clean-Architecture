import * as z from "zod/v4";
import { UserRepository } from "../adapters/UserRepository";
import { handleZodError } from "../common/errorHandler";
import { User } from "../entities/User";

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email({ message: "INVALID_EMAIL_FORMAT" }),
});

export class GetUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(): Promise<User[]> {
    try {
      const users = await this.userRepository.getAll();
      return users.map((user) => UserSchema.parse(user));
    } catch (error) {
      throw new Error(handleZodError(error));
    }
  }
}
