import { Logo } from "./primitives";

export function Nav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-[var(--color-paper)]/75 border-b border-[color-mix(in_srgb,var(--color-ink)_8%,transparent)]">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 h-14 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5">
          <Logo />
          <span className="text-[13px] tracking-[0.22em] uppercase font-medium">
            Gohan AI
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-9 text-[13px] text-[var(--color-mute)]">
          <a href="#manifesto" className="link-under hover:text-[var(--color-ink)] transition-colors">
            Manifesto
          </a>
          <a href="#try" className="link-under hover:text-[var(--color-ink)] transition-colors">
            Try it
          </a>
          <a href="#how" className="link-under hover:text-[var(--color-ink)] transition-colors">
            How it works
          </a>
          <a href="#developers" className="link-under hover:text-[var(--color-ink)] transition-colors">
            Developers
          </a>
        </nav>
        <a
          href="#contact"
          className="btn-shine text-[13px] font-medium px-4 py-2 rounded-full bg-[var(--color-ink)] text-[var(--color-paper)] hover:bg-[var(--color-flame)] transition-colors"
        >
          Get early access
        </a>
      </div>
    </header>
  );
}
