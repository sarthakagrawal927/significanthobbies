"use client";

import { useState, type KeyboardEvent } from "react";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { X } from "lucide-react";
import type { HobbyEntry } from "~/lib/types";

interface Props {
  hobbies: HobbyEntry[];
  onChange: (hobbies: HobbyEntry[]) => void;
}

export function HobbyInput({ hobbies, onChange }: Props) {
  const [input, setInput] = useState("");

  function addHobbies(raw: string) {
    const names = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const existing = new Set(hobbies.map((h) => h.name.toLowerCase()));
    const newHobbies = names
      .filter((name) => !existing.has(name.toLowerCase()))
      .map((name) => ({ name }));
    if (newHobbies.length) onChange([...hobbies, ...newHobbies]);
    setInput("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addHobbies(input);
    }
  }

  function removeHobby(name: string) {
    onChange(hobbies.filter((h) => h.name !== name));
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add hobbies (comma-separated, Enter to add)"
          className="bg-slate-800 border-slate-700 text-sm h-8"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addHobbies(input)}
          className="border-slate-700 h-8 shrink-0"
        >
          Add
        </Button>
      </div>
      {hobbies.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {hobbies.map((hobby) => (
            <Badge
              key={hobby.name}
              variant="secondary"
              className="bg-emerald-900/40 text-emerald-300 border border-emerald-800/60 pr-1 flex items-center gap-1 text-xs"
            >
              {hobby.name}
              <button
                onClick={() => removeHobby(hobby.name)}
                className="hover:text-white ml-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
