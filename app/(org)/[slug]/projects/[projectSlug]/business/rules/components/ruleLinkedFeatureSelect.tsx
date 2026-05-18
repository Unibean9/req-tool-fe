"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  flattenProjectFeaturesInfinitePages,
  useProjectFeature,
  useProjectFeaturesInfinityScroll,
} from "@/hooks/useFeature";
import type { ActorFeature } from "@/lib/api/services/fetchActor";
import { cn } from "@/lib/utils";

export function formatFeaturePrefixTitle(feature: {
  prefix: string;
  title: string;
}): string {
  const prefix = feature.prefix.trim();
  const title = feature.title.trim() || "—";
  return prefix ? `${prefix}-${title}` : title;
}

function featureSearchHaystack(feature: ActorFeature): string {
  return [
    feature.id,
    feature.prefix,
    feature.title,
    formatFeaturePrefixTitle(feature),
  ]
    .join(" ")
    .toLowerCase();
}

type RuleLinkedFeatureSelectProps = {
  projectId: string;
  value: string;
  onChange: (linkedFeatureId: string) => void;
  disabled?: boolean;
  id?: string;
};

export function RuleLinkedFeatureSelect({
  projectId,
  value,
  onChange,
  disabled = false,
  id = "rule-linked-feature",
}: RuleLinkedFeatureSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const linkedId = value.trim();

  const featuresQuery = useProjectFeaturesInfinityScroll(projectId, undefined, {
    enabled: open || Boolean(linkedId),
  });

  const allFeatures = useMemo(
    () => flattenProjectFeaturesInfinitePages(featuresQuery.data?.pages),
    [featuresQuery.data?.pages]
  );

  const selectedInList = useMemo(
    () => allFeatures.find((f) => f.id === linkedId),
    [allFeatures, linkedId]
  );

  const { data: selectedFeature, isPending: selectedLoading } = useProjectFeature(
    projectId,
    linkedId,
    { enabled: Boolean(linkedId) && !selectedInList }
  );

  const displayLabel = useMemo(() => {
    if (!linkedId) return null;
    if (selectedInList) return formatFeaturePrefixTitle(selectedInList);
    if (selectedFeature) return formatFeaturePrefixTitle(selectedFeature);
    return null;
  }, [linkedId, selectedInList, selectedFeature]);

  const filteredFeatures = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allFeatures;
    return allFeatures.filter((f) => featureSearchHaystack(f).includes(q));
  }, [allFeatures, search]);

  const isLoadingFirst =
    featuresQuery.isPending && allFeatures.length === 0;
  const isLoadingMore = featuresQuery.isFetchingNextPage;

  function selectFeature(featureId: string) {
    onChange(featureId);
    setOpen(false);
    setSearch("");
  }

  function clearSelection() {
    onChange("");
    setOpen(false);
    setSearch("");
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Feature liên kết (tuỳ chọn)</Label>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setSearch("");
        }}
      >
        <PopoverTrigger
          id={id}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted px-3 py-2 text-left text-sm font-medium shadow-sm transition-colors",
            "hover:bg-muted/85 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/45",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !displayLabel && !linkedId && "text-muted-foreground"
          )}
        >
          <span className="min-w-0 flex-1 truncate">
            {linkedId && selectedLoading && !displayLabel ? (
              "Đang tải feature…"
            ) : displayLabel ? (
              displayLabel
            ) : linkedId ? (
              <span className="font-mono text-xs">{linkedId}</span>
            ) : (
              "Tìm và chọn feature…"
            )}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-[var(--anchor-width)] min-w-[min(100vw-2rem,24rem)] gap-0 p-0"
        >
          <div className="border-b border-border/70 p-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                autoComplete="off"
                placeholder="Tìm theo prefix-title…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 border-border/80 bg-muted/30 pl-8 text-sm"
              />
            </div>
          </div>

          <div
            className="max-h-56 overflow-y-auto overscroll-y-contain p-1"
            onScroll={featuresQuery.onScrollToLoadMore}
          >
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-accent",
                !linkedId && "bg-accent/60"
              )}
              onClick={clearSelection}
            >
              <span className="min-w-0 flex-1 text-muted-foreground">
                Không liên kết
              </span>
              {!linkedId ? (
                <Check className="size-4 shrink-0 text-primary" aria-hidden />
              ) : null}
            </button>

            {isLoadingFirst ? (
              <div className="space-y-1 p-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full rounded-md" />
                ))}
              </div>
            ) : filteredFeatures.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                {search.trim()
                  ? "Không có feature khớp."
                  : "Chưa có feature trong dự án."}
              </p>
            ) : (
              <ul className="space-y-0.5">
                {filteredFeatures.map((feature) => {
                  const label = formatFeaturePrefixTitle(feature);
                  const selected = feature.id === linkedId;
                  return (
                    <li key={feature.id}>
                      <button
                        type="button"
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-accent",
                          selected && "bg-accent/60"
                        )}
                        onClick={() => selectFeature(feature.id)}
                      >
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {label}
                        </span>
                        {selected ? (
                          <Check
                            className="size-4 shrink-0 text-primary"
                            aria-hidden
                          />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {isLoadingMore ? (
              <p className="px-2 py-2 text-center text-[11px] text-muted-foreground">
                Đang tải thêm…
              </p>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>

      {!linkedId ? (
        <p className="text-xs text-muted-foreground">
          Cuộn danh sách để tải thêm feature.
        </p>
      ) : null}
    </div>
  );
}
