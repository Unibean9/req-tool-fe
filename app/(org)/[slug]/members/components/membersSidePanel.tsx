"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  Plus,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  flattenOrgMembersInfinitePages,
  flattenUserSearchInfinitePages,
  useAddOrgMember,
  useOrgMembersScrollInfinity,
  useRemoveOrgMember,
  useUserSearchInfiniteScroll,
} from "@/hooks/useUser";
import { cn } from "@/lib/utils";

import type { OrgMember, UserSearchUser } from "@/lib/api/services/fetchUser";

import { useOrgWorkspace } from "../../orgWorkspaceContext";

import {
  orgMemberRowLabels,
  shortMemberUserId,
} from "./membersFlowGraph";

const PANEL_MOTION_EASE = [0.22, 1, 0.36, 1] as const;

/** Khung viền — hai cột dùng chung để đồng bộ. */
const ADD_MEMBER_PANEL_FRAME_CLASS =
  "overflow-hidden rounded-lg border border-border/70";

/** Vùng cuộn cố định chiều cao; nội dung dài scroll trong khung. */
const ADD_MEMBER_PANEL_SCROLL_CLASS =
  "h-[min(48vh,17.5rem)] overflow-y-auto overscroll-contain p-1.5";

const ADD_MEMBER_DIALOG_COLUMN_CLASS =
  "flex min-w-0 flex-col gap-3";

function memberRowInitials(
  displayName: string,
  email: string | null,
  userId: string
): string {
  const d = displayName.trim();
  if (d.startsWith("@") && d.length >= 2) {
    return d.slice(1, 3).toUpperCase();
  }
  const parts = d.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${(parts[0]![0] ?? "")}${(parts[parts.length - 1]![0] ?? "")}`.toUpperCase();
  }
  if (d.length >= 2) return d.slice(0, 2).toUpperCase();
  const local = (email ?? "").split("@")[0]?.trim();
  if (local && local.length >= 2) return local.slice(0, 2).toUpperCase();
  if (local) return local[0]!.toUpperCase();
  return userId.replace(/-/g, "").slice(0, 2).toUpperCase() || "?";
}

function memberMatchesNameOrEmail(
  member: OrgMember,
  q: string,
  orgHasNoOwner: boolean
): boolean {
  if (!q) return true;
  const n = q.toLowerCase();
  const labels = orgMemberRowLabels(member, { orgHasNoOwner });
  const name = labels.displayName.toLowerCase();
  const email = (labels.email ?? "").toLowerCase();
  return name.includes(n) || email.includes(n);
}

function ownerRowMatchesQuery(
  ownerMember: OrgMember | undefined,
  ownerId: string,
  q: string
): boolean {
  if (!q) return true;
  const n = q.toLowerCase();
  if (ownerMember) return memberMatchesNameOrEmail(ownerMember, q, false);
  return (
    ownerId.toLowerCase().includes(n) ||
    shortMemberUserId(ownerId).toLowerCase().includes(n)
  );
}

function MembershipRow({
  member,
  accent,
  syntheticLeader,
  fallbackUserId,
  orgHasNoOwner,
  showRemove,
  onRequestRemove,
  removeDisabled,
}: {
  member: OrgMember | null;
  accent: "leader" | "member";
  syntheticLeader?: boolean;
  fallbackUserId?: string;
  orgHasNoOwner?: boolean;
  showRemove?: boolean;
  onRequestRemove?: () => void;
  removeDisabled?: boolean;
}) {
  const labels = syntheticLeader
    ? orgMemberRowLabels(null, {
        syntheticLeader: true,
        fallbackUserId: fallbackUserId ?? member?.userId ?? "",
      })
    : member
      ? orgMemberRowLabels(member, { orgHasNoOwner: orgHasNoOwner ?? false })
      : orgMemberRowLabels(null, {
          fallbackUserId: fallbackUserId ?? "",
        });

  const initials = memberRowInitials(
    labels.displayName,
    labels.email,
    labels.userId
  );
  const avatarAlt = labels.displayName
    ? `Ảnh đại diện — ${labels.displayName}`
    : "Ảnh đại diện";

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left",
        accent === "leader"
          ? "border-primary/30 bg-(--chart-1)/12"
          : "border-sky-500/25 bg-sky-500/8"
      )}
    >
      <Avatar
        className={cn(
          "size-9 shrink-0 border border-border/60",
          accent === "leader" ? "ring-1 ring-(--chart-1)/35" : "ring-1 ring-sky-500/25"
        )}
      >
        {labels.avatarUrl ? (
          <AvatarImage src={labels.avatarUrl} alt={avatarAlt} />
        ) : null}
        <AvatarFallback
          className={cn(
            "text-[11px] font-semibold",
            accent === "leader"
              ? "bg-(--chart-1)/30 text-foreground"
              : "bg-sky-500/20 text-sky-100"
          )}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-foreground">
          {labels.displayName}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {labels.email ?? "—"}
        </p>
        <p
          className={cn(
            "truncate text-[11px] font-medium",
            accent === "leader"
              ? "text-(--chart-1)"
              : "text-sky-300/90"
          )}
        >
          {labels.roleLabel}
        </p>
      </div>
      {showRemove && onRequestRemove ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={removeDisabled}
          className="shrink-0 text-destructive hover:bg-destructive/12 hover:text-destructive disabled:text-muted-foreground"
          aria-label="Xóa khỏi tổ chức"
          onClick={(e) => {
            e.stopPropagation();
            onRequestRemove();
          }}
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}

type OrgMembersSidePanelProps = {
  orgId: string;
  ownerId: string | null;
  className?: string;
};

/**
 * Panel: danh sách `useOrgMembersScrollInfinity` (tìm `q` server + cuộn tải thêm); dialog thêm
 * thành viên dùng `useUserSearchInfiniteScroll` + chọn user + role mặc định member.
 */
export function OrgMembersSidePanel({
  orgId,
  ownerId,
  className,
}: OrgMembersSidePanelProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [listSearch, setListSearch] = useState("");
  const [removeTarget, setRemoveTarget] = useState<{
    userId: string;
    label: string;
  } | null>(null);

  const { canManageOrgMembers, selfUserId } = useOrgWorkspace();

  const { mutateAsync: removeMemberAsync, isPending: removePending } =
    useRemoveOrgMember();

  const orgMembersInfinite = useOrgMembersScrollInfinity(orgId, {
    q: listSearch,
  });

  const members = useMemo(
    () => flattenOrgMembersInfinitePages(orgMembersInfinite.data?.pages),
    [orgMembersInfinite.data?.pages]
  );

  const membersLoadingFirst =
    orgMembersInfinite.isPending ||
    (orgMembersInfinite.isFetching && members.length === 0);

  const queryNorm = listSearch.trim().toLowerCase();

  const hasOrgOwner = ownerId != null && ownerId.length > 0;
  const ownerMember = hasOrgOwner
    ? members.find((m) => m.userId === ownerId)
    : undefined;
  const memberList: OrgMember[] = useMemo(() => {
    if (!hasOrgOwner) return members;
    return members.filter((m) => m.userId !== ownerId);
  }, [hasOrgOwner, members, ownerId]);

  const memberListFiltered = memberList;

  const showOwnerSection =
    hasOrgOwner &&
    (!queryNorm ||
      ownerRowMatchesQuery(ownerMember, ownerId!, queryNorm));

  const openRemoveConfirm = (m: OrgMember) => {
    const label = orgMemberRowLabels(m, {
      orgHasNoOwner: !hasOrgOwner,
    }).displayName;
    setRemoveTarget({ userId: m.userId, label });
  };

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        {panelOpen ? (
          <motion.div
            key="members-side-panel-open"
            role="presentation"
            initial={{ x: -28, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -36, opacity: 0 }}
            transition={{
              duration: 0.24,
              ease: PANEL_MOTION_EASE,
            }}
            className={cn(
              "pointer-events-auto absolute inset-y-0 left-0 z-40 flex h-full min-h-0 w-72 max-w-[min(18rem,calc(100%-0.5rem))] will-change-transform",
              className
            )}
          >
            <Card
              size="sm"
              className="flex h-full min-h-0 w-full flex-col gap-0 overflow-hidden rounded-l-none rounded-r-xl border border-border/90 border-l-0 bg-card/95 shadow-xl backdrop-blur-md"
            >
              <CardHeader className="shrink-0 space-y-2 border-b border-border/60 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold">
                    <Users className="size-4 shrink-0 text-primary" aria-hidden />
                    Danh sách
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="Đóng danh sách thành viên"
                    onClick={() => setPanelOpen(false)}
                  >
                    <X className="size-4" aria-hidden />
                  </Button>
                </div>
                <CardDescription className="text-xs">
                  Nhóm trưởng và thành viên trong tổ chức.
                </CardDescription>
              </CardHeader>

              <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden pt-3 pb-3">
          <div className="relative shrink-0">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              placeholder="Tìm theo tên hoặc email…"
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              className="h-9 border-border/80 pr-3 pl-9 text-xs"
              autoComplete="off"
            />
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1"
            onScroll={orgMembersInfinite.onScrollToLoadMore}
          >
            <div className="flex flex-col gap-4 pb-1">
              {membersLoadingFirst ? (
                <p className="text-xs text-muted-foreground">
                  Đang tải danh sách…
                </p>
              ) : (
                <>
                  {showOwnerSection ? (
                    <section className="space-y-2">
                      <h3 className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-(--chart-1) uppercase">
                        <UserRound className="size-3.5" aria-hidden />
                        Nhóm trưởng
                      </h3>
                      <div className="space-y-1.5">
                        {ownerMember ? (
                          <MembershipRow
                            member={ownerMember}
                            accent="leader"
                            showRemove={
                              canManageOrgMembers &&
                              ownerMember.userId !== selfUserId
                            }
                            onRequestRemove={() =>
                              openRemoveConfirm(ownerMember)
                            }
                            removeDisabled={removePending}
                          />
                        ) : (
                          <MembershipRow
                            member={null}
                            syntheticLeader
                            fallbackUserId={ownerId}
                            accent="leader"
                          />
                        )}
                      </div>
                    </section>
                  ) : null}

                  <section className="space-y-2">
                    <h3 className="text-[11px] font-semibold tracking-wide text-sky-300/90 uppercase">
                      Thành viên
                    </h3>
                    {memberListFiltered.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {queryNorm
                          ? "Không có thành viên khớp tìm kiếm."
                          : hasOrgOwner
                            ? "Chưa có thành viên nào khác."
                            : "Chưa có thành viên."}
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {memberListFiltered.map((m) => (
                          <MembershipRow
                            key={m.id}
                            member={m}
                            accent="member"
                            orgHasNoOwner={!hasOrgOwner}
                            showRemove={
                              canManageOrgMembers &&
                              m.userId !== selfUserId
                            }
                            onRequestRemove={() => openRemoveConfirm(m)}
                            removeDisabled={removePending}
                          />
                        ))}
                      </div>
                    )}
                    {orgMembersInfinite.isFetchingNextPage ? (
                      <p className="text-center text-[11px] text-muted-foreground">
                        Đang tải thêm…
                      </p>
                    ) : null}
                  </section>
                </>
              )}
            </div>
          </div>

          {canManageOrgMembers ? (
            <Button
              type="button"
              size="sm"
              className="w-full shrink-0 font-semibold"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="size-4" aria-hidden />
              Thêm thành viên
            </Button>
          ) : null}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="members-side-panel-peek"
            role="presentation"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -16, opacity: 0 }}
            transition={{
              duration: 0.2,
              ease: PANEL_MOTION_EASE,
            }}
            className={cn(
              "pointer-events-auto absolute top-1/2 left-0 z-40 -translate-y-1/2 will-change-transform",
              className
            )}
          >
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-11 w-10 rounded-l-none rounded-r-lg border border-border/90 border-l-0 bg-card/95 shadow-lg backdrop-blur-md"
              aria-label="Mở danh sách thành viên"
              onClick={() => setPanelOpen(true)}
            >
              <ChevronRight className="size-5" aria-hidden />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {canManageOrgMembers ? (
        <AddOrgMemberDialog
          orgId={orgId}
          open={addOpen}
          onOpenChange={setAddOpen}
        />
      ) : null}

      <AlertDialog
        open={removeTarget != null}
        onOpenChange={(next) => {
          if (!next) setRemoveTarget(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa khỏi tổ chức?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget ? (
                <>
                  Người dùng{" "}
                  <span className="font-medium text-foreground">
                    «{removeTarget.label}»
                  </span>{" "}
                  sẽ bị gỡ khỏi tổ chức. Bạn có thể mời lại sau nếu cần.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removePending}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={removePending || !removeTarget}
              onClick={() => {
                if (!removeTarget) return;
                void (async () => {
                  try {
                    await removeMemberAsync({
                      orgId,
                      userId: removeTarget.userId,
                    });
                    setRemoveTarget(null);
                  } catch {
                    /* toast lỗi từ hook */
                  }
                })();
              }}
            >
              {removePending ? "Đang xóa…" : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function AddOrgMemberDialog({
  orgId,
  open,
  onOpenChange,
}: {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [searchDraft, setSearchDraft] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pendingMembers, setPendingMembers] = useState<UserSearchUser[]>([]);

  useEffect(() => {
    const t = window.setTimeout(
      () => setDebouncedSearch(searchDraft.trim()),
      320
    );
    return () => window.clearTimeout(t);
  }, [searchDraft]);

  const handleDialogOpenChange = (next: boolean) => {
    setSearchDraft("");
    setDebouncedSearch("");
    setPendingMembers([]);
    onOpenChange(next);
  };

  const userSearchInfinite = useUserSearchInfiniteScroll(debouncedSearch, {
    enabled: open && debouncedSearch.length > 0,
  });

  const searchHits = useMemo(
    () => flattenUserSearchInfinitePages(userSearchInfinite.data?.pages),
    [userSearchInfinite.data?.pages]
  );

  const pendingIds = useMemo(
    () => new Set(pendingMembers.map((p) => p.id)),
    [pendingMembers]
  );

  const { mutate, isPending } = useAddOrgMember({
    onSuccess: () => {
      handleDialogOpenChange(false);
    },
  });

  const hasQuery = debouncedSearch.length > 0;
  const canSubmit = pendingMembers.length > 0 && !isPending;
  const searchLoadingFirst =
    hasQuery &&
    (userSearchInfinite.isPending ||
      (userSearchInfinite.isFetching && searchHits.length === 0));

  const toggleFromSearchHit = (u: UserSearchUser) => {
    if (pendingIds.has(u.id)) {
      removePending(u.id);
      return;
    }
    setPendingMembers((prev) => [...prev, u]);
  };

  const removePending = (userId: string) => {
    setPendingMembers((prev) => prev.filter((p) => p.id !== userId));
  };

  const submitMembers = () => {
    if (!canSubmit) return;
    mutate({
      orgId,
      body: {
        members: pendingMembers.map((u) => ({
          identifier: (u.email?.trim() || u.id.trim()) || u.id,
          role: "member",
        })),
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className="max-h-[min(92vh,44rem)] w-[min(100vw-2rem,52rem)] max-w-none overflow-hidden sm:max-w-[min(100vw-2rem,52rem)]"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="text-lg">Thêm thành viên</DialogTitle>
          <DialogDescription>
            Tìm theo tên hoặc email để thêm vào danh sách mời
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-w-0 grid-cols-1 gap-4 px-1 sm:grid-cols-2 sm:items-start sm:gap-0">
          <div
            className={cn(
              ADD_MEMBER_DIALOG_COLUMN_CLASS,
              "sm:border-r sm:border-border/70 sm:pr-4"
            )}
          >
            <div className="relative shrink-0">
              <Label htmlFor="add-member-search" className="sr-only">
                Tìm người dùng
              </Label>
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="add-member-search"
                type="search"
                autoComplete="off"
                placeholder="Nhập tên hoặc email…"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                disabled={isPending}
                className="h-11 border-2 border-border/90 pr-3 pl-10 dark:border-zinc-600"
              />
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Kết quả
              </p>
              <div className={cn(ADD_MEMBER_PANEL_FRAME_CLASS, "bg-muted/15")}>
                <div
                  className={ADD_MEMBER_PANEL_SCROLL_CLASS}
                  onScroll={userSearchInfinite.onScrollToLoadMore}
                >
                {!hasQuery ? (
                  <p className="px-2 py-8 text-center text-xs text-muted-foreground">
                    Nhập để tìm kiếm.
                  </p>
              ) : searchLoadingFirst ? (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                  Đang tìm…
                </p>
              ) : searchHits.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                  Không có người dùng khớp.
                </p>
              ) : (
                <ul className="space-y-1">
                  {searchHits.map((u) => {
                    const inList = pendingIds.has(u.id);
                    return (
                      <li key={u.id}>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => toggleFromSearchHit(u)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-md border px-3 py-2 text-left text-xs transition-colors",
                            inList
                              ? "border-primary/35 bg-primary/10 hover:border-destructive/40 hover:bg-destructive/8"
                              : "border-transparent bg-card/80 hover:border-primary/40 hover:bg-primary/8"
                          )}
                        >
                          <Avatar className="size-9 shrink-0 border border-border/60">
                            {u.githubAvatarUrl ? (
                              <AvatarImage
                                src={u.githubAvatarUrl}
                                alt={
                                  u.fullName
                                    ? `Ảnh GitHub — ${u.fullName}`
                                    : "Ảnh GitHub"
                                }
                              />
                            ) : null}
                            <AvatarFallback className="text-[11px] font-semibold">
                              {memberRowInitials(
                                u.fullName,
                                u.email,
                                u.id
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-foreground">
                              {u.fullName}
                            </span>
                            <span className="block truncate text-[11px] text-muted-foreground">
                              {u.email}
                            </span>
                            {u.githubLogin ? (
                              <span className="block truncate text-[11px] text-muted-foreground/80">
                                @{u.githubLogin}
                              </span>
                            ) : null}
                          </div>
                          {inList ? (
                            <span className="shrink-0 text-[10px] font-medium text-primary">
                              Đang mời
                            </span>
                          ) : (
                            <Plus
                              className="size-4 shrink-0 text-muted-foreground"
                              aria-hidden
                            />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {userSearchInfinite.isFetchingNextPage ? (
                <p className="py-2 text-center text-[11px] text-muted-foreground">
                  Đang tải thêm…
                </p>
              ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className={cn(ADD_MEMBER_DIALOG_COLUMN_CLASS, "sm:pl-4")}>
            <div className="flex h-11 shrink-0 items-center rounded-lg border border-border/60 bg-muted/25 px-3 text-sm">
              <p className="truncate text-muted-foreground">
                <span className="font-medium text-foreground">Vai trò:</span>{" "}
                Thành viên mặc định.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Danh sách mời ({pendingMembers.length})
              </p>
              <div className={cn(ADD_MEMBER_PANEL_FRAME_CLASS, "bg-muted/20")}>
                <div className={ADD_MEMBER_PANEL_SCROLL_CLASS}>
                {pendingMembers.length === 0 ? (
                  <p className="px-2 py-8 text-center text-xs text-muted-foreground italic">
                    Chưa có ai.
                  </p>
              ) : (
                <ul className="space-y-1">
                  {pendingMembers.map((u) => (
                    <li
                      key={u.id}
                      className="flex items-center gap-2 rounded-md border border-border/50 bg-card/80 px-2 py-1.5"
                    >
                      <Avatar className="size-8 shrink-0 border border-border/60">
                        {u.githubAvatarUrl ? (
                          <AvatarImage
                            src={u.githubAvatarUrl}
                            alt={
                              u.fullName
                                ? `Ảnh GitHub — ${u.fullName}`
                                : "Ảnh GitHub"
                            }
                          />
                        ) : null}
                        <AvatarFallback className="text-[10px] font-semibold">
                          {memberRowInitials(u.fullName, u.email, u.id)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground">
                          {u.fullName}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {u.email}
                        </p>
                        {u.githubLogin ? (
                          <p className="truncate text-[10px] text-muted-foreground/80">
                            @{u.githubLogin}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                        disabled={isPending}
                        aria-label={`Gỡ ${u.fullName} khỏi danh sách mời`}
                        onClick={() => removePending(u.id)}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-1 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleDialogOpenChange(false)}
            disabled={isPending}
          >
            Hủy
          </Button>
          <Button
            type="button"
            className="font-semibold"
            disabled={!canSubmit}
            onClick={submitMembers}
          >
            {isPending
              ? "Đang thêm…"
              : pendingMembers.length > 1
                ? `Thêm ${pendingMembers.length} thành viên`
                : "Thêm thành viên"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
