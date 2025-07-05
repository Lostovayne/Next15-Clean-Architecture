import * as z from "zod/v4";
import { UserRepository } from "../adapters/UserRepository";
import { User } from "../entities/User";

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email({ message: "Invalid email format" }),
});

export class GetUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(): Promise<User[]> {
    const users = await this.userRepository.getAll();
    return users.map((user) => UserSchema.parse(user));
  }
}
