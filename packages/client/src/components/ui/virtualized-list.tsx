/**
 * Shared virtualized list primitive.
 *
 * Architecture:
 * - Keeps TanStack Virtual usage in one thin, unstyled wrapper.
 * - Callers keep ownership of item markup, Tailwind classes, and scroll containers.
 *
 * Caveat: callers must pass the actual scroll container via `getScrollElement`;
 * this component computes scrollMargin so lists can live below headers/filters.
 */
import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  measureElement as measureVirtualElement,
  observeElementRect,
  useVirtualizer,
  type Rect,
  type VirtualItem,
  type Virtualizer,
} from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";

type VirtualItemKey = string | number | bigint;

type VirtualizedListProps = {
  count: number;
  estimateSize: (index: number) => number;
  getItemKey: (index: number) => VirtualItemKey;
  getScrollElement: () => HTMLElement | null;
  renderItem: (index: number, virtualItem: VirtualItem) => ReactNode;
  className?: string;
  itemClassName?: string | ((index: number, virtualItem: VirtualItem) => string | undefined);
  overscan?: number;
  gap?: number;
  testId?: string;
};

function getInitialRect() {
  if (typeof window === "undefined") {
    return { width: 1024, height: 768 };
  }

  return {
    width: Math.max(window.innerWidth, 1),
    height: Math.max(window.innerHeight, 1),
  };
}

function getScrollMargin(container: HTMLElement, scrollElement: HTMLElement) {
  const containerRect = container.getBoundingClientRect();
  const scrollRect = scrollElement.getBoundingClientRect();
  if (containerRect.height === 0 && scrollRect.height === 0) {
    return getOffsetTopWithinScrollElement(container, scrollElement);
  }
  return Math.max(0, scrollElement.scrollTop + containerRect.top - scrollRect.top);
}

function getOffsetTopWithinScrollElement(container: HTMLElement, scrollElement: HTMLElement) {
  let offsetTop = 0;
  let current: HTMLElement | null = container;

  while (current && current !== scrollElement) {
    offsetTop += current.offsetTop;
    current = current.offsetParent instanceof HTMLElement ? current.offsetParent : null;
  }

  return offsetTop;
}

export function VirtualizedList({
  count,
  estimateSize,
  getItemKey,
  getScrollElement,
  renderItem,
  className,
  itemClassName,
  overscan = 4,
  gap = 0,
  testId,
}: VirtualizedListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  const initialRect = useMemo(() => getInitialRect(), []);
  const measureElementWithFallback = useCallback(
    (
      element: HTMLDivElement,
      entry: ResizeObserverEntry | undefined,
      instance: Virtualizer<HTMLElement, HTMLDivElement>,
    ) => {
      const measuredSize = measureVirtualElement(element, entry, instance);
      if (measuredSize > 0) return measuredSize;

      const index = Number(element.getAttribute(instance.options.indexAttribute));
      return estimateSize(Number.isFinite(index) ? index : 0);
    },
    [estimateSize],
  );
  const observeRectWithFallback = useCallback(
    (
      instance: Virtualizer<HTMLElement, HTMLDivElement>,
      callback: (rect: Rect) => void,
    ) =>
      observeElementRect(instance, (rect) => {
        callback({
          width: rect.width > 0 ? rect.width : initialRect.width,
          height: rect.height > 0 ? rect.height : initialRect.height,
        });
      }),
    [initialRect],
  );

  const measureScrollMargin = useCallback(() => {
    const container = containerRef.current;
    const scrollElement = getScrollElement();
    if (!container || !scrollElement) return;

    const nextScrollMargin = getScrollMargin(container, scrollElement);
    setScrollMargin((current) => (Math.abs(current - nextScrollMargin) < 1 ? current : nextScrollMargin));
  }, [getScrollElement]);

  useLayoutEffect(() => {
    measureScrollMargin();
  });

  useLayoutEffect(() => {
    const container = containerRef.current;
    const scrollElement = getScrollElement();
    if (!container || !scrollElement || typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(() => measureScrollMargin());
    observer.observe(container);
    observer.observe(scrollElement);

    const ownerWindow = scrollElement.ownerDocument.defaultView ?? window;
    ownerWindow.addEventListener("resize", measureScrollMargin);
    return () => {
      observer.disconnect();
      ownerWindow.removeEventListener("resize", measureScrollMargin);
    };
  }, [getScrollElement, measureScrollMargin]);

  // TanStack Virtual intentionally returns an imperative virtualizer instance; keep it local to this primitive.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer<HTMLElement, HTMLDivElement>({
    count,
    estimateSize,
    gap,
    getItemKey,
    getScrollElement,
    initialRect,
    measureElement: measureElementWithFallback,
    observeElementRect: observeRectWithFallback,
    overscan,
    scrollMargin,
    useAnimationFrameWithResizeObserver: true,
  });

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
      data-testid={testId}
      style={{ height: `${virtualizer.getTotalSize()}px` }}
    >
      {virtualizer.getVirtualItems().map((virtualItem) => {
        const resolvedItemClassName =
          typeof itemClassName === "function"
            ? itemClassName(virtualItem.index, virtualItem)
            : itemClassName;

        return (
          <div
            key={virtualItem.key}
            ref={virtualizer.measureElement}
            className={resolvedItemClassName}
            data-index={virtualItem.index}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualItem.start - scrollMargin}px)`,
            }}
          >
            {renderItem(virtualItem.index, virtualItem)}
          </div>
        );
      })}
    </div>
  );
}
