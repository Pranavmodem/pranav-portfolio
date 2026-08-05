import { profile } from "@/lib/resume";

const links = [
  { href: "#experience", label: "Experience" },
  { href: "#projects", label: "Projects" },
  { href: "#skills", label: "Skills" },
  { href: "#contact", label: "Contact" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-night-950/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
        <a href="#top" className="font-mono text-sm font-semibold tracking-wide text-ink-100">
          <span className="text-gradient">pranav</span>
          <span className="text-ink-500">.modem</span>
        </a>
        <div className="flex items-center gap-5">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="hidden text-sm text-ink-300 transition-colors hover:text-ink-100 sm:block"
            >
              {l.label}
            </a>
          ))}
          <a
            href={`mailto:${profile.email}`}
            className="rounded-full border border-violet-glow/40 bg-violet-glow/10 px-4 py-1.5 text-sm text-ink-100 transition-colors hover:bg-violet-glow/20"
          >
            Hire me
          </a>
        </div>
      </nav>
    </header>
  );
}
