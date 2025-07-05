import type { UserRepository } from "../adapters/UserRepository";
import type { User } from "../entities/User";

import * as z from "zod/v4";

const CreateUserInputSchema = z.object({
  name: z.string().min(1, { message: "NAME_REQUIRED" }),
  email: z.email({ message: "INVALID_EMAIL_FORMAT" }),
});

type CreateUserInput = Pick<User, "name" | "email">;

export class CreateUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(input: CreateUserInput): Promise<void> {
    const validInput = CreateUserInputSchema.parse(input);
    const user: User = {
      id: crypto.randomUUID(), // Assuming the ID is generated here
      name: validInput.name,
      email: validInput.email,
    };
    await this.userRepository.create(user);
  }
}
