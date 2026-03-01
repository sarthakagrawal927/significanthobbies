import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { db } from "~/server/db";
import { Badge } from "~/components/ui/badge";
import { HOBBY_CATEGORIES, getCategoryForHobby } from "~/lib/hobbies";
import { authOptions } from "~/server/auth/config";
import type { Phase } from "~/lib/types";

interface Props {
  params: Promise<{ hobby: string }>;
}

function slugToHobby(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function generateStaticParams() {
  return HOBBY_CATEGORIES.flatMap((c) =>
    c.hobbies.map((h) => ({
      hobby: h.toLowerCase().replace(/\s+/g, "-"),
    })),
  );
}

export async function generateMetadata({ params }: Props) {
  const { hobby } = await params;
  const name = slugToHobby(decodeURIComponent(hobby));
  return { title: `${name} — SignificantHobbies` };
}

export default async function HobbyDetailPage({ params }: Props) {
  const { hobby: hobbySlug } = await params;
  const hobbyName = slugToHobby(decodeURIComponent(hobbySlug));

  const category = getCategoryForHobby(hobbyName);
  if (!category) notFound();

  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user;

  // Find public timelines that include this hobby
  const rawTimelines = await db.timeline.findMany({
    where: { visibility: "PUBLIC" },
    include: {
      user: { select: { name: true, username: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const matchingTimelines = rawTimelines.filter((t) => {
    try {
      const phases = JSON.parse(t.phases as string) as Phase[];
      return phases.some((p) =>
        p.hobbies.some((h) => h.name.toLowerCase() === hobbyName.toLowerCase()),
      );
    } catch {
      return false;
    }
  });

  const popularityCount = matchingTimelines.length;

  const otherHobbies = category.hobbies.filter(
    (h) => h.toLowerCase() !== hobbyName.toLowerCase(),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Guest CTA banner */}
      {!isLoggedIn && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-emerald-800/50 bg-emerald-950/30 px-5 py-3">
          <p className="text-sm text-slate-300">
            Track your <span className="font-semibold text-emerald-300">{hobbyName}</span> journey
          </p>
          <Link
            href="/timeline/new"
            className="shrink-0 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Start now →
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="mb-2">
        <Link
          href="/hobbies"
          className="text-sm text-slate-500 hover:text-slate-300"
        >
          ← All hobbies
        </Link>
      </div>
      <div className="mb-8 flex items-center gap-3">
        <span className="text-4xl">{category.emoji}</span>
        <div>
          <h1 className="text-3xl font-bold text-slate-100">{hobbyName}</h1>
          <p className="text-slate-500 text-sm">{category.name}</p>
        </div>
      </div>

      {/* Popularity */}
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-5 py-3 flex items-center gap-3">
          <span className="text-2xl font-bold text-emerald-400">{popularityCount}</span>
          <span className="text-sm text-slate-400">
            {popularityCount === 1
              ? "public timeline features this hobby"
              : popularityCount === 0
              ? (
                <span>
                  public timelines yet —{" "}
                  <Link href="/timeline/new" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                    be the first!
                  </Link>
                </span>
              )
              : "public timelines feature this hobby"}
          </span>
        </div>
      </div>

      {/* Community timelines */}
      <div className="mb-12">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-slate-500">
          Community timelines featuring {hobbyName}
        </h2>
        {matchingTimelines.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {matchingTimelines.map((t) => {
              let phases: Phase[] = [];
              try {
                phases = JSON.parse(t.phases as string) as Phase[];
              } catch { /* ignore */ }
              const totalHobbies = new Set(
                phases.flatMap((p) => p.hobbies.map((h) => h.name)),
              ).size;
              return (
                <Link key={t.id} href={`/timeline/${t.id}`}>
                  <div className="group rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition-colors hover:border-emerald-800">
                    <h3 className="font-medium text-slate-200 group-hover:text-emerald-300 transition-colors">
                      {t.title ?? "Hobby Timeline"}
                    </h3>
                    {t.user && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        @{t.user.username ?? t.user.name}
                      </p>
                    )}
                    <p className="text-xs text-slate-600 mt-1.5">
                      {phases.length} phases · {totalHobbies} hobbies
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center">
            <p className="text-slate-500">
              No public timelines feature {hobbyName} yet.
            </p>
            <Link href="/timeline/new">
              <button className="mt-3 text-sm text-emerald-400 hover:text-emerald-300">
                Be the first →
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Related hobbies in same category */}
      {otherHobbies.length > 0 && (
        <div>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-slate-500">
            {category.emoji} Other {category.name.toLowerCase()} hobbies
          </h2>
          <div className="flex flex-wrap gap-2">
            {otherHobbies.map((h) => (
              <Link
                key={h}
                href={`/hobbies/${encodeURIComponent(h.toLowerCase().replace(/\s+/g, "-"))}`}
              >
                <Badge
                  variant="outline"
                  className="border-slate-700 text-slate-400 hover:border-emerald-700 hover:text-emerald-300 cursor-pointer transition-colors"
                >
                  {category.emoji} {h}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
