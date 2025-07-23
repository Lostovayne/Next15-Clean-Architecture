import type { UserRepository } from "@/src/adapters/UserRepository";
import { ApplicationError, ErrorType } from "@/src/common/errorHandler";
import type { User } from "@/src/entities/User";

import { GetUsersUseCase } from "@/src/use-cases/GetUserUseCase";
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

    const useCase = new GetUsersUseCase(mockRepository);
    const result = await useCase.execute();

    expect(mockRepository.getAll).toHaveBeenCalled();
    expect(result).toEqual(mockUsers);
    expect(result[0].email).toBe("alice@example.com");
  });

  it("should throw an ApplicationError for invalid data", async () => {
    const invalidUsers = [{ id: "1", name: "Alice", email: "invalid-email" }];
    const mockRepository: UserRepository = {
      getAll: vi.fn(async () => invalidUsers),
      create: vi.fn(),
    };
    const useCase = new GetUsersUseCase(mockRepository);

    try {
      await useCase.execute();
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(ApplicationError);
      expect((error as ApplicationError).type).toBe(ErrorType.VALIDATION_ERROR);
      expect((error as ApplicationError).code).toBe("ZOD_VALIDATION_FAILED");
      expect((error as ApplicationError).message).toMatch(
        'Validation error: INVALID_EMAIL_FORMAT at "email"'
      );
    }
  });

  it("should handle repository errors gracefully", async () => {
    const mockRepository: UserRepository = {
      getAll: vi.fn(async () => {
        throw new Error("Database connection failed");
      }),
      create: vi.fn(),
    };
    const useCase = new GetUsersUseCase(mockRepository);

    try {
      await useCase.execute();
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(ApplicationError);
      expect((error as ApplicationError).type).toBe(ErrorType.UNKNOWN_ERROR);
      expect((error as ApplicationError).message).toBe("Database connection failed");
    }
  });
});
