"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { label: "Daily", href: "/daily", color: "text-coral" },
  { label: "Arcade", href: "/arcade", color: "text-teal" },
  { label: "Admin", href: "/admin", color: "text-amber" },
];

export default function TopNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border-light bg-white shadow-sm">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 md:h-14">
        {/* Left: Logo */}
        <Link href="/" className="flex-shrink-0 no-underline">
          <span className="bg-gradient-to-r from-coral via-amber to-teal bg-clip-text font-body text-2xl font-extrabold text-transparent">
            Gamesite
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

        {/* Right: Log in + mobile hamburger */}
        <div className="flex items-center gap-3">
          <Link
            href="/subscribe"
            className="hidden text-xs font-semibold text-coral bg-coral/10 rounded-full px-3 py-1.5
                       hover:bg-coral/20 transition-colors no-underline md:block"
          >
            Subscribe
          </Link>
          <button className="hidden text-sm font-semibold text-text-muted transition-colors hover:text-text-primary md:block">
            Log in
          </button>

          {/* Mobile hamburger */}
          <button
            className="flex h-8 w-8 flex-col items-center justify-center gap-[5px] md:hidden"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
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
        className={`overflow-hidden border-t border-border bg-white transition-all duration-200 md:hidden ${
          mobileMenuOpen ? "max-h-60" : "max-h-0 border-t-0"
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
          <Link
            href="/subscribe"
            onClick={closeMobileMenu}
            className="rounded-lg px-3 py-2.5 text-sm font-semibold text-coral no-underline hover:bg-surface transition-colors"
          >
            Subscribe
          </Link>
          <button
            onClick={closeMobileMenu}
            className="rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-text-muted transition-colors hover:text-text-primary hover:bg-surface"
          >
            Log in
          </button>
        </div>
      </div>
    </nav>
  );
}
