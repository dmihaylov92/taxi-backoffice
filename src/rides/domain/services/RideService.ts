import type { ListPage } from "../../../common/domain/models/ListPage";
import { DriverLookupClient } from "../clients/DriverLookupClient";
import { RideClient } from "../clients/RideClient";
import { toRideDrivers } from "../mappers/RideDriverMapper";
import {
  toCreateBody,
  toListQuery,
  toRide,
  toRides,
  toUpdateBody,
} from "../mappers/RideMapper";
import type { Ride } from "../models/Ride";
import {
  NO_RIDE_CAPABILITIES,
  type RideCapabilities,
} from "../models/RideCapabilities";
import type { RideDraft } from "../models/RideDraft";
import type { AddressSuggestion } from "../models/AddressSuggestion";
import type { RideDriver } from "../models/RideDriver";
import type { RideFilters } from "../models/RideFilters";

export const PAGE_SIZE = 20;

/** The largest page the accounts and rides APIs serve; one driver holds at most one accepted ride. */
const LOOKUP_SIZE = 100;

export interface RideApi {
  /** Features the API cannot carry yet; the UI keeps the matching controls unavailable. */
  readonly capabilities: RideCapabilities;
  list(
    filters: RideFilters,
    page: number,
    signal?: AbortSignal,
  ): Promise<ListPage<Ride>>;
  create(draft: RideDraft): Promise<Ride>;
  update(id: string, draft: RideDraft): Promise<Ride>;
  reject(id: string): Promise<Ride>;
  remove(id: string): Promise<void>;
  /** Active drivers with availability; rejects for a dispatcher without access to accounts. */
  drivers(signal?: AbortSignal): Promise<RideDriver[]>;
  /** Maps each driver holding an accepted ride to that ride's id. */
  acceptedAssignments(signal?: AbortSignal): Promise<Map<string, string>>;
  /** Present only when the API can assign or reassign a driver. */
  assign?(id: string, driverId: string): Promise<Ride>;
  /** Present only when the API can reopen a finished or rejected ride. */
  reopen?(id: string): Promise<Ride>;
  /** Present only when an address search provider is configured. */
  suggestAddresses?(
    text: string,
    signal?: AbortSignal,
  ): Promise<AddressSuggestion[]>;
}

export class RideService implements RideApi {
  readonly capabilities = NO_RIDE_CAPABILITIES;

  constructor(
    private readonly client: RideClient = new RideClient(),
    private readonly lookup: DriverLookupClient = new DriverLookupClient(),
  ) {}

  /**
   * The API offset is page × size, so the size must stay constant across pages; a full page is
   * taken to have a successor, and an exact-multiple result ends on an empty page the UI steps
   * back from.
   */
  async list(
    filters: RideFilters,
    page: number,
    signal?: AbortSignal,
  ): Promise<ListPage<Ride>> {
    const raw = await this.client.list(
      toListQuery(filters, page, PAGE_SIZE),
      signal,
    );
    const rides = toRides(raw);

    return { items: rides, hasNext: rides.length === PAGE_SIZE };
  }

  async create(draft: RideDraft): Promise<Ride> {
    return toRide(await this.client.create(toCreateBody(draft)));
  }

  async update(id: string, draft: RideDraft): Promise<Ride> {
    return toRide(await this.client.update(id, toUpdateBody(draft)));
  }

  async reject(id: string): Promise<Ride> {
    return toRide(await this.client.reject(id));
  }

  remove(id: string): Promise<void> {
    return this.client.remove(id);
  }

  async drivers(signal?: AbortSignal): Promise<RideDriver[]> {
    return toRideDrivers(await this.lookup.search("", LOOKUP_SIZE, signal, "ALL"));
  }

  async acceptedAssignments(signal?: AbortSignal): Promise<Map<string, string>> {
    const rides = toRides(
      await this.client.list(
        toListQuery({ status: "ACCEPTED" }, 0, LOOKUP_SIZE),
        signal,
      ),
    );
    const held = new Map<string, string>();

    for (const ride of rides) {
      if (ride.driverId) {
        held.set(ride.driverId, ride.id);
      }
    }

    return held;
  }
}
