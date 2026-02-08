"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface ConvexImageProps {
  storageId: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  placeholderClassName?: string;
}

export function ConvexImage({ 
  storageId, 
  alt, 
  width, 
  height, 
  className,
  priority = false,
  placeholderClassName = "bg-gradient-to-br from-gray-200 to-gray-300"
}: ConvexImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchImageUrl = async () => {
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
      if (!convexUrl) {
        console.error("NEXT_PUBLIC_CONVEX_URL is not set");
        return;
      }
      
      // Convert .convex.cloud to .convex.site for HTTP routes
      const siteUrl = convexUrl.replace(".convex.cloud", ".convex.site");
      const fetchUrl = `${siteUrl}/public/storage-url?id=${storageId}`;
      
      try {
        const response = await fetch(fetchUrl);
        if (response.ok) {
          const data = await response.json() as { url: string };
          setImageUrl(data.url);
        } else {
          console.error("Failed to fetch image URL:", response.status, response.statusText);
        }
      } catch (error) {
        console.error("Failed to fetch image URL:", error);
      }
    };
    
    void fetchImageUrl();
  }, [storageId]);

  if (!imageUrl) {
    return (
      <div 
        className={`animate-pulse ${placeholderClassName} ${className ?? ""}`}
        style={{ width: '100%', aspectRatio: `${width}/${height}` }}
      />
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      unoptimized
    />
  );
}
