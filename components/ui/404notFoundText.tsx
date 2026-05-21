"use client";

import React, { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const NOT_FOUND_GRADIENT = ["#b0e4cc", "#5aac8f", "#408a71"] as const;

export type FuzzyTextProps = {
  children: ReactNode;
  fontSize?: number | string;
  fontWeight?: string | number;
  fontFamily?: string;
  color?: string;
  enableHover?: boolean;
  baseIntensity?: number;
  hoverIntensity?: number;
  fuzzRange?: number;
  fps?: number;
  direction?: "horizontal" | "vertical" | "both";
  transitionDuration?: number;
  clickEffect?: boolean;
  glitchMode?: boolean;
  glitchInterval?: number;
  glitchDuration?: number;
  gradient?: string[] | null;
  letterSpacing?: number;
  className?: string;
};

type FuzzyCanvas = HTMLCanvasElement & { cleanupFuzzyText?: () => void };

export function FuzzyText({
  children,
  fontSize = "clamp(2rem, 8vw, 8rem)",
  fontWeight = 900,
  fontFamily = "inherit",
  color = "#fff",
  enableHover = true,
  baseIntensity = 0.18,
  hoverIntensity = 0.5,
  fuzzRange = 30,
  fps = 60,
  direction = "horizontal",
  transitionDuration = 0,
  clickEffect = false,
  glitchMode = false,
  glitchInterval = 2000,
  glitchDuration = 200,
  gradient = null,
  letterSpacing = 0,
  className = "",
}: FuzzyTextProps) {
  const canvasRef = useRef<FuzzyCanvas>(null);

  useEffect(() => {
    let animationFrameId: number;
    let isCancelled = false;
    let glitchTimeoutId: ReturnType<typeof setTimeout>;
    let glitchEndTimeoutId: ReturnType<typeof setTimeout>;
    let clickTimeoutId: ReturnType<typeof setTimeout>;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const init = async () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const computedFontFamily =
        fontFamily === "inherit"
          ? window.getComputedStyle(canvas).fontFamily || "sans-serif"
          : fontFamily;

      const fontSizeStr = typeof fontSize === "number" ? `${fontSize}px` : fontSize;
      const fontString = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;

      try {
        await document.fonts.load(fontString);
      } catch {
        await document.fonts.ready;
      }
      if (isCancelled) return;

      let numericFontSize: number;
      if (typeof fontSize === "number") {
        numericFontSize = fontSize;
      } else {
        const temp = document.createElement("span");
        temp.style.fontSize = fontSize;
        document.body.appendChild(temp);
        const computedSize = window.getComputedStyle(temp).fontSize;
        numericFontSize = parseFloat(computedSize);
        document.body.removeChild(temp);
      }

      const text = React.Children.toArray(children).join("");

      const offscreen = document.createElement("canvas");
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return;

      offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;
      offCtx.textBaseline = "alphabetic";

      let totalWidth = 0;
      if (letterSpacing !== 0) {
        for (const char of text) {
          totalWidth += offCtx.measureText(char).width + letterSpacing;
        }
        totalWidth -= letterSpacing;
      } else {
        totalWidth = offCtx.measureText(text).width;
      }

      const metrics = offCtx.measureText(text);
      const actualLeft = metrics.actualBoundingBoxLeft ?? 0;
      const actualRight =
        letterSpacing !== 0
          ? totalWidth
          : (metrics.actualBoundingBoxRight ?? metrics.width);
      const actualAscent = metrics.actualBoundingBoxAscent ?? numericFontSize;
      const actualDescent =
        metrics.actualBoundingBoxDescent ?? numericFontSize * 0.2;

      const textBoundingWidth = Math.ceil(
        letterSpacing !== 0 ? totalWidth : actualLeft + actualRight
      );
      const tightHeight = Math.ceil(actualAscent + actualDescent);

      const extraWidthBuffer = 10;
      const offscreenWidth = textBoundingWidth + extraWidthBuffer;

      offscreen.width = offscreenWidth;
      offscreen.height = tightHeight;

      const xOffset = extraWidthBuffer / 2;
      offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;
      offCtx.textBaseline = "alphabetic";

      if (gradient && Array.isArray(gradient) && gradient.length >= 2) {
        const grad = offCtx.createLinearGradient(0, 0, offscreenWidth, 0);
        gradient.forEach((c, i) =>
          grad.addColorStop(i / (gradient.length - 1), c)
        );
        offCtx.fillStyle = grad;
      } else {
        offCtx.fillStyle = color;
      }

      if (letterSpacing !== 0) {
        let xPos = xOffset;
        for (const char of text) {
          offCtx.fillText(char, xPos, actualAscent);
          xPos += offCtx.measureText(char).width + letterSpacing;
        }
      } else {
        offCtx.fillText(text, xOffset - actualLeft, actualAscent);
      }

      const horizontalMargin = fuzzRange + 20;
      const verticalMargin =
        direction === "vertical" || direction === "both" ? fuzzRange + 10 : 0;
      canvas.width = offscreenWidth + horizontalMargin * 2;
      canvas.height = tightHeight + verticalMargin * 2;
      ctx.translate(horizontalMargin, verticalMargin);

      const interactiveLeft = horizontalMargin + xOffset;
      const interactiveTop = verticalMargin;
      const interactiveRight = interactiveLeft + textBoundingWidth;
      const interactiveBottom = interactiveTop + tightHeight;

      let isHovering = false;
      let isClicking = false;
      let isGlitching = false;
      let currentIntensity = baseIntensity;
      let targetIntensity = baseIntensity;
      let lastFrameTime = 0;
      const frameDuration = 1000 / fps;

      const startGlitchLoop = () => {
        if (!glitchMode || isCancelled) return;
        glitchTimeoutId = setTimeout(() => {
          if (isCancelled) return;
          isGlitching = true;
          glitchEndTimeoutId = setTimeout(() => {
            isGlitching = false;
            startGlitchLoop();
          }, glitchDuration);
        }, glitchInterval);
      };

      if (glitchMode) startGlitchLoop();

      const run = (timestamp: number) => {
        if (isCancelled) return;

        if (timestamp - lastFrameTime < frameDuration) {
          animationFrameId = window.requestAnimationFrame(run);
          return;
        }
        lastFrameTime = timestamp;

        ctx.clearRect(
          -fuzzRange - 20,
          -fuzzRange - 10,
          offscreenWidth + 2 * (fuzzRange + 20),
          tightHeight + 2 * (fuzzRange + 10)
        );

        if (isClicking) {
          targetIntensity = 1;
        } else if (isGlitching) {
          targetIntensity = 1;
        } else if (isHovering) {
          targetIntensity = hoverIntensity;
        } else {
          targetIntensity = baseIntensity;
        }

        if (transitionDuration > 0) {
          const step = 1 / (transitionDuration / frameDuration);
          if (currentIntensity < targetIntensity) {
            currentIntensity = Math.min(
              currentIntensity + step,
              targetIntensity
            );
          } else if (currentIntensity > targetIntensity) {
            currentIntensity = Math.max(
              currentIntensity - step,
              targetIntensity
            );
          }
        } else {
          currentIntensity = targetIntensity;
        }

        for (let j = 0; j < tightHeight; j++) {
          let dx = 0;
          let dy = 0;
          if (direction === "horizontal" || direction === "both") {
            dx = Math.floor(
              currentIntensity * (Math.random() - 0.5) * fuzzRange
            );
          }
          if (direction === "vertical" || direction === "both") {
            dy = Math.floor(
              currentIntensity * (Math.random() - 0.5) * fuzzRange * 0.5
            );
          }
          ctx.drawImage(
            offscreen,
            0,
            j,
            offscreenWidth,
            1,
            dx,
            j + dy,
            offscreenWidth,
            1
          );
        }
        animationFrameId = window.requestAnimationFrame(run);
      };

      animationFrameId = window.requestAnimationFrame(run);

      const isInsideTextArea = (x: number, y: number) =>
        x >= interactiveLeft &&
        x <= interactiveRight &&
        y >= interactiveTop &&
        y <= interactiveBottom;

      const handleMouseMove = (e: MouseEvent) => {
        if (!enableHover) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        isHovering = isInsideTextArea(x, y);
      };

      const handleMouseLeave = () => {
        isHovering = false;
      };

      const handleClick = () => {
        if (!clickEffect) return;
        isClicking = true;
        clearTimeout(clickTimeoutId);
        clickTimeoutId = setTimeout(() => {
          isClicking = false;
        }, 150);
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (!enableHover) return;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        if (!touch) return;
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        isHovering = isInsideTextArea(x, y);
      };

      const handleTouchEnd = () => {
        isHovering = false;
      };

      if (enableHover) {
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseleave", handleMouseLeave);
        canvas.addEventListener("touchmove", handleTouchMove, {
          passive: true,
        });
        canvas.addEventListener("touchend", handleTouchEnd, { passive: true });
      }

      if (clickEffect) {
        canvas.addEventListener("click", handleClick);
      }

      const cleanup = () => {
        window.cancelAnimationFrame(animationFrameId);
        clearTimeout(glitchTimeoutId);
        clearTimeout(glitchEndTimeoutId);
        clearTimeout(clickTimeoutId);
        if (enableHover) {
          canvas.removeEventListener("mousemove", handleMouseMove);
          canvas.removeEventListener("mouseleave", handleMouseLeave);
          canvas.removeEventListener("touchmove", handleTouchMove);
          canvas.removeEventListener("touchend", handleTouchEnd);
        }
        if (clickEffect) {
          canvas.removeEventListener("click", handleClick);
        }
      };

      canvas.cleanupFuzzyText = cleanup;
    };

    void init();

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(animationFrameId);
      clearTimeout(glitchTimeoutId);
      clearTimeout(glitchEndTimeoutId);
      clearTimeout(clickTimeoutId);
      canvas.cleanupFuzzyText?.();
    };
  }, [
    children,
    fontSize,
    fontWeight,
    fontFamily,
    color,
    enableHover,
    baseIntensity,
    hoverIntensity,
    fuzzRange,
    fps,
    direction,
    transitionDuration,
    clickEffect,
    glitchMode,
    glitchInterval,
    glitchDuration,
    gradient,
    letterSpacing,
  ]);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}

const NOT_FOUND_FUZZY = {
  gradient: [...NOT_FOUND_GRADIENT],
  fontWeight: 900 as const,
  fontFamily: "inherit",
  baseIntensity: 0.14,
  hoverIntensity: 0.42,
  fps: 48,
  enableHover: true,
  glitchMode: true,
  glitchInterval: 2800,
  glitchDuration: 180,
};

const NOT_FOUND_SIZE = {
  default: {
    code: "clamp(2.75rem, 10vw, 4.5rem)",
    codeFuzz: 22,
    codeSpacing: 4,
    subtitle: "clamp(0.65rem, 2.5vw, 0.8rem)",
    subtitleFuzz: 22,
    subtitleSpacing: 6,
    gap: "gap-0",
  },
  lg: {
    code: "clamp(5rem, 20vw, 9rem)",
    codeFuzz: 36,
    codeSpacing: 8,
    subtitle: "clamp(1.5rem, 5.5vw, 3rem)",
    subtitleFuzz: 36,
    subtitleSpacing: 1,
    gap: "gap-3 sm:gap-4",
  },
} as const;

export type NotFound404TextProps = {
  className?: string;
  /** Hiện dòng phụ dưới số 404 */
  showSubtitle?: boolean;
  /** Nội dung dòng phụ — mặc định "NOT FOUND" */
  subtitle?: string;
  /** `lg` cho trang 404 toàn màn */
  size?: keyof typeof NOT_FOUND_SIZE;
};

/** Chữ 404 + dòng phụ kiểu glitch/fuzzy (brand mint). */
export function NotFound404Text({
  className,
  showSubtitle = true,
  subtitle = "NOT FOUND",
  size = "default",
}: NotFound404TextProps) {
  const s = NOT_FOUND_SIZE[size];

  return (
    <div
      className={cn(
        "font-heading flex w-full flex-col items-center select-none",
        s.gap,
        className
      )}
    >
      <FuzzyText
        fontSize={s.code}
        fontWeight={NOT_FOUND_FUZZY.fontWeight}
        fontFamily={NOT_FOUND_FUZZY.fontFamily}
        letterSpacing={s.codeSpacing}
        gradient={NOT_FOUND_FUZZY.gradient}
        baseIntensity={NOT_FOUND_FUZZY.baseIntensity}
        hoverIntensity={NOT_FOUND_FUZZY.hoverIntensity}
        fuzzRange={s.codeFuzz}
        fps={NOT_FOUND_FUZZY.fps}
        enableHover={NOT_FOUND_FUZZY.enableHover}
        glitchMode={NOT_FOUND_FUZZY.glitchMode}
        glitchInterval={NOT_FOUND_FUZZY.glitchInterval}
        glitchDuration={NOT_FOUND_FUZZY.glitchDuration}
        className="max-w-full"
      >
        404
      </FuzzyText>
      {showSubtitle && subtitle ? (
        <FuzzyText
          fontSize={s.subtitle}
          fontWeight={NOT_FOUND_FUZZY.fontWeight}
          fontFamily={NOT_FOUND_FUZZY.fontFamily}
          letterSpacing={s.subtitleSpacing}
          gradient={NOT_FOUND_FUZZY.gradient}
          baseIntensity={NOT_FOUND_FUZZY.baseIntensity}
          hoverIntensity={NOT_FOUND_FUZZY.hoverIntensity}
          fuzzRange={s.subtitleFuzz}
          fps={NOT_FOUND_FUZZY.fps}
          enableHover={NOT_FOUND_FUZZY.enableHover}
          glitchMode={NOT_FOUND_FUZZY.glitchMode}
          glitchInterval={NOT_FOUND_FUZZY.glitchInterval}
          glitchDuration={NOT_FOUND_FUZZY.glitchDuration}
          className="max-w-full px-1"
        >
          {subtitle}
        </FuzzyText>
      ) : null}
    </div>
  );
}

export default FuzzyText;
