"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { UseCaseActorKind, UseCaseActorResponse } from "@/lib/api/services/useCaseModel";

export function UseCaseActorsDialog({ actors, busy, error, onClose, onCreate, onRename, onDelete }: {
  actors: UseCaseActorResponse[]; busy: boolean; error: string | null;
  onClose: () => void;
  onCreate: (name: string, kind: UseCaseActorKind) => Promise<boolean>;
  onRename: (id: string, name: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<UseCaseActorKind>("Supporting actor");
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Actors</DialogTitle><DialogDescription>Actors referenced by use cases must be unlinked before deletion.</DialogDescription></DialogHeader>
    <div className="space-y-2">{actors.map((actor) => <div key={`${actor.id}-${actor.name}`} className="flex items-center gap-2 rounded-md border border-border p-2"><form className="flex min-w-0 flex-1 gap-2" onSubmit={(event) => { event.preventDefault(); const value = String(new FormData(event.currentTarget).get("name") ?? "").trim(); if (value) void onRename(actor.id, value); }}><input name="name" aria-label={`Name of ${actor.name}`} required maxLength={120} defaultValue={actor.name} disabled={busy} className="min-w-0 flex-1 bg-transparent text-sm outline-none" /><button disabled={busy} className="text-xs text-primary">Save</button></form><button type="button" disabled={busy} onClick={() => void onDelete(actor.id)} className="text-xs text-destructive">Delete</button></div>)}</div>
    <form className="space-y-3 border-t border-border pt-3" onSubmit={async (event) => { event.preventDefault(); if (name.trim() && await onCreate(name.trim(), kind)) setName(""); }}><input required maxLength={120} aria-label="New actor name" placeholder="New actor name" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" /><div className="flex justify-between gap-2"><select aria-label="Actor kind" value={kind} onChange={(e) => setKind(e.target.value as UseCaseActorKind)} disabled={busy} className="rounded-md border border-border bg-background px-2 text-sm"><option>Primary actor</option><option>Supporting actor</option></select><button disabled={busy} className="rounded-md bg-primary px-3 py-2 text-xs text-primary-foreground">Add actor</button></div></form>
    {error ? <p role="alert" className="whitespace-pre-line text-sm text-destructive">{error}</p> : null}
  </DialogContent></Dialog>;
}
