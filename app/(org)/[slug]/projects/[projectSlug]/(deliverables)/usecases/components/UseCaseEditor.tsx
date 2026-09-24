"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { UseCaseCreateRequest, UseCaseItemResponse, UseCaseModelResponse } from "@/lib/api/services/useCaseModel";
import { USE_CASE_LEVEL_META, USE_CASE_PRIORITY_META, USE_CASE_STATUS_META } from "@/lib/usecases/useCaseLabels";

const fieldClass = "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm";

export function UseCaseEditor({ model, item, busy, onClose, onSave }: {
  model: UseCaseModelResponse;
  item?: UseCaseItemResponse;
  busy: boolean;
  onClose: () => void;
  onSave: (body: UseCaseCreateRequest) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<UseCaseCreateRequest>(() => item ? {
    level: item.level, title: item.title, primaryActorId: item.primaryActorId,
    supportingActorIds: item.supportingActorIds, subsystem: item.subsystem,
    status: item.status, priority: item.priority, parentUseCaseId: item.parentUseCaseId,
    description: item.description, precondition: item.precondition, sourceTrace: item.sourceTrace,
  } : {
    level: "L2", title: "", primaryActorId: model.actors[0]?.id ?? "", supportingActorIds: [],
    subsystem: "", status: "Suggested", priority: "Should", parentUseCaseId: null,
    description: "", precondition: "", sourceTrace: [],
  });
  const update = <K extends keyof UseCaseCreateRequest>(key: K, value: UseCaseCreateRequest[K]) => setDraft((old) => ({ ...old, [key]: value }));
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{item ? "Edit use case" : "Add use case"}</DialogTitle><DialogDescription>Set the hierarchy, actors, behavior and BRD/PRD traceability for this row.</DialogDescription></DialogHeader>
    <form className="space-y-4" onSubmit={async (event) => { event.preventDefault(); if (await onSave({ ...draft, sourceTrace: draft.sourceTrace.map((source) => source.trim()).filter(Boolean) })) onClose(); }}>
      <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
        <label className="block text-xs">Use case name<input required minLength={2} maxLength={160} value={draft.title} onChange={(e) => update("title", e.target.value)} className={fieldClass} /></label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="text-xs">Model level<select value={draft.level} onChange={(e) => setDraft((old) => ({ ...old, level: e.target.value as UseCaseCreateRequest["level"], parentUseCaseId: null }))} className={fieldClass}>{(["L0", "L1", "L2"] as const).map((value) => <option key={value} value={value}>{value} · {USE_CASE_LEVEL_META[value].label}</option>)}</select></label>
          <label className="text-xs">Evidence<select value={draft.status} onChange={(e) => update("status", e.target.value as UseCaseCreateRequest["status"])} className={fieldClass}>{(["Confirmed", "Inferred", "Suggested"] as const).map((value) => <option key={value} value={value}>{USE_CASE_STATUS_META[value].label}</option>)}</select></label>
          <label className="text-xs">Priority<select value={draft.priority} onChange={(e) => update("priority", e.target.value as UseCaseCreateRequest["priority"])} className={fieldClass}>{(["Must", "Should", "Could"] as const).map((value) => <option key={value} value={value}>{value} · {USE_CASE_PRIORITY_META[value].label}</option>)}</select></label>
        </div>
        <label className="block text-xs">Parent capability or use case<select value={draft.parentUseCaseId ?? ""} onChange={(e) => update("parentUseCaseId", e.target.value || null)} className={fieldClass}><option value="">No parent · top-level capability group</option>{model.useCases.filter((row) => row.id !== item?.id && row.level < draft.level).map((row) => <option key={row.id} value={row.id}>{row.level} · {row.title} ({row.id})</option>)}</select></label>
        <label className="block text-xs">Primary actor <span className="text-muted-foreground">(starts the use case)</span><select required value={draft.primaryActorId} onChange={(e) => setDraft((old) => ({ ...old, primaryActorId: e.target.value, supportingActorIds: old.supportingActorIds.filter((id) => id !== e.target.value) }))} className={fieldClass}><option value="">Select primary actor</option>{model.actors.map((actor) => <option key={actor.id} value={actor.id}>{actor.name}</option>)}</select></label>
        <div className="text-xs">Supporting actors <span className="text-muted-foreground">(help complete the use case)</span><div className="mt-2 flex flex-wrap gap-3">{model.actors.filter((actor) => actor.id !== draft.primaryActorId).map((actor) => <label key={actor.id} className="flex items-center gap-2"><input type="checkbox" checked={draft.supportingActorIds.includes(actor.id)} onChange={(e) => update("supportingActorIds", e.target.checked ? [...draft.supportingActorIds, actor.id] : draft.supportingActorIds.filter((id) => id !== actor.id))} />{actor.name}</label>)}</div></div>
        <label className="block text-xs">Area / subsystem<input required maxLength={160} value={draft.subsystem} onChange={(e) => update("subsystem", e.target.value)} className={fieldClass} /></label>
        <label className="block text-xs">Description<textarea required maxLength={600} value={draft.description} onChange={(e) => update("description", e.target.value)} className={fieldClass} /></label>
        <label className="block text-xs">Precondition <span className="text-muted-foreground">(what must be true before it starts)</span><textarea required maxLength={400} value={draft.precondition} onChange={(e) => update("precondition", e.target.value)} className={fieldClass} /></label>
        <label className="block text-xs">Traceability references <span className="text-muted-foreground">(one BRD/PRD reference per line)</span><textarea required value={draft.sourceTrace.join("\n")} onChange={(e) => update("sourceTrace", e.target.value.split("\n"))} className={fieldClass} /></label>
      </fieldset>
      <div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className="rounded-md border px-4 py-2 text-sm">Cancel</button><button disabled={busy || !model.actors.length} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{busy ? "Saving…" : "Save use case"}</button></div>
    </form>
  </DialogContent></Dialog>;
}
