import type { User } from "../entities/User";

export interface UserRepository {
  getAll(): Promise<User[]>;
  create(user: User): Promise<User>;
}
