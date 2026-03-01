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
      className="rounded-xl border border-slate-700 bg-slate-900"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-slate-600 hover:text-slate-400 active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <Input
          value={phase.label}
          onChange={(e) => update({ label: e.target.value })}
          placeholder="Phase name (e.g. High school)"
          className="h-8 flex-1 border-transparent bg-transparent text-sm font-medium text-slate-200 placeholder:text-slate-600 focus-visible:border-slate-700 focus-visible:bg-slate-800"
        />

        <div className="flex items-center gap-1">
          {!isOnly && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-600 hover:text-red-400"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-600 hover:text-slate-300"
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
        <div className="border-t border-slate-800 px-4 pb-4 pt-3 space-y-4">
          {/* Age / year range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Age range</Label>
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
                  className="h-7 border-slate-700 bg-slate-800 text-xs"
                />
                <span className="text-slate-600 text-xs">–</span>
                <Input
                  type="number"
                  value={phase.ageEnd ?? ""}
                  onChange={(e) =>
                    update({
                      ageEnd: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="To"
                  className="h-7 border-slate-700 bg-slate-800 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Year range</Label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  value={phase.yearStart ?? ""}
                  onChange={(e) =>
                    update({
                      yearStart: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="From"
                  className="h-7 border-slate-700 bg-slate-800 text-xs"
                />
                <span className="text-slate-600 text-xs">–</span>
                <Input
                  type="number"
                  value={phase.yearEnd ?? ""}
                  onChange={(e) =>
                    update({
                      yearEnd: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="To"
                  className="h-7 border-slate-700 bg-slate-800 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Hobbies */}
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">
              Hobbies{" "}
              <span className="text-slate-600">
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
