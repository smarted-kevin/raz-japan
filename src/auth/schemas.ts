import { type Infer, v } from "convex/values";
import { type Id } from "~/convex/_generated/dataModel";

export const emailValidator = v.string();
export const stringValidator = v.string();
export const roles = v.union(v.literal("user"), v.literal("admin"), v.literal("god"));


export type UserSession = {
  userId: Id<"user">;
  role: Infer<typeof roles>;
}

export type signInSchema = {
  email: Infer<typeof emailValidator>,
  password: Infer<typeof stringValidator>,
};

export type signUpSchema = { 
  first_name: Infer<typeof stringValidator>,
  last_name: Infer<typeof stringValidator>,
  email: Infer<typeof emailValidator>,
  password: Infer<typeof stringValidator>,
};