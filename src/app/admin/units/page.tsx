import { createClient } from "@/lib/supabase/server";
import { createUnit } from "@/server-actions/units";
import { Card, Input, Textarea, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { UnitRow } from "@/components/admin/UnitRow";

export const revalidate = 0;

export default async function AdminUnitsPage() {
  const supabase = await createClient();
  const { data: units } = await supabase
    .from("units")
    .select("*, chapters(id)")
    .order("sort_order");

  return (
    <div>
      <h1 className="font-serif text-2xl text-ink">Units &amp; chapters</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Units and chapters are the only categories the AI is allowed to use — it can pick among them, never invent new ones.
      </p>

      <Card className="mt-6 p-5">
        <h2 className="mb-3 text-sm font-medium text-ink-soft">New unit</h2>
        <form action={createUnit} className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input name="name" required placeholder="e.g. Geometry" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea name="description" rows={2} placeholder="Optional" />
          </div>
          <Button type="submit" size="sm">
            Create unit
          </Button>
        </form>
      </Card>

      <Card className="mt-6 divide-y divide-line">
        {(units ?? []).map((unit) => (
          <UnitRow
            key={unit.id}
            unit={unit}
            chapterCount={(unit as unknown as { chapters: unknown[] }).chapters?.length ?? 0}
          />
        ))}
        {(!units || units.length === 0) && (
          <p className="px-4 py-3 text-sm text-ink-faint">No units yet.</p>
        )}
      </Card>
    </div>
  );
}
