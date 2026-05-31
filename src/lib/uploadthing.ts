import { UTApi } from "uploadthing/server";

export const utapi = new UTApi();

/** Build a public CDN URL for an UploadThing file key. */
export function uploadThingFileUrl(fileKey: string): string {
  const appId = process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID;
  if (!appId) {
    throw new Error("NEXT_PUBLIC_UPLOADTHING_APP_ID is not set");
  }
  return `https://${appId}.ufs.sh/f/${fileKey}`;
}
