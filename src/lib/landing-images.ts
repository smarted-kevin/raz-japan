import { uploadThingFileUrl } from "~/lib/uploadthing";

/** UploadThing file keys for landing page assets. */
export const LANDING_IMAGE_KEYS = {
  razPlusLogo: "famI1EBGnDaNyYKDs7SEvo8V0TqDO729Q4c5AmsdLWRfSkGF",
  remLogo: "famI1EBGnDaN8SrzpyNjIYrT6pUJZBo1Gy5ws0LAkuOnCh2x",
  heroBanner: "famI1EBGnDaNjIJX0J16dom7c3KF5CNPzOsG9HDMgr0SyU8a",
  dashboard: "famI1EBGnDaNOt727wvQXfm3blhEAkLBRe5aNH8O1z2i9t6p",
  smartEdLogo: "famI1EBGnDaNk1LERUzpgDXqHxPj2sbhTMCKIvGfAzWu5n6Z",
  sproutEnglishTokyoLogo: "famI1EBGnDaNQaj7C5bWKzam8wgN4EkVFvIsdner0HfyGjhU",
} as const;

export const LANDING_IMAGES = {
  razPlusLogo: uploadThingFileUrl(LANDING_IMAGE_KEYS.razPlusLogo),
  remLogo: uploadThingFileUrl(LANDING_IMAGE_KEYS.remLogo),
  heroBanner: uploadThingFileUrl(LANDING_IMAGE_KEYS.heroBanner),
  dashboard: uploadThingFileUrl(LANDING_IMAGE_KEYS.dashboard),
  smartEdLogo: uploadThingFileUrl(LANDING_IMAGE_KEYS.smartEdLogo),
  sproutEnglishTokyoLogo: uploadThingFileUrl(
    LANDING_IMAGE_KEYS.sproutEnglishTokyoLogo,
  ),
} as const;
