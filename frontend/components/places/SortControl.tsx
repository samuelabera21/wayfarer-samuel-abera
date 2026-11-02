"use client";

interface SortControlProps {
  sortBy: "default" | "top-rated";
  onChange: (value: "default" | "top-rated") => void;
}

export function SortControl({ sortBy, onChange }: SortControlProps) {
  return (
    <div className="relative inline-flex items-center">
      <label htmlFor="sort-places-select" className="sr-only">
        Sort places
      </label>
      <div className="inline-flex items-center bg-white border border-slate-300 hover:border-slate-400 rounded-lg shadow-2xs transition-colors px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500">
        <span className="text-xs sm:text-sm font-medium text-slate-500 mr-1.5 select-none">
          Sort:
        </span>
        <select
          id="sort-places-select"
          value={sortBy}
          onChange={(e) =>
            onChange(e.target.value as "default" | "top-rated")
          }
          className="text-xs sm:text-sm font-semibold text-slate-800 bg-transparent cursor-pointer focus:outline-hidden pr-5 appearance-none"
        >
          <option value="default">Default</option>
          <option value="top-rated">Top rated</option>
        </select>
        <span className="pointer-events-none absolute right-2.5 text-[10px] text-slate-500 select-none">
          ▾
        </span>
      </div>
    </div>
  );
}
