import { describe, expect, it, vi } from "vitest";
import type { CarClient } from "../../../../rides/domain/clients/CarClient";
import type { DriverLookupClient } from "../../../../rides/domain/clients/DriverLookupClient";
import { EMPTY_CAR_DRAFT } from "../../../../rides/domain/models/CarDraft";
import {
  CarService,
  PAGE_SIZE,
} from "../../../../rides/domain/services/CarService";

function rawCar(index: number) {
  return { id: `c${index}`, plate: `P${index}`, drivers: [] };
}

function serviceWith(
  client: Partial<Record<keyof CarClient, unknown>> = {},
  drivers: Partial<Record<keyof DriverLookupClient, unknown>> = {},
) {
  return new CarService(
    client as unknown as CarClient,
    drivers as unknown as DriverLookupClient,
  );
}

describe("CarService", () => {
  it("keeps the page size constant so offsets stay aligned and a full page has a next one", async () => {
    const list = vi
      .fn()
      .mockResolvedValue(Array.from({ length: PAGE_SIZE }, (_, i) => rawCar(i)));
    const service = serviceWith({ list });

    const page = await service.list({ text: "cb" }, 1);

    expect(list).toHaveBeenCalledWith(
      `q=cb&page=1&size=${PAGE_SIZE}`,
      undefined,
    );
    expect(page.items).toHaveLength(PAGE_SIZE);
    expect(page.hasNext).toBe(true);
  });

  it("reports no next page for a short result", async () => {
    const service = serviceWith({ list: vi.fn().mockResolvedValue([rawCar(1)]) });

    const page = await service.list({ text: "" }, 0);

    expect(page.items).toHaveLength(1);
    expect(page.hasNext).toBe(false);
  });

  it("creates, updates and removes through the client", async () => {
    const create = vi.fn().mockResolvedValue(rawCar(1));
    const update = vi.fn().mockResolvedValue(rawCar(1));
    const remove = vi.fn().mockResolvedValue(undefined);
    const service = serviceWith({ create, update, remove });
    const draft = { ...EMPTY_CAR_DRAFT, plate: "CB 1234 AB" };

    expect((await service.create(draft)).id).toBe("c1");
    expect((await service.update("c1", draft)).id).toBe("c1");
    await service.remove("c1");

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ plate: "CB 1234 AB" }),
    );
    expect(update).toHaveBeenCalledWith("c1", expect.any(Object));
    expect(remove).toHaveBeenCalledWith("c1");
  });

  it("assigns and unassigns a driver", async () => {
    const assignDriver = vi.fn().mockResolvedValue(rawCar(1));
    const unassignDriver = vi.fn().mockResolvedValue(rawCar(1));
    const service = serviceWith({ assignDriver, unassignDriver });

    await service.assignDriver("c1", "d1");
    await service.unassignDriver("c1", "d1");

    expect(assignDriver).toHaveBeenCalledWith("c1", "d1");
    expect(unassignDriver).toHaveBeenCalledWith("c1", "d1");
  });

  it("sends the first word and narrows candidates by every typed word", async () => {
    const search = vi.fn().mockResolvedValue([
      { id: "d1", email: "ivan.petrov@taxi.test", firstName: "Иван", lastName: "Петров" },
      { id: "d2", email: "ivan.georgiev@taxi.test", firstName: "Иван", lastName: "Георгиев" },
    ]);
    const service = serviceWith({}, { search });

    const found = await service.searchDrivers("Иван  петров");

    expect(search).toHaveBeenCalledWith("иван", 50, undefined);
    expect(found.map((driver) => driver.id)).toEqual(["d1"]);
  });

  it("lists the first active drivers when nothing is typed", async () => {
    const search = vi
      .fn()
      .mockResolvedValue([{ id: "d1", email: "a@taxi.test" }]);
    const service = serviceWith({}, { search });

    const found = await service.searchDrivers("  ");

    expect(search).toHaveBeenCalledWith("", 50, undefined);
    expect(found).toHaveLength(1);
  });
});
