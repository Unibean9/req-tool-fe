import type { ReactNode } from "react";

export function LoginCard({ children }: { children?: ReactNode }) {
  return (
    <section className="w-full max-w-md space-y-8" aria-labelledby="login-heading">
      <header className="space-y-2">
        <h1
          id="login-heading"
          className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-[2rem]"
        >
          Welcome back
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          Sign in to continue managing your software requirements.
        </p>
      </header>

      <div className="space-y-6">
        {children}

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-[11px] font-medium tracking-wide text-muted-foreground">
            <span className="h-px flex-1 bg-border/85" aria-hidden />
            <span>Secure OAuth</span>
            <span className="h-px flex-1 bg-border/85" aria-hidden />
          </div>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            We never store your password. GitHub is only used to verify your
            identity.
          </p>
        </div>
      </div>
    </section>
  );
}
