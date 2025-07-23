"use server";

import { UserApi } from "@/src/adapters/UserApi";
import { createError } from "@/src/common/errorHandler";
import { CreateUserUseCase } from "@/src/use-cases/CreateUserUseCase";
import { revalidateTag } from "next/cache";
import z from "zod/v4";

const CreateUserUInputSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.email({ message: "Invalid email format" }),
});

export async function createUser(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const input = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
    };

    const validateInput = CreateUserUInputSchema.parse(input);
    const userApi = new UserApi();
    const createUserUseCase = new CreateUserUseCase(userApi);

    await createUserUseCase.execute(validateInput);
    revalidateTag("users");
    return { success: true };
  } catch (error) {
    createError.unknown(
      ` Error creating user: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export type CreateUserInput = z.infer<typeof CreateUserUInputSchema>;
