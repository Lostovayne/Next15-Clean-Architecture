import type { UserRepository } from "@/src/adapters/UserRepository";
import type { User } from "@/src/entities/User";
import { GetUserUseCase } from "@/src/use-cases/GetUserUseCase";
import { describe, expect, it, vi } from "vitest";

describe("GetUserUseCase", () => {
  it("should return a list of validated users", async () => {
    // Mocked user data
    const mockUsers: User[] = [
      { id: "1", name: "Alice", email: "alice@example.com" },
      { id: "2", name: "Bob", email: "bob@example.com" },
    ];

    const mockRepository: UserRepository = {
      getAll: vi.fn(async () => mockUsers),
      create: vi.fn(),
    };

    const useCase = new GetUserUseCase(mockRepository);
    const result = await useCase.execute();

    expect(mockRepository.getAll).toHaveBeenCalled();
    expect(result).toEqual(mockUsers);
    expect(result[0].email).toBe("alice@example.com");
  });

  it("should throw a formatted error for invalid data", async () => {
    const invalidUsers = [{ id: "1", name: "Alice", email: "invalid-email" }];
    const mockRepository: UserRepository = {
      getAll: vi.fn(async () => invalidUsers),
      create: vi.fn(),
    };
    const useCase = new GetUserUseCase(mockRepository);

    await expect(useCase.execute()).rejects.toThrow(/Validation error: Invalid email at \"email"/);
  });
});
