/**
 * Public marketing site button styles — aligns with landing / getting-started CTAs.
 */

/** Yellow “Get started” style — sign up, primary marketing actions */
export const publicCtaYellowButtonClassName =
  "bg-yellow-400 font-semibold text-gray-900 shadow-lg shadow-yellow-400/30 transition-all hover:bg-yellow-500";

/** Blue outline — log in / secondary on light backgrounds */
export const publicCtaBlueOutlineButtonClassName =
  "border-2 border-blue-600 bg-background text-blue-700 shadow-xs transition-all hover:bg-blue-50 hover:text-blue-800 dark:bg-transparent";

/** Blue gradient — form submits on white cards, strong primary */
export const publicCtaBlueGradientButtonClassName =
  "bg-gradient-to-r from-blue-600 to-indigo-700 font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50";

/** Desktop navbar — single text style for every route link */
export const publicNavLinkUniformClassName =
  "text-sm font-medium text-slate-600 transition-colors hover:text-blue-700";

/** Mobile sheet — matches desktop palette */
export const publicMobileNavLinkUniformClassName =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50/70 hover:text-blue-800";
