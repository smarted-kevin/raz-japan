import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export function runVercelBuild(env = process.env, run = spawnSync) {
  const production = env.VERCEL_ENV === "production";
  if (production && !env.CONVEX_DEPLOY_KEY?.trim()) {
    throw new Error(
      "Production builds require CONVEX_DEPLOY_KEY. Set a Convex production deploy key in Vercel's Production environment.",
    );
  }

  const command = production
    ? 'pnpm exec convex deploy --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL --cmd "pnpm build"'
    : "pnpm build";
  const result = run(command, { env, stdio: "inherit", shell: true });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    process.exitCode = runVercelBuild();
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Vercel build failed",
    );
    process.exitCode = 1;
  }
}
