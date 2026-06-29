"use client";

import { useState } from "react";
import { approveCandidate, rejectCandidate } from "@/server-actions/candidates";
import { Button } from "@/components/ui/Button";
import { TagChip } from "@/components/TagChip";
import type { ProblemCandidate } from "@/lib/types";

export function CandidateCard({ candidate }: { candidate: ProblemCandidate }) {
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(false);

  async function handleApprove() {
    setBusy(true);
    try {
      await approveCandidate(candidate.id);
      setHidden(true);
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    setBusy(true);
    try {
      await rejectCandidate(candidate.id);
      setHidden(true);
    } finally {
      setBusy(false);
    }
  }

  if (hidden) return null;

  return (
    <div className="rounded-lg border border-line bg-paper-raised p-4 shadow-card">
      <h3 className="font-serif text-base text-ink">{candidate.title}</h3>
      <p className="mt-2 text-sm text-ink-soft whitespace-pre-wrap">{candidate.statement}</p>
      {candidate.source_url && (
        <a
          href={candidate.source_url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block break-all text-xs text-accent hover:underline"
        >
          {candidate.source_url}
        </a>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {candidate.suggested_tags.map((t) => (
          <TagChip key={t} tag={t} />
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Button size="sm" onClick={handleApprove} disabled={busy}>
          Approve &amp; create draft
        </Button>
        <Button size="sm" variant="danger" onClick={handleReject} disabled={busy}>
          Reject
        </Button>
      </div>
    </div>
  );
}
