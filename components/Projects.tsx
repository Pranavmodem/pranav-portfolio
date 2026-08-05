import { projects } from "@/lib/resume";

export default function Projects() {
  return (
    <section id="projects" className="py-16">
      <h2 className="mb-2 font-mono text-sm uppercase tracking-widest text-cyan-glow">02 / Projects</h2>
      <h3 className="mb-10 text-3xl font-bold">AI/ML systems I build &amp; run</h3>
      <div className="grid gap-6 md:grid-cols-2">
        {projects.map((p, idx) => (
          <article key={p.name} className={`card p-6 sm:p-8 ${idx === 0 ? "md:col-span-2" : ""}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="text-xl font-semibold text-gradient">{p.name}</h4>
              <span className="font-mono text-xs text-ink-500">{p.period}</span>
            </div>
            <p className="mt-1 text-sm font-medium text-ink-100">{p.subtitle}</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-300">{p.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {p.stack.map((s) => (
                <span key={s} className="chip">{s}</span>
              ))}
              {p.link && (
                <a
                  href={p.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-sm font-semibold text-violet-glow hover:underline"
                >
                  Visit live ↗
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
