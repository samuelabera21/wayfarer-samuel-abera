"use client";

import { PLACE_CATEGORIES, type PlaceCategory } from "../../lib/types";

interface CategoryFilterProps {
  selectedCategory: PlaceCategory;
  onSelectCategory: (category: PlaceCategory) => void;
}

export function CategoryFilter({
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {PLACE_CATEGORIES.map((category) => {
        const isActive = selectedCategory === category;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onSelectCategory(category)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all shrink-0 cursor-pointer ${
              isActive
                ? "bg-[#102a4e] text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50"
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}

