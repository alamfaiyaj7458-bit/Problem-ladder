"use client";

import { Input, Label } from "@/components/ui/Field";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D"];

interface McqOptionsEditorProps {
  options: string[]; // always length 4 in local state; blanks are allowed while editing
  correctIndex: number | null;
  onChange: (options: string[]) => void;
  onCorrectIndexChange: (index: number) => void;
}

/**
 * Renders 4 lettered option inputs + a radio marking the correct one.
 * Submits as `option_0..option_3` + `correct_option` (index into the raw
 * 4 slots) — the server action filters blanks and re-indexes, see
 * `parseOptions` in src/server-actions/problems.ts.
 */
export function McqOptionsEditor({ options, correctIndex, onChange, onCorrectIndexChange }: McqOptionsEditorProps) {
  const filledCount = options.filter((o) => o.trim()).length;

  return (
    <div>
      <Label>Answer choices</Label>
      <div className="space-y-2">
        {LETTERS.map((letter, i) => (
          <div key={letter} className="flex items-center gap-2">
            <label
              className={cn(
                "flex h-9 w-9 flex-none cursor-pointer items-center justify-center rounded-md border text-sm font-medium transition-colors",
                correctIndex === i
                  ? "border-level-beginner bg-level-beginner/10 text-level-beginner"
                  : "border-line text-ink-soft hover:border-accent"
              )}
              title="Mark as the correct answer"
            >
              <input
                type="radio"
                name="correct_option"
                value={i}
                checked={correctIndex === i}
                onChange={() => onCorrectIndexChange(i)}
                className="sr-only"
              />
              {letter}
            </label>
            <Input
              name={`option_${i}`}
              value={options[i] ?? ""}
              onChange={(e) => {
                const next = [...options];
                next[i] = e.target.value;
                onChange(next);
              }}
              placeholder={`Option ${letter}`}
            />
          </div>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-ink-faint">
        {filledCount < 2
          ? "Add at least 2 choices and select the correct one before publishing."
          : correctIndex === null
            ? "Select which choice is correct before publishing."
            : "Click the letter to mark the correct choice."}
      </p>
    </div>
  );
}