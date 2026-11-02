"use client";

interface SortControlProps {
  isTopRated: boolean;
  onToggle: () => void;
}

export function SortControl({ isTopRated, onToggle }: SortControlProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border ${
        isTopRated
          ? "bg-blue-50 text-blue-900 border-blue-300 shadow-2xs"
          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400"
      }`}
      title={
        isTopRated
          ? "Sorting by Bayesian weighted rating (click to reset to default order)"
          : "Sort by Top Rated (Bayesian weighted score)"
      }
    >
      <svg
        width="16"
        height="16"
        style={{ width: "16px", height: "16px", minWidth: "16px" }}
        className={`w-4 h-4 transition-transform shrink-0 ${isTopRated ? "text-blue-700" : "text-slate-500"}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
        />
      </svg>
      <span>Top rated</span>
      {isTopRated && (
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 ml-0.5" />
      )}
    </button>
  );
}

