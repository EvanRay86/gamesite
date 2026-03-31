import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer-enhanced w-full mt-20 pt-8 pb-6">
      <div className="mx-auto max-w-5xl px-6">
        {/* Top row: branding + links */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none" className="opacity-40">
              <rect x="0" y="0" width="28" height="28" rx="7" fill="#FF6B6B"/>
              <text x="14" y="20" textAnchor="middle" fill="white" fontSize="17" fontWeight="800" fontFamily="Georgia, serif">G</text>
            </svg>
            <span className="text-sm font-semibold text-text-dim">gamesite.app</span>
          </div>
          <nav className="flex flex-wrap items-center gap-5">
            {[
              { href: "/about", label: "About" },
              { href: "/contact", label: "Contact" },
              { href: "/privacy", label: "Privacy" },
              { href: "/terms", label: "Terms" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-text-dim hover:text-text-primary transition-colors duration-200 no-underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom row */}
        <div className="border-t border-border-light pt-4 flex items-center justify-between">
          <p className="text-[11px] text-text-dim/60">
            &copy; {year} Gamesite. All rights reserved.
          </p>
          <p className="text-[11px] text-text-dim/40">
            New puzzles daily
          </p>
        </div>
      </div>
    </footer>
  );
}
