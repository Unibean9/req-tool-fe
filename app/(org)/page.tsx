"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrgMe } from "@/hooks/useOrg";

import { OrgHomeList } from "./components/orgHomeList";
import { OrgOnboardingFlow } from "./components/orgOnboardingFlow";

export default function Home() {
  const { data: orgs, isPending, isError, error, refetch } = useOrgMe();
  const [introDone, setIntroDone] = useState(false);

  const shell = "flex min-h-0 flex-1 flex-col overflow-y-auto";

  if (isPending) {
    return (
      <div className={shell}>
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={shell}>
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-6">
          <p className="text-destructive text-sm">
            {error instanceof Error ? error.message : "Failed to load the organization list."}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const list = orgs ?? [];
  const showOnboarding = !list.length && !introDone;

  return (
    <div className={shell}>
      <AnimatePresence mode="wait">
        {showOnboarding ? (
          <OrgOnboardingFlow
            key="org-onboarding"
            onComplete={() => setIntroDone(true)}
          />
        ) : (
          <motion.div
            key="org-home"
            className="w-full flex-1"
            initial={
              list.length > 0
                ? false
                : { opacity: 0, y: 28, filter: "blur(10px)" }
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              duration: 0.5,
              delay: 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <OrgHomeList orgs={list} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
