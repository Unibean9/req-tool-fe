import type { ReactNode } from "react";

export function LoginCard({ children }: { children?: ReactNode }) {
  return (
    <section className="w-full max-w-md space-y-8" aria-labelledby="login-heading">
      <header className="space-y-2">
        <h1
          id="login-heading"
          className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-[2rem]"
        >
          Chào mừng trở lại
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          Đăng nhập để tiếp tục quản lý yêu cầu phần mềm của bạn.
        </p>
      </header>

      <div className="space-y-6">
        {children}

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-[11px] font-medium tracking-wide text-muted-foreground">
            <span className="h-px flex-1 bg-border/85" aria-hidden />
            <span>OAuth bảo mật</span>
            <span className="h-px flex-1 bg-border/85" aria-hidden />
          </div>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Không lưu mật khẩu. Chúng tôi chỉ dùng GitHub để xác thực danh tính.
          </p>
        </div>
      </div>
    </section>
  );
}
