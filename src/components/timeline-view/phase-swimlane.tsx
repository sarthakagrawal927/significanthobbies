import { Badge } from "~/components/ui/badge";
import { getCategoryForHobby } from "~/lib/hobbies";
import type { Phase } from "~/lib/types";

interface Props {
  phases: Phase[];
}

const INTENSITY_LABELS = ["", "Trying", "Casual", "Regular", "Passionate", "Core"];

export function PhaseSwimlane({ phases }: Props) {
  if (!phases.length) return null;

  return (
    <div className="overflow-x-auto">
      <div
        className="grid gap-px bg-stone-200 rounded-xl overflow-hidden border border-stone-200"
        style={{ gridTemplateColumns: `repeat(${phases.length}, minmax(160px, 1fr))` }}
      >
        {phases.map((phase, index) => {
          const hue = index * (120 / Math.max(phases.length - 1, 1)) + 160;
          const borderColor = `hsl(${hue}, 60%, 45%)`;

          return (
            <div key={phase.id} className="bg-white flex flex-col">
              {/* Phase header with colored top border */}
              <div
                className="border-b border-stone-100 px-3 py-3 bg-stone-50"
                style={{ borderTop: `3px solid ${borderColor}` }}
              >
                <h3 className="font-semibold text-stone-800 text-sm">
                  {phase.label}
                </h3>
                {(phase.ageStart ?? phase.yearStart) && (
                  <p className="text-xs text-stone-500 mt-0.5">
                    {phase.ageStart !== undefined
                      ? `Age ${phase.ageStart}${phase.ageEnd !== undefined ? `–${phase.ageEnd}` : "+"}`
                      : `${phase.yearStart}${phase.yearEnd ? `–${phase.yearEnd}` : "+"}`}
                  </p>
                )}
              </div>

              {/* Hobbies */}
              <div className="px-3 py-3 flex-1 space-y-1.5">
                {phase.hobbies.length === 0 && (
                  <div className="rounded-md border border-dashed border-stone-300 px-3 py-4 text-center">
                    <p className="text-xs text-stone-400 italic">No hobbies added</p>
                  </div>
                )}
                {phase.hobbies.map((hobby) => {
                  const category = getCategoryForHobby(hobby.name);
                  return (
                    <div
                      key={hobby.name}
                      className="group hover:bg-stone-100 rounded px-1 -mx-1 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        {category && (
                          <span className="text-xs">{category.emoji}</span>
                        )}
                        <span className="text-xs text-stone-700">{hobby.name}</span>
                      </div>
                      {hobby.intensity && (
                        <div className="mt-0.5 flex gap-0.5 ml-4">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-1 w-3 rounded-full ${
                                i < (hobby.intensity ?? 0)
                                  ? "bg-emerald-500"
                                  : "bg-stone-200"
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-xs text-stone-400">
                            {INTENSITY_LABELS[hobby.intensity]}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Count badge */}
              <div className="px-3 pb-3">
                <Badge
                  variant="outline"
                  className="border-stone-200 text-xs text-stone-400"
                >
                  {phase.hobbies.length} hobbies
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
