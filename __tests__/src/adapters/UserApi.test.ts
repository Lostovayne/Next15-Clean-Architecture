import { UserApi } from "@/src/adapters/UserApi";
import { User } from "@/src/entities/User";
import { describe, expect, it, vi } from "vitest";

describe("UserApi", () => {
  it("should fetch and validate users from API with cache", async () => {
    const mockUsers = [
      { id: 1, firstName: "Alice", email: "alice@example.com" },
      { id: 2, firstName: "Bob", email: "bob@example.com" },
    ];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ users: mockUsers }),
    });

    const userApi = new UserApi();
    const result = await userApi.getAll();

    expect(fetch).toHaveBeenCalledWith("https://dummyjson.com/users", {
      next: { revalidate: 3600, tags: ["users"] },
    });
    expect(result).toEqual([
      { id: "1", name: "Alice", email: "alice@example.com" },
      { id: "2", name: "Bob", email: "bob@example.com" },
    ]);
  });

  it("should throw a formatted error for invalid API data", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ users: [{ id: 1, firstName: "Alice", email: "invalid-email" }] }),
    });

    const userApi = new UserApi();
    await expect(userApi.getAll()).rejects.toThrow("Error fetching users from API");
  });

  it("should create a user via API", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    const user: User = { id: "1", name: "Alice", email: "alice@example.com" };

    const userApi = new UserApi();
    await userApi.create(user);

    expect(fetch).toHaveBeenCalledWith("https://dummyjson.com/users", {
      method: "POST",
      body: JSON.stringify(user),
      headers: { "Content-Type": "application/json" },
    });
  });
});
