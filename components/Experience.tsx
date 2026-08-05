import { experience } from "@/lib/resume";

export default function Experience() {
  return (
    <section id="experience" className="py-16">
      <h2 className="mb-2 font-mono text-sm uppercase tracking-widest text-cyan-glow">01 / Experience</h2>
      <h3 className="mb-10 text-3xl font-bold">Where I&apos;ve worked</h3>
      <div className="relative flex flex-col gap-8 border-l border-violet-glow/20 pl-6 sm:pl-10">
        {experience.map((job) => (
          <article key={job.company + job.period} className="card relative p-6 sm:p-8">
            <span className="absolute -left-[31px] top-9 h-3 w-3 rounded-full border-2 border-night-950 bg-violet-glow sm:-left-[47px]" />
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="text-xl font-semibold">
                {job.role} <span className="text-ink-500">· {job.company}</span>
              </h4>
              <span className="font-mono text-xs text-ink-500">{job.period}</span>
            </div>
            <p className="mt-1 text-sm text-cyan-glow">{job.focus} — {job.location}</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {job.bullets.map((b, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink-300">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-glow" />
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              {job.stack.map((s) => (
                <span key={s} className="chip">{s}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
