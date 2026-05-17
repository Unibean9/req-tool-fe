"use client";

import { BookOpen, Layers, ListTree, PanelLeft, PanelLeftClose } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  REQUIREMENTS_PALETTE_DRAG_MIME,
  REQUIREMENT_KIND_LABELS,
  REQUIREMENT_KIND_STYLES,
} from "./requirementsModelConstants";
import { REQUIREMENTS_WORKSPACE_TOOLBAR_CLASS } from "./requirementsWorkspaceUi";
import type { PaletteCreatableKind, PaletteDragPayload } from "./requirementsModelTypes";

const PALETTE_ITEMS: {
  kind: PaletteCreatableKind;
  icon: typeof Layers;
  hint: string;
}[] = [
  { kind: "epic", icon: Layers, hint: "Gắn vào actor hiện tại" },
  {
    kind: "feature",
    icon: ListTree,
    hint: "Thả lên thẻ Epic (không thả trống canvas)",
  },
  { kind: "userStory", icon: BookOpen, hint: "Thuộc một Feature" },
];

type RequirementsPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RequirementsPalette({
  open,
  onOpenChange,
}: RequirementsPaletteProps) {
  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-border/80 bg-card/40 transition-[width] duration-200 ease-out",
        open ? "w-56" : "w-11"
      )}
      aria-label="Palette thành phần"
      aria-expanded={open}
    >
      <div className={REQUIREMENTS_WORKSPACE_TOOLBAR_CLASS}>
        {open ? (
          <>
            <h2 className="min-w-0 truncate text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Thêm mới
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="ml-auto shrink-0"
              title="Đóng palette"
              aria-label="Đóng palette thêm mới"
              onClick={() => onOpenChange(false)}
            >
              <PanelLeftClose className="size-4" aria-hidden />
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="mx-auto shrink-0"
            title="Mở palette thêm mới"
            aria-label="Mở palette thêm mới"
            onClick={() => onOpenChange(true)}
          >
            <PanelLeft className="size-4" aria-hidden />
          </Button>
        )}
      </div>

      {open ? (
        <>
          <p className="shrink-0 px-3 pb-2 pt-2 text-[11px] leading-snug text-muted-foreground">
            Epic, Feature, User Story — actor cố định theo trang
          </p>
          <ul className="flex flex-1 flex-col gap-2 overflow-y-auto p-3 pt-0">
            {PALETTE_ITEMS.map(({ kind, icon: Icon, hint }) => {
              const styles = REQUIREMENT_KIND_STYLES[kind];
              return (
                <li key={kind}>
                  <button
                    type="button"
                    draggable
                    onDragStart={(e) => {
                      const payload: PaletteDragPayload = { kind };
                      e.dataTransfer.setData(
                        REQUIREMENTS_PALETTE_DRAG_MIME,
                        JSON.stringify(payload)
                      );
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    className={cn(
                      "flex w-full cursor-grab flex-col gap-1 rounded-xl border border-border/70 bg-linear-to-br px-3 py-2.5 text-left shadow-sm transition hover:border-border active:cursor-grabbing",
                      styles.palette
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex size-7 items-center justify-center rounded-lg border",
                          styles.paletteIconBorder,
                          styles.paletteIconBg
                        )}
                      >
                        <Icon className="size-4 text-foreground" aria-hidden />
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {REQUIREMENT_KIND_LABELS[kind]}
                      </span>
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {hint}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </aside>
  );
}
