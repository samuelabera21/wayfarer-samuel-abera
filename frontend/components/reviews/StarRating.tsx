"use client";

import { useState } from "react";

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
}

export function StarRating({
  value,
  onChange,
  max = 5,
  size = "md",
  readOnly = false,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const activeValue = hoverValue !== null ? hoverValue : value;

  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
  }[size];

  return (
    <div
      className="inline-flex items-center gap-1 select-none"
      role={readOnly ? "img" : "radiogroup"}
      aria-label={`Rating: ${value} of ${max} stars`}
    >
      {Array.from({ length: max }, (_, index) => {
        const starNumber = index + 1;
        const isFilled = starNumber <= activeValue;

        if (readOnly) {
          return (
            <span
              key={starNumber}
              className={`${sizeClasses} ${
                isFilled ? "text-amber-500" : "text-slate-300"
              }`}
              aria-hidden="true"
            >
              ★
            </span>
          );
        }

        return (
          <button
            key={starNumber}
            type="button"
            role="radio"
            aria-checked={value === starNumber}
            aria-label={`${starNumber} star${starNumber > 1 ? "s" : ""}`}
            onClick={() => onChange?.(starNumber)}
            onMouseEnter={() => setHoverValue(starNumber)}
            onMouseLeave={() => setHoverValue(null)}
            className={`${sizeClasses} transition-transform hover:scale-115 focus:outline-hidden cursor-pointer ${
              isFilled ? "text-amber-500" : "text-slate-300 hover:text-amber-300"
            }`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

