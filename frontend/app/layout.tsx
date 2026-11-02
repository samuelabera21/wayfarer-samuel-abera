import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "../context/UserContext";
import { UserSwitcher } from "../components/user/UserSwitcher";

export const metadata: Metadata = {
  title: "Wayfarer — Honest Ratings, Fair Bookings",
  description: "Discover authentic destinations and honest ratings in Debre Berhan.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
        <UserProvider>
          {/* Navigation Bar */}
          <header className="bg-[#0b1c36] text-white sticky top-0 z-30 shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full border border-blue-300/40 flex items-center justify-center text-blue-200 text-xs select-none">
                    🧭
                  </span>
                  <span className="text-xl font-bold tracking-tight text-white">
                    Wayfarer
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Discover Debre Berhan, one place at a time.
                </p>
              </div>

              {/* Interactive User Switcher */}
              <UserSwitcher />
            </div>
          </header>

          {/* Main Container */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-200 bg-white py-4 mt-auto text-center text-xs text-slate-500">
            Wayfarer &copy; 2026 — Honest ratings, fair tour bookings in Debre Berhan.
          </footer>
        </UserProvider>
      </body>
    </html>
  );
}
