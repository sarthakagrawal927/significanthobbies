import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { db } from "~/server/db";
import type { Phase } from "~/lib/types";

async function getDemoTimelines() {
  try {
    return await db.timeline.findMany({
      where: { visibility: "PUBLIC" },
      include: { user: { select: { name: true, username: true } } },
      orderBy: { createdAt: "asc" },
      take: 3,
    });
  } catch {
    return [];
  }
}

const features = [
  {
    icon: "🗺️",
    title: "Map your journey",
    desc: "Build life phases from childhood to now. Add every hobby, interest, and passion along the way.",
  },
  {
    icon: "💡",
    title: "Discover insights",
    desc: "See rekindled hobbies, what stuck across decades, and patterns you never noticed before.",
  },
  {
    icon: "✨",
    title: "Find what's next",
    desc: "Get personalized suggestions and browse what others with similar tastes explore.",
  },
];

export default async function HomePage() {
  const demos = await getDemoTimelines();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-28">
        {/* Top emerald radial — more dramatic */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(16,185,129,0.18) 0%, transparent 70%)",
          }}
        />
        {/* Bottom indigo tint */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 110%, rgba(99,102,241,0.06) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-800/50 bg-emerald-900/20 px-4 py-1.5 text-sm text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Map your hobby journey
          </div>
          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-slate-100 sm:text-6xl">
            Your hobbies tell a{" "}
            <span className="text-emerald-400">significant</span> story
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-xl text-slate-400">
            Track your hobbies across life phases. Discover what rekindled,
            what persisted, and what to explore next.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/timeline/new">
              <Button
                size="lg"
                className="bg-emerald-600 px-8 text-white hover:bg-emerald-500"
              >
                Build your timeline →
              </Button>
            </Link>
            <Link href="/hobbies">
              <Button
                size="lg"
                variant="outline"
                className="border-slate-700 px-8 text-slate-300 hover:text-white"
              >
                Discover hobbies
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            No sign-up required to start
          </p>
        </div>
      </section>

      {/* Feature trio */}
      <section className="border-t border-slate-800 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="animate-fade-in-up text-center opacity-0"
                style={{ animationDelay: `${i * 120}ms`, animationFillMode: "forwards" }}
              >
                <div className="mb-4 text-4xl">{f.icon}</div>
                <h3 className="mb-2 font-semibold text-slate-200">{f.title}</h3>
                <p className="text-sm text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo gallery */}
      {demos.length > 0 && (
        <section className="border-t border-slate-800 px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-100">
                  Community timelines
                </h2>
                <p className="mt-1 text-slate-500">
                  Real hobby journeys shared by the community
                </p>
              </div>
              <Link href="/hobbies">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  Explore hobbies →
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {demos.map((t) => {
                let phases: Phase[] = [];
                try {
                  phases = JSON.parse(t.phases as string) as Phase[];
                } catch {
                  /* ignore */
                }
                const totalHobbies = new Set(
                  phases.flatMap((p) => p.hobbies.map((h) => h.name)),
                ).size;
                return (
                  <Link key={t.id} href={`/timeline/${t.id}`}>
                    <div className="group rounded-xl border border-slate-700 bg-slate-900 p-5 transition-colors hover:border-emerald-700">
                      <h3 className="mb-1 font-medium text-slate-200 transition-colors group-hover:text-emerald-300">
                        {t.title ?? "Hobby Timeline"}
                      </h3>
                      {t.user && (
                        <p className="mb-3 text-xs text-slate-500">
                          @{t.user.username ?? t.user.name}
                        </p>
                      )}
                      {/* Phase count pill strip */}
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex gap-0.5" aria-label={`${phases.length} phases`}>
                          {Array.from({ length: Math.max(phases.length, 1) }).map((_, idx) => (
                            <span
                              key={idx}
                              className="h-1.5 w-4 rounded-full bg-emerald-700/60 transition-colors group-hover:bg-emerald-600/80"
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-500">
                          {phases.length} phases · {totalHobbies} hobbies
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {phases.slice(0, 3).map((p) => (
                          <Badge
                            key={p.id}
                            variant="outline"
                            className="border-slate-700 text-xs text-slate-500"
                          >
                            {p.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Export CTA */}
      <section className="border-t border-slate-800 px-4 py-16 text-center">
        {/* Subtle glow border wrapper */}
        <div
          className="mx-auto max-w-lg rounded-2xl p-px"
          style={{
            background:
              "linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(99,102,241,0.15) 50%, rgba(16,185,129,0.08) 100%)",
          }}
        >
          <div className="rounded-2xl bg-slate-950 px-8 py-12">
            <div className="mb-5 text-6xl">🎨</div>
            <h2 className="mb-3 text-2xl font-bold text-slate-100">
              Export a beautiful card
            </h2>
            <p className="mb-8 text-slate-400">
              Generate a shareable image of your hobby journey — designed to
              stand out.
            </p>
            <Link href="/timeline/new">
              <Button
                size="lg"
                className="bg-emerald-600 px-10 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] ring-1 ring-emerald-500/40 hover:bg-emerald-500 hover:shadow-[0_0_28px_rgba(16,185,129,0.5)] hover:ring-emerald-400/60 transition-shadow"
              >
                Start for free
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
