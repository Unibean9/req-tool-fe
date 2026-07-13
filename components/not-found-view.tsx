"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";

import { NotFound404Text } from "@/components/ui/404notFoundText";
import { Button, buttonVariants } from "@/components/ui/button";
import Noise from "@/components/ui/noise";
import { cn } from "@/lib/utils";

export function NotFoundView({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div
      className={cn(
        "relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-background px-4 py-16 sm:px-8",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <Noise patternAlpha={14} patternRefreshInterval={3} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_40%,rgba(176,228,204,0.14),transparent_72%)]" />
      </div>

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-10 sm:gap-12">
        <NotFound404Text
          size="lg"
          subtitle="This page could not be found"
          className="w-full"
        />

        <div className="flex w-full max-w-md flex-col gap-3 sm:max-w-lg sm:flex-row sm:justify-center">
          <Link
            href="/"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-12 w-full gap-2 px-8 font-semibold shadow-md shadow-primary/25 sm:w-auto"
            )}
          >
            <Home className="size-4" aria-hidden />
            Back to home
          </Link>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className={cn(
              "h-12 w-full gap-2 border-2 px-8 font-semibold sm:w-auto",
              "border-brand-mint/40 hover:border-brand-mint/60 hover:bg-brand-mint/10"
            )}
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
}
