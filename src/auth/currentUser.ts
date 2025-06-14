import { cookies } from "next/headers";
import { cache } from "react";
import { getUserFromSession } from "./core/session";
import { type Id } from "~/convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { api } from "~/convex/_generated/api";


type FullUser = Exclude<
  Awaited<ReturnType<typeof getUserFromDB>>,
  undefined | null
>;

type User = Exclude<
  Awaited<ReturnType<typeof getUserFromSession>>,
  undefined | null
>;

function _getCurrentUser(options: {
  withFullUser: true,
  redirectIfNotFound: true
}): Promise<FullUser>;
function _getCurrentUser(options: {
  withFullUser: true,
  redirectIfNotFound?: false
}): Promise<FullUser | null>;
function _getCurrentUser(options: {
  withFullUser?: false,
  redirectIfNotFound: true
}): Promise<User>;
function _getCurrentUser(options?: {
  withFullUser?: false,
  redirectIfNotFound?: false
}): Promise<User | null>;

async function _getCurrentUser({
  withFullUser = false,
  redirectIfNotFound = false,
} = {}) {
  const user = await getUserFromSession(await cookies());

  if (user == null) {
    if (redirectIfNotFound) return redirect("/sign-in");
    return null;
  }

  if (withFullUser) {
    const fullUser = await getUserFromDB(user.userId);

    if (fullUser == null) throw new Error("User not found.");
    return fullUser;
  }

  return user;
}

export const getCurrentUser = cache(_getCurrentUser);

function getUserFromDB(id: Id<"user">) {
  return fetchQuery(api.queries.user.getUserById, { id }); 
}