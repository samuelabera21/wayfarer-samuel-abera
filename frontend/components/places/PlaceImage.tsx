"use client";

import { useState } from "react";

interface PlaceImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  category?: string;
}

export function PlaceImage({
  src,
  alt,
  className = "",
  category = "Place",
}: PlaceImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`bg-linear-to-br from-slate-100 to-slate-200 border border-slate-200 flex flex-col items-center justify-center p-4 text-slate-400 select-none ${className}`}
        aria-label={`${alt} (Photo placeholder)`}
      >
        <svg
          width="40"
          height="40"
          style={{ width: "40px", height: "40px" }}
          className="w-10 h-10 mb-1 text-slate-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="text-xs font-medium text-slate-500">{category}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setHasError(true)}
      className={`object-cover ${className}`}
    />
  );
}

