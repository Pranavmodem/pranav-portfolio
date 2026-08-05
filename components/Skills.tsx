import { skills, education, certifications } from "@/lib/resume";

export default function Skills() {
  return (
    <section id="skills" className="py-16">
      <h2 className="mb-2 font-mono text-sm uppercase tracking-widest text-cyan-glow">03 / Skills</h2>
      <h3 className="mb-10 text-3xl font-bold">Tools of the trade</h3>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((group) => (
          <div key={group.group} className="card p-5">
            <h4 className="mb-3 font-mono text-sm font-semibold text-violet-glow">{group.group}</h4>
            <div className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <span key={item} className="rounded-md bg-white/5 px-2.5 py-1 text-xs text-ink-300">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <div className="card p-6">
          <h4 className="mb-4 font-mono text-sm font-semibold text-violet-glow">Education</h4>
          {education.map((e) => (
            <div key={e.degree} className="mb-4 last:mb-0">
              <p className="font-semibold">{e.degree}</p>
              <p className="text-sm text-ink-300">
                {e.school}, {e.location} · {e.year} · GPA {e.gpa}
              </p>
            </div>
          ))}
        </div>
        <div className="card p-6">
          <h4 className="mb-4 font-mono text-sm font-semibold text-violet-glow">Certifications</h4>
          <ul className="flex flex-col gap-2">
            {certifications.map((c) => (
              <li key={c} className="flex gap-3 text-sm text-ink-300">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan-glow" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
