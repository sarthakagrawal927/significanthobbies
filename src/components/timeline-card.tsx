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
      <div className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition-colors hover:border-emerald-800 hover:bg-slate-900">
        {/* Title row */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="font-medium text-slate-200 group-hover:text-emerald-300 transition-colors leading-tight">
            {timeline.title ?? "Hobby Timeline"}
          </h3>
          {showVisibility && (
            <VisIcon className="h-3.5 w-3.5 text-slate-600 shrink-0 mt-0.5" />
          )}
        </div>

        {/* Phase badges */}
        <div className="mb-3 flex flex-wrap gap-1">
          {phases.slice(0, 4).map((p) => (
            <Badge
              key={p.id}
              variant="outline"
              className="border-slate-700 text-xs text-slate-500 py-0"
            >
              {p.label}
            </Badge>
          ))}
          {phases.length > 4 && (
            <Badge
              variant="outline"
              className="border-slate-700 text-xs text-slate-600 py-0"
            >
              +{phases.length - 4}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <p className="text-xs text-slate-600">
          {phases.length} phases · {totalHobbies} hobbies
        </p>
      </div>
    </Link>
  );
}
