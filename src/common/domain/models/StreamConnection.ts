/**
 * `connecting` until the first connection is confirmed, `live` while the stream is confirmed, and
 * `paused` after it dropped until a new connection is confirmed.
 */
export type StreamConnection = "connecting" | "live" | "paused";
