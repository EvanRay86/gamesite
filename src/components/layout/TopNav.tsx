"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Daily", href: "/daily", color: "text-coral" },
  { label: "Arcade", href: "/arcade", color: "text-teal" },
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, credits, loading, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <nav aria-label="Main navigation" className="sticky top-0 z-50 w-full glass-nav shadow-sm">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 md:h-14">
        {/* Left: Logo */}
        <Link href="/" className="flex-shrink-0 no-underline flex items-center gap-2">
          {/* Scrabble tile */}
          <svg width="26" height="28" viewBox="0 0 26 28" fill="none" className="flex-shrink-0">
            <rect x="0" y="0" width="26" height="26" rx="4" fill="#FF6B6B"/>
            <rect x="1.5" y="1.5" width="23" height="23" rx="3" fill="#FF8E8E"/>
            <text x="13" y="19" textAnchor="middle" fill="white" fontSize="17" fontWeight="800" fontFamily="Georgia, serif">G</text>
            <text x="22" y="25.5" textAnchor="middle" fill="white" fontSize="6" fontWeight="600" fontFamily="Georgia, serif">2</text>
          </svg>
          <span className="flex items-baseline gap-1 leading-none">
            <span className="text-[21px] text-text-primary tracking-tight" style={{fontFamily: "'Russo One', sans-serif"}}>gamesite</span><span className="text-[11px] font-bold text-coral tracking-widest uppercase" style={{fontFamily: "'Space Grotesk', sans-serif"}}>.app</span>
          </span>
        </Link>

        {/* Center: Desktop nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative rounded-full px-4 py-1.5 text-sm font-body font-semibold transition-all duration-200 no-underline ${
                  isActive
                    ? `${link.color} bg-surface`
                    : "text-text-muted hover:text-text-primary hover:bg-surface"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right: auth controls + mobile hamburger */}
        <div className="flex items-center gap-3">
          {/* Auth controls (desktop) */}
          {!loading && (
            <div className="hidden items-center gap-2 md:flex">
              {user ? (
                <>
                  {/* Credit pill */}
                  <Link
                    href="/account"
                    className="flex items-center gap-1.5 rounded-full bg-amber/10 px-3 py-1 text-sm font-semibold text-amber no-underline hover:bg-amber/20 transition-colors"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <circle cx="10" cy="10" r="8" />
                    </svg>
                    {credits}
                  </Link>

                  {/* User dropdown */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen((prev) => !prev)}
                      aria-label="User menu"
                      aria-expanded={userMenuOpen}
                      aria-haspopup="true"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-teal/10 text-teal text-sm font-bold hover:bg-teal/20 transition-colors"
                    >
                      {user.email?.[0]?.toUpperCase() ?? "U"}
                    </button>

                    {userMenuOpen && (
                      <div role="menu" className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-white py-1 shadow-lg">
                        <div className="px-4 py-2 text-xs text-text-dim truncate border-b border-border">
                          {user.email}
                        </div>
                        <Link
                          href="/account"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-text-secondary hover:bg-surface no-underline"
                        >
                          Account
                        </Link>
                        <button
                          role="menuitem"
                          onClick={async () => {
                            setUserMenuOpen(false);
                            await signOut();
                            router.push("/");
                          }}
                          className="block w-full px-4 py-2 text-left text-sm text-text-muted hover:bg-surface hover:text-coral"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded-full border border-border px-4 py-1.5 text-sm font-semibold text-text-secondary no-underline hover:bg-surface transition-colors"
                >
                  Log In
                </Link>
              )}
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="flex h-8 w-8 flex-col items-center justify-center gap-[5px] md:hidden"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <span
              className={`block h-0.5 w-5 rounded-full bg-text-primary transition-all duration-200 ${
                mobileMenuOpen ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-5 rounded-full bg-text-primary transition-all duration-200 ${
                mobileMenuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-5 rounded-full bg-text-primary transition-all duration-200 ${
                mobileMenuOpen ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      <div
        id="mobile-menu"
        role="navigation"
        aria-label="Mobile navigation"
        className={`overflow-hidden border-t border-white/30 bg-white/80 backdrop-blur-xl transition-all duration-200 md:hidden ${
          mobileMenuOpen ? "max-h-80" : "max-h-0 border-t-0"
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                className={`rounded-lg px-3 py-2.5 text-sm font-body font-semibold transition-colors no-underline ${
                  isActive
                    ? `${link.color} bg-surface`
                    : "text-text-muted hover:text-text-secondary hover:bg-surface"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Mobile auth items */}
          {!loading && (
            <div className="border-t border-border mt-2 pt-2">
              {user ? (
                <>
                  <Link
                    href="/account"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-text-secondary no-underline hover:bg-surface"
                  >
                    Account
                    <span className="flex items-center gap-1 text-amber text-xs">
                      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="10" cy="10" r="8" />
                      </svg>
                      {credits}
                    </span>
                  </Link>
                  <button
                    onClick={async () => {
                      closeMobileMenu();
                      await signOut();
                      router.push("/");
                    }}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-text-muted hover:text-coral hover:bg-surface"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-teal no-underline hover:bg-surface"
                >
                  Log In
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
