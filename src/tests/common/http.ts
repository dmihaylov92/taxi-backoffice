import { vi } from "vitest";

/** Builds a fetch Response with an optional JSON body. */
export function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
  });
}

/** The session CSRF endpoint's answer. */
export function csrfResponse(token = "synthetic-proof"): Response {
  return jsonResponse(200, { token, headerName: "X-CSRF-Token" });
}

/** A fetch double that answers with the given responses in order. */
export function queuedFetch(...responses: Response[]) {
  const fetcher = vi.fn();

  for (const response of responses) {
    fetcher.mockResolvedValueOnce(response);
  }

  return fetcher;
}

export function requestedPaths(fetcher: ReturnType<typeof vi.fn>): string[] {
  return fetcher.mock.calls.map((call) => String(call[0]));
}
