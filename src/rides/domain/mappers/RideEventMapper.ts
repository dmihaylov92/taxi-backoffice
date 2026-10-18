import type { EventDecoders } from "../../../common/domain/models/EventDecoder";
import type { RideEvent } from "../models/RideEvent";
import { toRide } from "./RideMapper";

function parse(data: string): unknown {
  try {
    return JSON.parse(data);
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toUpdated(payload: unknown): RideEvent | undefined {
  if (!isRecord(payload)) {
    return undefined;
  }

  try {
    return { type: "updated", ride: toRide(payload.ride) };
  } catch {
    return undefined;
  }
}

function toDeleted(payload: unknown): RideEvent | undefined {
  return isRecord(payload) &&
    typeof payload.id === "string" &&
    payload.id.length > 0
    ? { type: "deleted", id: payload.id }
    : undefined;
}

/**
 * The ride events on the shared stream, by event name. The payload is untrusted, so anything that
 * is not a well-formed `ride.updated` or `ride.deleted` yields nothing and is dropped; the next
 * event, or the refetch after a reconnect, corrects the list.
 */
export const rideEventDecoders: EventDecoders<RideEvent> = {
  "ride.updated": (data) => toUpdated(parse(data)),
  "ride.deleted": (data) => toDeleted(parse(data)),
};

/** Reads one stream message into a ride event; other events yield nothing. */
export function toRideEvent(type: string, data: string): RideEvent | undefined {
  return rideEventDecoders[type]?.(data);
}
