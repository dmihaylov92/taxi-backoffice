import type { Car, CarDriver } from "../models/Car";
import type { CarDraft } from "../models/CarDraft";
import type { CarFilters } from "../models/CarFilters";

/** Body shared by the create and update endpoints. */
export interface CarRequestBody {
  plate: string;
  make?: string;
  model?: string;
  vin?: string;
  mileageKm?: number;
  servicedAt?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function optionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

export function toCarDriver(raw: unknown): CarDriver {
  if (
    !isRecord(raw) ||
    typeof raw.id !== "string" ||
    typeof raw.email !== "string"
  ) {
    throw new Error("Unexpected driver response");
  }

  return {
    id: raw.id,
    email: raw.email,
    firstName: optionalText(raw.firstName),
    lastName: optionalText(raw.lastName),
  };
}

export function toCarDrivers(raw: unknown): CarDriver[] {
  if (!Array.isArray(raw)) {
    throw new Error("Unexpected driver list response");
  }

  return raw.map(toCarDriver);
}

export function toCar(raw: unknown): Car {
  if (
    !isRecord(raw) ||
    typeof raw.id !== "string" ||
    typeof raw.plate !== "string" ||
    !Array.isArray(raw.drivers)
  ) {
    throw new Error("Unexpected car response");
  }

  return {
    id: raw.id,
    plate: raw.plate,
    make: optionalText(raw.make),
    model: optionalText(raw.model),
    vin: optionalText(raw.vin),
    mileageKm: optionalNumber(raw.mileageKm),
    servicedAt: optionalText(raw.servicedAt),
    drivers: raw.drivers.map(toCarDriver),
  };
}

export function toCars(raw: unknown): Car[] {
  if (!Array.isArray(raw)) {
    throw new Error("Unexpected car list response");
  }

  return raw.map(toCar);
}

function trimmedOrUndefined(value: string): string | undefined {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

export function toRequestBody(draft: CarDraft): CarRequestBody {
  const mileage = draft.mileageKm.trim();

  return {
    plate: draft.plate.trim(),
    make: trimmedOrUndefined(draft.make),
    model: trimmedOrUndefined(draft.model),
    vin: trimmedOrUndefined(draft.vin)?.toUpperCase(),
    mileageKm: mileage.length > 0 ? Number(mileage) : undefined,
    servicedAt: trimmedOrUndefined(draft.servicedAt),
  };
}

export function toDraft(car: Car): CarDraft {
  return {
    plate: car.plate,
    make: car.make ?? "",
    model: car.model ?? "",
    vin: car.vin ?? "",
    mileageKm: car.mileageKm === undefined ? "" : String(car.mileageKm),
    servicedAt: car.servicedAt ?? "",
  };
}

/** Builds the list query string; `size` is the number of rows requested from the API. */
export function toListQuery(
  filters: CarFilters,
  page: number,
  size: number,
): string {
  const query = new URLSearchParams();
  const text = filters.text.trim();

  if (text) {
    query.set("q", text);
  }

  query.set("page", String(page));
  query.set("size", String(size));

  return query.toString();
}

/** List state kept in the address bar so filtered pages can be reloaded and shared. */
export interface CarQuery {
  filters: CarFilters;
  /** Zero-based page index. */
  page: number;
}

const MAX_PAGE = 1000;

/** Reads list state from the address bar, ignoring values the API would reject. */
export function fromSearchParams(params: URLSearchParams): CarQuery {
  const page = Number(params.get("page") ?? 0);

  return {
    filters: { text: params.get("q") ?? "" },
    page: Number.isInteger(page) && page > 0 && page <= MAX_PAGE ? page : 0,
  };
}

export function toSearchParams(query: CarQuery): URLSearchParams {
  const params = new URLSearchParams();
  const text = query.filters.text.trim();

  if (text) {
    params.set("q", text);
  }

  if (query.page > 0) {
    params.set("page", String(query.page));
  }

  return params;
}
