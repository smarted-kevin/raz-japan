import "server-only";

import { env } from "~/env";

export function isMemberSignupEnabled(): boolean {
  return env.MEMBER_SIGNUP_ENABLED === "true";
}
