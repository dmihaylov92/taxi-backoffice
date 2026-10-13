import type { ListPage } from "../../../common/domain/models/ListPage";
import { CarClient } from "../clients/CarClient";
import { DriverLookupClient } from "../clients/DriverLookupClient";
import {
  toCar,
  toCarDrivers,
  toCars,
  toListQuery,
  toRequestBody,
} from "../mappers/CarMapper";
import type { Car, CarDriver } from "../models/Car";
import type { CarDraft } from "../models/CarDraft";
import type { CarFilters } from "../models/CarFilters";

export const PAGE_SIZE = 20;

/** Candidates requested per lookup; the picker narrows further by typing more of the name. */
const DRIVER_LOOKUP_SIZE = 50;

export interface CarApi {
  list(
    filters: CarFilters,
    page: number,
    signal?: AbortSignal,
  ): Promise<ListPage<Car>>;
  create(draft: CarDraft): Promise<Car>;
  update(id: string, draft: CarDraft): Promise<Car>;
  remove(id: string): Promise<void>;
  assignDriver(carId: string, accountId: string): Promise<Car>;
  unassignDriver(carId: string, accountId: string): Promise<Car>;
  searchDrivers(text: string, signal?: AbortSignal): Promise<CarDriver[]>;
}

function words(text: string): string[] {
  return text.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

function searchableText(driver: CarDriver): string {
  return [driver.firstName, driver.lastName, driver.email]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export class CarService implements CarApi {
  constructor(
    private readonly client: CarClient = new CarClient(),
    private readonly drivers: DriverLookupClient = new DriverLookupClient(),
  ) {}

  /**
   * The API offset is page × size, so the size must stay constant across pages; a full page is taken
   * to have a successor, and an exact-multiple result ends on an empty page the UI steps back from.
   */
  async list(
    filters: CarFilters,
    page: number,
    signal?: AbortSignal,
  ): Promise<ListPage<Car>> {
    const raw = await this.client.list(
      toListQuery(filters, page, PAGE_SIZE),
      signal,
    );
    const cars = toCars(raw);

    return { items: cars, hasNext: cars.length === PAGE_SIZE };
  }

  async create(draft: CarDraft): Promise<Car> {
    return toCar(await this.client.create(toRequestBody(draft)));
  }

  async update(id: string, draft: CarDraft): Promise<Car> {
    return toCar(await this.client.update(id, toRequestBody(draft)));
  }

  remove(id: string): Promise<void> {
    return this.client.remove(id);
  }

  async assignDriver(carId: string, accountId: string): Promise<Car> {
    return toCar(await this.client.assignDriver(carId, accountId));
  }

  async unassignDriver(carId: string, accountId: string): Promise<Car> {
    return toCar(await this.client.unassignDriver(carId, accountId));
  }

  /**
   * The accounts API matches one fragment at a time, so the first word is sent and the remaining
   * words narrow the result here; "Иван Петров" therefore finds that driver.
   */
  async searchDrivers(
    text: string,
    signal?: AbortSignal,
  ): Promise<CarDriver[]> {
    const typed = words(text);
    const raw = await this.drivers.search(
      typed[0] ?? "",
      DRIVER_LOOKUP_SIZE,
      signal,
    );

    return toCarDrivers(raw).filter((driver) => {
      const haystack = searchableText(driver);

      return typed.every((word) => haystack.includes(word));
    });
  }
}
