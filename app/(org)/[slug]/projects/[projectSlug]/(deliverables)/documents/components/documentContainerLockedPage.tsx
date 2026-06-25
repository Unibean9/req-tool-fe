"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { DOCUMENT_TYPE_SHORT } from "@/lib/document/documentItemIcons";
import type { DocumentType } from "@/lib/api/services/fetchDocument";

type DocumentContainerLockedPageProps = {
  orgSlug: string;
  projectSlug: string;
  documentType: DocumentType;
  prerequisiteLabel: string;
  prerequisiteHref: string;
};

export function DocumentContainerLockedPage({
  documentType,
  prerequisiteLabel,
  prerequisiteHref,
}: DocumentContainerLockedPageProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div
        className="flex size-12 items-center justify-center rounded-xl border border-border/60 bg-muted/30 text-muted-foreground"
        aria-hidden
      >
        <Lock className="size-5" />
      </div>
      <div className="max-w-md space-y-2">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {DOCUMENT_TYPE_SHORT[documentType]} · Locked
        </p>
        <h1 className="text-balance font-heading text-lg font-semibold text-foreground">
          {DOCUMENT_TYPE_SHORT[documentType]} chưa mở
        </h1>
        <p className="text-pretty text-sm leading-6 text-muted-foreground">
          Hoàn thành và chấp nhận tất cả sections của{" "}
          <span className="font-medium text-foreground">{prerequisiteLabel}</span>{" "}
          trước khi làm việc với tài liệu này.
        </p>
      </div>
      <Link
        href={prerequisiteHref}
        className={buttonVariants({ variant: "default", size: "sm" })}
      >
        Mở {prerequisiteLabel}
      </Link>
    </div>
  );
}
