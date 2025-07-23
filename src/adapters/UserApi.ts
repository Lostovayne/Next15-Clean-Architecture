import z from "zod/v4";
import { createError } from "../common/errorHandler";
import { User } from "../entities/User";
import { UserRepository } from "./UserRepository";

const API_URL = "https://dummyjson.com/users";
const traceId = crypto.randomUUID();

const UserApiSchema = z
  .array(
    z.object({
      id: z.number().transform(String),
      firstName: z.string(),
      email: z.email({ message: "INVALID_EMAIL_FORMAT" }),
    })
  )
  .transform((users) =>
    users.map((user) => ({
      id: user.id,
      name: user.firstName,
      email: user.email,
    }))
  );

export class UserApi implements UserRepository {
  async getAll(): Promise<User[]> {
    try {
      const response = await fetch(API_URL, { next: { revalidate: 3600, tags: ["users"] } });
      if (!response.ok) {
        throw createError.fetchError(
          "Failed to fetch users",
          {
            status: response.status,
            statusText: response.statusText,
          },
          traceId
        );
      }

      const data = await response.json();
      return UserApiSchema.parse(data.users);
    } catch (error) {
      throw createError.network(
        "Error fetching users from API",
        {
          error: error instanceof Error ? error.message : "Unknown error",
          traceId,
        },
        traceId
      );
    }
  }

  async create(user: User): Promise<void> {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });

      if (!response.ok) {
        throw createError.fetchError(
          "Failed to create user",
          {
            status: response.status,
            statusText: response.statusText,
          },
          traceId
        );
      }
    } catch (error) {
      throw createError.network(
        "Error creating user in API",
        {
          error: error instanceof Error ? error.message : "Unknown error",
          traceId,
        },
        traceId
      );
    }
  }
}
