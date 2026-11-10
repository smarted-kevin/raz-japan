"use client";

import { useEffect, useState } from "react";

interface HeroBannerBackgroundProps {
  src: string;
  alt: string;
}

/**
 * Full-bleed hero photo behind the banner (below lg). Hidden at lg+ where the portrait column is used.
 */
export function HeroBannerBackground({ src, alt }: HeroBannerBackgroundProps) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setLoadedSrc(src);
    img.src = src;
    return () => {
      img.onload = null;
    };
  }, [src]);

  return (
    <>
      <div
        role="img"
        aria-label={alt}
        className={`absolute inset-0 bg-cover bg-[50%_35%] bg-no-repeat transition-opacity duration-500 lg:hidden ${
          loadedSrc === src ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundImage: `url(${src})` }}
      />
      {/* Keep headline readable over the photo */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#651348]/50 via-[#92206c]/35 to-[#c83192]/20 lg:hidden"
        aria-hidden
      />
    </>
  );
}
