/**
 * Public marketing site button styles — aligns with landing / getting-started CTAs.
 */

/** Primary magenta — sign up and primary marketing actions */
export const publicCtaYellowButtonClassName =
  "bg-[#c83192] font-semibold text-white shadow-lg shadow-[#c83192]/25 transition-all hover:bg-[#a92379] hover:text-white";

/** Magenta outline — log in / secondary on light backgrounds */
export const publicCtaBlueOutlineButtonClassName =
  "border-2 border-[#c83192] bg-background text-[#a92379] shadow-xs transition-all hover:bg-[#fbe8f4] hover:text-[#861b61] dark:bg-transparent";

/** Magenta gradient — form submits on white cards, strong primary */
export const publicCtaBlueGradientButtonClassName =
  "bg-gradient-to-r from-[#c83192] to-[#8f1f69] font-semibold text-white shadow-md shadow-[#c83192]/20 transition-all hover:from-[#a92379] hover:to-[#651348] disabled:opacity-50";

/** Desktop navbar — single text style for every route link */
export const publicNavLinkUniformClassName =
  "text-xs font-medium text-slate-600 transition-colors hover:text-[#a92379] md:text-[0.8125rem] lg:text-sm";

/** Mobile sheet — matches desktop palette */
export const publicMobileNavLinkUniformClassName =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-[#fbe8f4]/70 hover:text-[#861b61]";
