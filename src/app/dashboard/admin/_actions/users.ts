"use server";

import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "convex/_generated/api";
import { createRandomString, generateSalt, hashPassword } from "~/auth/core/passwordHasher";
import { z } from "zod";

const userSchema = z.object({
  first_name: z.string(),
  last_name: z.string(), 
  email: z.string(),
  password: z.string(),
  role: z.enum(["user", "admin"])
});

export async function addUser(formData:z.infer<typeof userSchema>) {
  //check if classroom with entered name already exists
  const user = await fetchQuery(api.queries.users.getUserByEmail, { email: formData.email });
  //if user exists throw error

  if (user !== null) return { error: "User with that email address already exists." };
  //if user email is accepted create user
  
  // const password = await createRandomString(10);
  // const salt = await generateSalt();
  // const hashedPassword = await hashPassword(password, salt);


  const newUser = await fetchMutation(
    api.mutations.users.adminCreateUser, 
    {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      status: "active",
      updated_at: Date.now()
    }
  );

  return {
    user_id: newUser
  };
}