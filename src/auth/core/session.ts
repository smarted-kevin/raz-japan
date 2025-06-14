import bcrypt from "bcryptjs";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "~/convex/_generated/api";
import { type Id } from "~/convex/_generated/dataModel";
import { cookies } from "next/headers";
import { type FunctionReference } from "convex/server";

const bcryptTyped = bcrypt as {
  genSalt: (rounds: number) => Promise<string>;
};

const apiTyped = api as unknown as {
  mutations: {
    session: {
      createSession: FunctionReference<"mutation">;
      updateSessionRole: FunctionReference<"mutation">;
      deleteSessionBySessionId: FunctionReference<"mutation">;
    }
  };
  queries: {
    session: {
      getSessionById: FunctionReference<"query">;
    };
    user: {
      getUserById: FunctionReference<"query">;
    }
  }
};

export { apiTyped };

// Seven days in seconds
const SESSION_EXPIRATION_SECONDS = 60 * 60 * 24 * 7;
const COOKIE_SESSION_KEY = "session-id";
type Role = "user" | "admin" | "god";

type UserSession = {
  userId: Id<"user">;
  role: Role;
} | null;

export type Cookies = {
  set: (
    key: string,
    value: string,
    options: {
      secure?: boolean
      httpOnly?: boolean
      sameSite?: "strict" | "lax"
      expires?: number

    }
  ) => void
  get: (key: string) => { name: string; value: string } | undefined;
  delete: (key: string) => void;
}

export async function createUserSession(
  user: UserSession, 
  cookies: Cookies
) {

  const sessionId = await bcryptTyped.genSalt(10);
  
  await fetchMutation(apiTyped.mutations.session.createSession, ({ 
    sessionId: sessionId, 
    userId: user?.userId,
    role: user?.role, 
    expiresAt: Date.now() + SESSION_EXPIRATION_SECONDS * 1000 
  }));

  setCookie(sessionId, cookies);
}

function setCookie(sessionId: string, cookies: Pick<Cookies, "set">) {
  cookies.set(COOKIE_SESSION_KEY, sessionId, {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    expires: Date.now() + SESSION_EXPIRATION_SECONDS * 1000,
  });
}

export function getUserFromSession(cookies: Pick<Cookies, "get">) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (sessionId == null) return null;

  return getUserSessionById(sessionId);
}

async function getUserSessionById(sessionId: string): Promise<UserSession> {
  const user = await fetchQuery(apiTyped.queries.session.getSessionById, { sessionId: sessionId}) as UserSession;
  
  return user;
}

export async function updateUserSessionData(
  user: UserSession, 
  cookies: Pick<Cookies, "get">
) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (sessionId == null) return null;

  await fetchMutation(
    apiTyped.mutations.session.updateSessionRole, 
    {sessionId: sessionId, role: user?.role, expires: Date.now() + SESSION_EXPIRATION_SECONDS * 1000 }
  );
}

export async function removeUserSession(cookies: Pick<Cookies, "get" | "delete">) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (sessionId == null) return null;

  await fetchMutation(apiTyped.mutations.session.deleteSessionBySessionId, {sessionId: sessionId});
  cookies.delete(COOKIE_SESSION_KEY);

}

export async function verifyAdmin() {
  const cookie = ((await cookies()).get(COOKIE_SESSION_KEY)?.value)
  const user = await getUserSessionById(cookie ?? "");

  return user?.role == "admin";
}