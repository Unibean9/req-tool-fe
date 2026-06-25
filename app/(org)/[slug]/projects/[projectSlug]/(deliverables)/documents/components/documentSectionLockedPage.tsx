"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { DOCUMENT_TYPE_SHORT } from "@/lib/document/documentItemIcons";
import type { DocumentType } from "@/lib/api/services/fetchDocument";

type DocumentSectionLockedPageProps = {
  orgSlug: string;
  projectSlug: string;
  documentType: DocumentType;
  sectionLabel: string;
  prerequisiteLabel: string;
  prerequisiteHref: string;
};

export function DocumentSectionLockedPage({
  documentType,
  sectionLabel,
  prerequisiteLabel,
  prerequisiteHref,
}: DocumentSectionLockedPageProps) {
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
          {DOCUMENT_TYPE_SHORT[documentType]} · Locked section
        </p>
        <h1 className="text-balance font-heading text-lg font-semibold text-foreground">
          {sectionLabel}
        </h1>
        <p className="text-pretty text-sm leading-6 text-muted-foreground">
          Hoàn thành phần{" "}
          <span className="font-medium text-foreground">{prerequisiteLabel}</span>{" "}
          (chấp nhận nội dung) trước khi mở phần này.
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
