import { profile } from "@/lib/resume";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-8">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 text-xs text-ink-500 sm:px-8">
        <span>
          © {new Date().getFullYear()} {profile.name} · Built with Next.js, Supabase &amp; Vercel
        </span>
        <span className="font-mono">
          <a href={profile.github} target="_blank" rel="noopener noreferrer" className="hover:text-ink-300">
            github
          </a>
          {" · "}
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-ink-300">
            linkedin
          </a>
          {" · "}
          <a href={`mailto:${profile.email}`} className="hover:text-ink-300">
            email
          </a>
        </span>
      </div>
    </footer>
  );
}
