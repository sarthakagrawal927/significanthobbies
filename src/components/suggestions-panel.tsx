import { getSuggestedHobbies, getCategoryForHobby } from "~/lib/hobbies";
import { Badge } from "~/components/ui/badge";

interface Props {
  existingHobbies: string[];
}

export function SuggestionsPanel({ existingHobbies }: Props) {
  const suggestions = getSuggestedHobbies(existingHobbies, 8);
  if (!suggestions.length) return null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="mb-3 text-sm font-medium text-slate-400">
        You might enjoy
      </h2>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((hobby) => {
          const cat = getCategoryForHobby(hobby);
          return (
            <span
              key={hobby}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:border-emerald-700 hover:text-emerald-300 transition-colors cursor-default"
            >
              {cat && <span className="text-sm">{cat.emoji}</span>}
              {hobby}
            </span>
          );
        })}
      </div>
    </div>
  );
}
