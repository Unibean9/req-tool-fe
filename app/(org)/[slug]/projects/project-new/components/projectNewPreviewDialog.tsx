"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CreateOrgProjectRequest } from "@/lib/api/services/fetchProject";

const PREVIEW_ROWS: {
  key: keyof CreateOrgProjectRequest;
  label: string;
  isList?: boolean;
}[] = [
  { key: "name", label: "Tên dự án" },
  { key: "description", label: "Mô tả" },
  { key: "context", label: "Ngữ cảnh" },
  { key: "problems", label: "Vấn đề", isList: true },
  { key: "proposedSolutions", label: "Đề xuất giải pháp", isList: true },
];

function previewListItems(items: string[]): string[] {
  return items.map((s) => s.trim()).filter(Boolean);
}

export function ProjectNewPreviewDialog({
  open,
  onOpenChange,
  form,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: CreateOrgProjectRequest;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(88vh,36rem)] sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-lg">Xem trước</DialogTitle>
          <DialogDescription>
            Tóm tắt thông tin bạn đã nhập trước khi tạo dự án.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[min(60vh,24rem)] pr-3">
          <dl className="grid gap-4 text-sm">
            {PREVIEW_ROWS.map(({ key, label, isList }) => {
              const raw = form[key];
              return (
                <div key={key} className="min-w-0">
                  <dt className="font-semibold text-foreground">{label}</dt>
                  <dd className="mt-1 text-muted-foreground">
                    {isList ? (
                      (() => {
                        const items = previewListItems(
                          raw as string[]
                        );
                        if (!items.length) {
                          return <span>—</span>;
                        }
                        return (
                          <ul className="list-disc space-y-1 pl-4">
                            {items.map((item, i) => (
                              <li
                                key={`${key}-${i}`}
                                className="wrap-break-word whitespace-pre-wrap"
                              >
                                {item}
                              </li>
                            ))}
                          </ul>
                        );
                      })()
                    ) : (
                      <span className="whitespace-pre-wrap wrap-break-word">
                        {(raw as string).trim() || "—"}
                      </span>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
