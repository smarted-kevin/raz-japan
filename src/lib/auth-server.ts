import { createAuth } from "convex/auth";
import { getToken as getTokenNextjs } from "@convex-dev/better-auth/nextjs";
import { cache } from "react";

export const getToken = cache(() => {
  return getTokenNextjs(createAuth);
});