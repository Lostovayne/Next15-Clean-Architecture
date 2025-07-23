"use cache";

import { UserApi } from "@/src/adapters/UserApi";
import type { User } from "@/src/entities/User";
import { GetUsersUseCase } from "@/src/use-cases/GetUserUseCase";

async function UsersList() {
  const userApi = new UserApi();
  const getUsersUseCase = new GetUsersUseCase(userApi);
  const users = await getUsersUseCase.execute();

  return (
    <ul>
      {users.map((user: User) => (
        <li key={user.id}>
          {user.name} ({user.email})
        </li>
      ))}
    </ul>
  );
}

export default async function UsersPage() {
  return (
    <div>
      <h1>Lista de Usuarios</h1>
      <UsersList />
    </div>
  );
}
