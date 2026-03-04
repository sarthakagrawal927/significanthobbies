import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Lock, Globe, Link as LinkIcon } from "lucide-react";
import type { TimelineData } from "~/lib/types";

interface Props {
  timeline: TimelineData;
  showVisibility?: boolean;
}

const VISIBILITY_ICONS = {
  PRIVATE: Lock,
  UNLISTED: LinkIcon,
  PUBLIC: Globe,
};

export function TimelineCard({ timeline, showVisibility = false }: Props) {
  const { phases } = timeline;
  const totalHobbies = new Set(
    phases.flatMap((p) => p.hobbies.map((h) => h.name.toLowerCase())),
  ).size;

  const VisIcon = VISIBILITY_ICONS[timeline.visibility];

  return (
    <Link href={`/timeline/${timeline.id}`}>
      <div className="group rounded-xl border border-stone-200 bg-white p-5 transition-colors hover:border-emerald-400 hover:bg-stone-50">
        {/* Title row */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="font-medium text-stone-800 group-hover:text-emerald-600 transition-colors leading-tight">
            {timeline.title ?? "Hobby Timeline"}
          </h3>
          {showVisibility && (
            <VisIcon className="h-3.5 w-3.5 text-stone-400 shrink-0 mt-0.5" />
          )}
        </div>

        {/* Phase badges */}
        <div className="mb-3 flex flex-wrap gap-1">
          {phases.slice(0, 4).map((p) => (
            <Badge
              key={p.id}
              variant="outline"
              className="border-stone-200 text-xs text-stone-500 py-0"
            >
              {p.label}
            </Badge>
          ))}
          {phases.length > 4 && (
            <Badge
              variant="outline"
              className="border-stone-200 text-xs text-stone-400 py-0"
            >
              +{phases.length - 4}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <p className="text-xs text-stone-400">
          {phases.length} phases · {totalHobbies} hobbies
        </p>
      </div>
    </Link>
  );
}
