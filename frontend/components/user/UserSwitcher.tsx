"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "../../context/UserContext";

export function UserSwitcher() {
  const { users, currentUser, isLoading, error, selectUser, refreshUsers } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-slate-300 bg-white/10 px-3 py-1.5 rounded-full border border-white/20 animate-pulse">
        <span>👤</span>
        <span>Loading travellers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <button
        type="button"
        onClick={() => refreshUsers()}
        className="inline-flex items-center gap-1 text-xs text-red-200 bg-red-950/40 hover:bg-red-950/60 px-3 py-1.5 rounded-full border border-red-400/30 cursor-pointer"
        title={error}
      >
        <span>⚠️ Retry travellers</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="inline-flex items-center gap-1.5 text-xs text-slate-200 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-full border border-white/20 transition-colors select-none cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-white/40"
      >
        <span>👤</span>
        <span>
          Acting as:{" "}
          <strong className="font-semibold text-white">
            {currentUser?.name ?? "Select user"}
          </strong>
        </span>
        <span
          className={`text-[10px] text-blue-200 transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Available travellers"
          className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-slate-900 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-1.5 border-b border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Switch Traveller
            </p>
          </div>

          <div className="py-1">
            {users.map((user) => {
              const isSelected = user.id === currentUser?.id;
              return (
                <button
                  key={user.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    selectUser(user);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-blue-50 text-blue-900 font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px]">
                      {user.name.charAt(0)}
                    </span>
                    <span>{user.name}</span>
                  </div>

                  {isSelected && (
                    <span className="text-blue-600 font-bold text-sm">✓</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50/70 rounded-b-xl">
            <p className="text-[10px] text-slate-500 leading-tight">
              Reviews & bookings will be recorded under this traveller.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

