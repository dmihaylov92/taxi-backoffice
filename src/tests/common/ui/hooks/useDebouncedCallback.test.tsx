import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedCallback } from "../../../../common/ui/hooks/useDebouncedCallback";

describe("useDebouncedCallback", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("runs once with the last arguments after calls stop", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    act(() => {
      result.current.call("a");
      result.current.call("ab");
      vi.advanceTimersByTime(299);
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));

    expect(callback).toHaveBeenCalledExactlyOnceWith("ab");
  });

  it("drops a pending call on cancel and on unmount", () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() =>
      useDebouncedCallback(callback, 300),
    );

    act(() => {
      result.current.call("a");
      result.current.cancel();
      vi.advanceTimersByTime(500);
    });
    act(() => {
      result.current.call("b");
    });
    unmount();
    vi.advanceTimersByTime(500);

    expect(callback).not.toHaveBeenCalled();
  });

  it("uses the latest callback when the timer fires", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(
      ({ callback }) => useDebouncedCallback(callback, 100),
      { initialProps: { callback: first } },
    );

    act(() => result.current.call("x"));
    rerender({ callback: second });
    act(() => vi.advanceTimersByTime(100));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith("x");
  });
});
