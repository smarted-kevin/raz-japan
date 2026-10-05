import { uploadThingFileUrl } from "~/lib/uploadthing";

/** UploadThing file keys for landing page assets. */
export const LANDING_IMAGE_KEYS = {
  razPlusLogo: "famI1EBGnDaNyYKDs7SEvo8V0TqDO729Q4c5AmsdLWRfSkGF",
  heroBanner: "famI1EBGnDaNjIJX0J16dom7c3KF5CNPzOsG9HDMgr0SyU8a",
  dashboard: "famI1EBGnDaNOt727wvQXfm3blhEAkLBRe5aNH8O1z2i9t6p",
} as const;

export const LANDING_IMAGES = {
  razPlusLogo: uploadThingFileUrl(LANDING_IMAGE_KEYS.razPlusLogo),
  heroBanner: uploadThingFileUrl(LANDING_IMAGE_KEYS.heroBanner),
  dashboard: uploadThingFileUrl(LANDING_IMAGE_KEYS.dashboard),
} as const;
