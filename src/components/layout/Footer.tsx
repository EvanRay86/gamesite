import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border-light bg-white mt-16">
      <div className="mx-auto max-w-5xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-dim">
        <p>&copy; {year} Gamesite. All rights reserved.</p>
        <nav className="flex flex-wrap items-center gap-4">
          <Link href="/blog" className="hover:text-text-primary transition-colors no-underline">
            Blog
          </Link>
          <Link href="/about" className="hover:text-text-primary transition-colors no-underline">
            About
          </Link>
          <Link href="/contact" className="hover:text-text-primary transition-colors no-underline">
            Contact
          </Link>
          <Link href="/privacy" className="hover:text-text-primary transition-colors no-underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-text-primary transition-colors no-underline">
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}
