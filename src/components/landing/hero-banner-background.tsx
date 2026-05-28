"use client";

import { useEffect, useState } from "react";

interface HeroBannerBackgroundProps {
  storageId: string;
  alt: string;
}

async function fetchStorageUrl(storageId: string): Promise<string | null> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.error("NEXT_PUBLIC_CONVEX_URL is not set");
    return null;
  }

  const siteUrl = convexUrl.replace(".convex.cloud", ".convex.site");
  const response = await fetch(`${siteUrl}/public/storage-url?id=${storageId}`);

  if (!response.ok) {
    console.error("Failed to fetch hero background URL:", response.status, response.statusText);
    return null;
  }

  const data = (await response.json()) as { url: string };
  return data.url;
}

/**
 * Full-bleed hero photo behind the banner (below lg). Hidden at lg+ where the portrait column is used.
 */
export function HeroBannerBackground({ storageId, alt }: HeroBannerBackgroundProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    void fetchStorageUrl(storageId).then(setImageUrl);
  }, [storageId]);

  return (
    <>
      <div
        role="img"
        aria-label={alt}
        className={`absolute inset-0 bg-cover bg-[50%_35%] bg-no-repeat transition-opacity duration-500 lg:hidden ${
          imageUrl ? "opacity-100" : "opacity-0"
        }`}
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
      />
      {/* Keep headline readable over the photo */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-950/65 via-blue-900/50 to-indigo-900/40 lg:hidden"
        aria-hidden
      />
    </>
  );
}
