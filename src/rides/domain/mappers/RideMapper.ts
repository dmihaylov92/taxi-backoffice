import {
  RIDE_STATUSES,
  RIDE_TYPES,
  type Ride,
  type RideStatus,
  type RideType,
} from "../models/Ride";
import { PHONE_PREFIX, type RideDraft } from "../models/RideDraft";
import { nationalDigits } from "../services/RidePhoneService";
import type { RideFilters } from "../models/RideFilters";

/** Body shared by the create and update endpoints; the API stores nothing else yet. */
export interface RideRequestBody {
  phoneNumber: string;
  pickupAddress: string;
  destinationAddress: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function optionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function toStatus(value: unknown): RideStatus {
  const status = RIDE_STATUSES.find((candidate) => candidate === value);

  if (!status) {
    throw new Error("Unexpected ride status");
  }

  return status;
}

function toType(value: unknown): RideType | undefined {
  return typeof value === "string"
    ? RIDE_TYPES.find((candidate) => candidate === value.toUpperCase())
    : undefined;
}

/**
 * Reads one ride. `type`, `estimatedDistanceKm`, `plannedFrom` and `plannedTo` are conceptual
 * names from the domain model, not part of the current API; they stay undefined until it
 * returns them and must be confirmed against the contract then.
 */
export function toRide(raw: unknown): Ride {
  if (!isRecord(raw) || typeof raw.id !== "string") {
    throw new Error("Unexpected ride response");
  }

  return {
    id: raw.id,
    status: toStatus(raw.status),
    phoneNumber: optionalText(raw.phoneNumber),
    pickupAddress: optionalText(raw.pickupAddress),
    destinationAddress: optionalText(raw.destinationAddress),
    driverId: optionalText(raw.driverId),
    dispatcherId: optionalText(raw.dispatcherId),
    createdAt: optionalText(raw.createdAt),
    updatedAt: optionalText(raw.updatedAt),
    acceptedAt: optionalText(raw.acceptedAt),
    finishedAt: optionalText(raw.finishedAt),
    type: toType(raw.type),
    estimatedDistanceKm: optionalNumber(raw.estimatedDistanceKm),
    plannedFrom: optionalText(raw.plannedFrom),
    plannedTo: optionalText(raw.plannedTo),
  };
}

export function toRides(raw: unknown): Ride[] {
  if (!Array.isArray(raw)) {
    throw new Error("Unexpected ride list response");
  }

  return raw.map(toRide);
}

function editableFields(draft: RideDraft): RideRequestBody {
  return {
    phoneNumber: PHONE_PREFIX + nationalDigits(draft.phone),
    pickupAddress: draft.pickupAddress.trim(),
    destinationAddress: draft.destinationAddress.trim(),
  };
}

/**
 * Builds the create body. Business rides and a chosen driver have no place in the request yet, so
 * they fail loudly instead of being dropped and creating a different ride than the one on screen.
 */
export function toCreateBody(draft: RideDraft): RideRequestBody {
  if (draft.type !== "NORMAL" || draft.driverId) {
    throw new Error("The ride API cannot store a type or a driver yet");
  }

  return editableFields(draft);
}

/**
 * Builds the update body. Type, status and driver are read-only in an edit, so the draft's copies
 * of them are never sent: the API replaces the three editable fields and keeps the rest.
 */
export function toUpdateBody(draft: RideDraft): RideRequestBody {
  return editableFields(draft);
}

/** The part of a stored phone number after the country prefix, for the prefixed input. */
function nationalPart(phone: string | undefined): string {
  if (!phone) {
    return "";
  }

  return phone.startsWith(PHONE_PREFIX)
    ? phone.slice(PHONE_PREFIX.length)
    : phone;
}

export function toDraft(ride: Ride): RideDraft {
  return {
    type: ride.type ?? "NORMAL",
    phone: nationalPart(ride.phoneNumber),
    pickupAddress: ride.pickupAddress ?? "",
    destinationAddress: ride.destinationAddress ?? "",
    driverId: ride.driverId ?? "",
    plannedFrom: ride.plannedFrom ?? "",
    plannedTo: ride.plannedTo ?? "",
  };
}

/** Builds the list query string; `size` is the number of rows requested from the API. */
export function toListQuery(
  filters: RideFilters,
  page: number,
  size: number,
): string {
  const query = new URLSearchParams();

  if (filters.status) {
    query.set("status", filters.status);
  }

  query.set("page", String(page));
  query.set("size", String(size));

  return query.toString();
}

/** List state kept in the address bar so filtered pages can be reloaded and shared. */
export interface RideQuery {
  filters: RideFilters;
  /** Zero-based page index. */
  page: number;
}

const MAX_PAGE = 1000;

/** Reads list state from the address bar, ignoring values the API would reject. */
export function fromSearchParams(params: URLSearchParams): RideQuery {
  const page = Number(params.get("page") ?? 0);
  const status = RIDE_STATUSES.find(
    (candidate) => candidate === params.get("status"),
  );

  return {
    filters: { status },
    page: Number.isInteger(page) && page > 0 && page <= MAX_PAGE ? page : 0,
  };
}

export function toSearchParams(query: RideQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (query.filters.status) {
    params.set("status", query.filters.status);
  }

  if (query.page > 0) {
    params.set("page", String(query.page));
  }

  return params;
}
