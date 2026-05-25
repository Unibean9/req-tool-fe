"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
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

import { formatFeaturePrefixTitle } from "../../business/rules/components/ruleLinkedFeatureSelect";

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

type NfrLinkedFeaturesSelectProps = {
  projectId: string;
  value: string[];
  onChange: (featureIds: string[]) => void;
  disabled?: boolean;
  id?: string;
};

function SelectedFeatureChip({
  projectId,
  featureId,
  disabled,
  onRemove,
}: {
  projectId: string;
  featureId: string;
  disabled?: boolean;
  onRemove: () => void;
}) {
  const { data: feature, isPending } = useProjectFeature(projectId, featureId);

  const label = feature
    ? formatFeaturePrefixTitle(feature)
    : isPending
      ? "Loading…"
      : featureId.slice(0, 8);

  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-md border border-border/80 bg-muted/50 py-0.5 pr-1 pl-2 text-xs">
      <span className="min-w-0 truncate font-medium text-foreground">{label}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-5 shrink-0 text-muted-foreground hover:text-foreground"
        disabled={disabled}
        aria-label={`Remove feature ${label}`}
        onClick={onRemove}
      >
        <X className="size-3" aria-hidden />
      </Button>
    </span>
  );
}

export function NfrLinkedFeaturesSelect({
  projectId,
  value,
  onChange,
  disabled = false,
  id = "nfr-linked-features",
}: NfrLinkedFeaturesSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedIds = useMemo(
    () => value.map((id) => id.trim()).filter(Boolean),
    [value]
  );
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const featuresQuery = useProjectFeaturesInfinityScroll(projectId, undefined, {
    enabled: open || selectedIds.length > 0,
  });

  const allFeatures = useMemo(
    () => flattenProjectFeaturesInfinitePages(featuresQuery.data?.pages),
    [featuresQuery.data?.pages]
  );

  const filteredFeatures = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allFeatures;
    return allFeatures.filter((f) => featureSearchHaystack(f).includes(q));
  }, [allFeatures, search]);

  const isLoadingFirst =
    featuresQuery.isPending && allFeatures.length === 0;
  const isLoadingMore = featuresQuery.isFetchingNextPage;

  function toggleFeature(featureId: string) {
    if (selectedSet.has(featureId)) {
      onChange(selectedIds.filter((id) => id !== featureId));
      return;
    }
    onChange([...selectedIds, featureId]);
  }

  function removeFeature(featureId: string) {
    onChange(selectedIds.filter((id) => id !== featureId));
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Linked features (optional)</Label>
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
            selectedIds.length === 0 && "text-muted-foreground"
          )}
        >
          <span className="min-w-0 flex-1 truncate">
            {selectedIds.length === 0
              ? "Search and select features…"
              : `${selectedIds.length} feature(s) selected`}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-(--anchor-width) min-w-[min(100vw-2rem,24rem)] gap-0 p-0"
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
                placeholder="Search by prefix-title…"
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
            {isLoadingFirst ? (
              <div className="space-y-1 p-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full rounded-md" />
                ))}
              </div>
            ) : filteredFeatures.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                {search.trim()
                  ? "No matching features."
                  : "No features in this project yet."}
              </p>
            ) : (
              <ul className="space-y-0.5">
                {filteredFeatures.map((feature) => {
                  const label = formatFeaturePrefixTitle(feature);
                  const selected = selectedSet.has(feature.id);
                  return (
                    <li key={feature.id}>
                      <button
                        type="button"
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-accent",
                          selected && "bg-accent/60"
                        )}
                        onClick={() => toggleFeature(feature.id)}
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

      {selectedIds.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedIds.map((featureId) => (
            <SelectedFeatureChip
              key={featureId}
              projectId={projectId}
              featureId={featureId}
              disabled={disabled}
              onRemove={() => removeFeature(featureId)}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          You can select multiple features. Scroll to load more.
        </p>
      )}
    </div>
  );
}
