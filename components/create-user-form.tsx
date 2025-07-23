import { createUser } from "@/actions/create-user";
import React, { useState, useTransition } from "react";

const CreateUserForm = () => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await createUser(formData);
      if (!result.success) {
        setError(result.error || "UNKNOWN_ERROR");
      } else {
        setError(null);
      }
    });
  };

  return (
    <form action={handleSubmit}>
      <div>
        <label htmlFor="name">Nombre:</label>
        <input id="name" name="name" type="text" disabled={isPending} />
      </div>
      <div>
        <label htmlFor="email">Email:</label>
        <input id="email" name="email" type="email" disabled={isPending} />
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? "Creando..." : "Crear Usuario"}
      </button>
    </form>
  );
};

export default CreateUserForm;
