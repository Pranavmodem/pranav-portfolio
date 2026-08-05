import { profile } from "@/lib/resume";

export default function Hero() {
  return (
    <section id="top" className="fade-up flex flex-col gap-10 py-20 sm:py-28">
      <div>
        <p className="mb-4 font-mono text-sm text-cyan-glow">
          <span className="pulse-dot mr-2 inline-block h-2 w-2 rounded-full bg-cyan-glow align-middle" />
          {profile.location} · open to senior data &amp; AI platform roles
        </p>
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          {profile.name}
        </h1>
        <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
          <span className="text-gradient">{profile.title}</span>
          <span className="text-ink-500"> · {profile.tagline}</span>
        </h2>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-300">{profile.summary}</p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a
            href="#contact"
            className="glow-violet rounded-lg bg-violet-glow px-5 py-2.5 text-sm font-semibold text-night-950 transition-transform hover:scale-[1.03]"
          >
            Get in touch
          </a>
          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-white/10 px-5 py-2.5 text-sm text-ink-100 transition-colors hover:border-white/25"
          >
            GitHub
          </a>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-white/10 px-5 py-2.5 text-sm text-ink-100 transition-colors hover:border-white/25"
          >
            LinkedIn
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {profile.highlights.map((h) => (
          <div key={h.label} className="card p-5 text-center">
            <div className="font-mono text-3xl font-bold text-gradient">{h.stat}</div>
            <div className="mt-1 text-xs leading-snug text-ink-500">{h.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
