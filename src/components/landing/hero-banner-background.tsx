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
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.src = src;
    if (img.complete) {
      setLoaded(true);
    }
  }, [src]);

  return (
    <>
      <div
        role="img"
        aria-label={alt}
        className={`absolute inset-0 bg-cover bg-[50%_35%] bg-no-repeat transition-opacity duration-500 lg:hidden ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundImage: `url(${src})` }}
      />
      {/* Keep headline readable over the photo */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-950/65 via-blue-900/50 to-indigo-900/40 lg:hidden"
        aria-hidden
      />
    </>
  );
}
