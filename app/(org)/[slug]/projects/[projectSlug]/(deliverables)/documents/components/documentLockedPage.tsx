"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { DOCUMENT_TYPE_SHORT } from "@/lib/document/documentItemIcons";
import type { DocumentType } from "@/lib/api/services/fetchDocument";

type DocumentLockedPageProps = {
  orgSlug: string;
  projectSlug: string;
  documentType: DocumentType;
};

export function DocumentLockedPage({
  orgSlug,
  projectSlug,
  documentType,
}: DocumentLockedPageProps) {
  const base = `/${encodeURIComponent(orgSlug)}/projects/${encodeURIComponent(projectSlug)}`;
  const brdHref = `${base}/documents/brd`;

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div
        className="flex size-12 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground"
        aria-hidden
      >
        <Lock className="size-5" />
      </div>
      <div className="max-w-sm space-y-1">
        <h1 className="font-heading text-lg font-semibold text-foreground">
          {DOCUMENT_TYPE_SHORT[documentType]} is not available yet
        </h1>
        <p className="text-pretty text-sm text-muted-foreground">
          This document type is temporarily disabled. Continue with the Business
          Requirements Document for now.
        </p>
      </div>
      <Link href={brdHref} className={buttonVariants({ variant: "outline", size: "sm" })}>
        Open BRD
      </Link>
    </div>
  );
}
