"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startNavigationProgress } from "@/components/ui/navigation-progress";
import { useCreateOrg } from "@/hooks/useOrg";

import { clampOrgName, ORG_NAME_MAX_CHARS } from "./orgFormLimits";
import { replaceOrgSlugInPathname } from "./orgWorkspacePaths";

type CreateOrgDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateOrgDialog({ open, onOpenChange }: CreateOrgDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [name, setName] = useState("");

  const createOrg = useCreateOrg({
    onSuccess: (res) => {
      const target = replaceOrgSlugInPathname(pathname ?? "", res.data.slug);
      setName("");
      onOpenChange(false);
      startNavigationProgress();
      router.push(target);
    },
  });

  const handleDialogOpenChange = (next: boolean) => {
    if (next) setName("");
    onOpenChange(next);
  };

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0 && !createOrg.isPending;

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo tổ chức</DialogTitle>
          <DialogDescription>
            Nhập tên hiển thị. Bạn có thể đổi sau trong cài đặt tổ chức (khi có).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor="create-org-name">Tên tổ chức</Label>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {name.length} / {ORG_NAME_MAX_CHARS}
            </span>
          </div>
          <Input
            id="create-org-name"
            autoComplete="organization"
            placeholder="Ví dụ: Nhóm sản phẩm A"
            value={name}
            maxLength={ORG_NAME_MAX_CHARS}
            disabled={createOrg.isPending}
            onChange={(e) => setName(clampOrgName(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSubmit) {
                e.preventDefault();
                createOrg.mutate({ name: trimmed });
              }
            }}
          />
        </div>
        <DialogFooter showCloseButton={false} className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={createOrg.isPending}
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            type="button"
            disabled={!canSubmit}
            onClick={() => createOrg.mutate({ name: trimmed })}
          >
            {createOrg.isPending ? "Đang tạo…" : "Tạo tổ chức"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
