"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { HobbyInput } from "./hobby-input";
import type { Phase } from "~/lib/types";

interface Props {
  phase: Phase;
  onChange: (phase: Phase) => void;
  onDelete: () => void;
  isOnly: boolean;
}

export function PhaseCard({ phase, onChange, onDelete, isOnly }: Props) {
  const [open, setOpen] = useState(true);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: phase.id });

  const hasHobbies = phase.hobbies.length > 0;
  const dotColor = `hsl(${phase.order * 40 + 160}, 70%, 45%)`;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function update(patch: Partial<Phase>) {
    onChange({ ...phase, ...patch });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border bg-white ${
        hasHobbies
          ? "border-l-2 border-l-emerald-500 border-stone-200"
          : "border-stone-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-stone-400 hover:text-stone-600 active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Colored dot */}
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: dotColor }}
        />

        <Input
          value={phase.label}
          onChange={(e) => update({ label: e.target.value })}
          placeholder="Phase name (e.g. High school)"
          className="h-8 flex-1 border-transparent bg-transparent text-sm font-medium text-stone-800 placeholder:text-stone-400 focus-visible:border-stone-300 focus-visible:bg-stone-50"
        />

        <div className="flex items-center gap-1">
          {!isOnly && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-stone-400 hover:text-red-500"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-stone-400 hover:text-stone-700"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Body */}
      {open && (
        <div className="border-t border-stone-100 px-4 pb-4 pt-3 space-y-4">
          {/* Age range */}
          <div className="space-y-1.5">
            <Label className="text-xs text-stone-500">Age range</Label>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                value={phase.ageStart ?? ""}
                onChange={(e) =>
                  update({
                    ageStart: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="From"
                className="h-7 border-stone-300 bg-stone-50 text-xs"
              />
              <span className="text-stone-400 text-xs">–</span>
              <Input
                type="number"
                value={phase.ageEnd ?? ""}
                onChange={(e) =>
                  update({
                    ageEnd: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="To"
                className="h-7 border-stone-300 bg-stone-50 text-xs"
              />
            </div>
          </div>

          {/* Hobbies */}
          <div className="space-y-1.5">
            <Label className="text-xs text-stone-500">
              Hobbies{" "}
              <span className={hasHobbies ? "text-emerald-600" : "text-stone-400"}>
                ({phase.hobbies.length})
              </span>
            </Label>
            <HobbyInput
              hobbies={phase.hobbies}
              onChange={(hobbies) => update({ hobbies })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
