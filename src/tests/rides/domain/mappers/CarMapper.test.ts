import { describe, expect, it } from "vitest";
import {
  fromSearchParams,
  toCar,
  toCarDrivers,
  toCars,
  toDraft,
  toListQuery,
  toRequestBody,
  toSearchParams,
} from "../../../../rides/domain/mappers/CarMapper";
import { skoda, toyota } from "../../fixtures";

describe("CarMapper", () => {
  it("maps a car with its drivers and drops empty optional values", () => {
    const car = toCar({
      id: "c1",
      plate: "CB1234AB",
      make: "",
      model: "Octavia",
      vin: null,
      mileageKm: 5,
      servicedAt: "2026-01-15",
      drivers: [
        { id: "d1", email: "a@taxi.test", firstName: "Иван", lastName: "" },
      ],
      createdAt: "2026-01-01T00:00:00Z",
    });

    expect(car).toEqual({
      id: "c1",
      plate: "CB1234AB",
      make: undefined,
      model: "Octavia",
      vin: undefined,
      mileageKm: 5,
      servicedAt: "2026-01-15",
      drivers: [
        {
          id: "d1",
          email: "a@taxi.test",
          firstName: "Иван",
          lastName: undefined,
        },
      ],
    });
  });

  it.each([
    ["not an object", "x"],
    ["missing plate", { id: "c1", drivers: [] }],
    ["missing drivers", { id: "c1", plate: "A" }],
    ["driver without email", { id: "c1", plate: "A", drivers: [{ id: "d" }] }],
  ])("rejects a car response that is %s", (_name, raw) => {
    expect(() => toCar(raw)).toThrow();
  });

  it("rejects non-array list responses", () => {
    expect(() => toCars({})).toThrow();
    expect(() => toCarDrivers({})).toThrow();
  });

  it("maps lists", () => {
    expect(toCars([{ id: "c1", plate: "A", drivers: [] }])).toHaveLength(1);
    expect(toCarDrivers([{ id: "d", email: "d@taxi.test" }])).toHaveLength(1);
  });

  it("builds a request body from a draft, trimming and omitting blanks", () => {
    expect(
      toRequestBody({
        plate: " CB 1234 AB ",
        make: "  ",
        model: "Octavia ",
        vin: "",
        mileageKm: " 120000 ",
        servicedAt: "2026-01-15",
      }),
    ).toEqual({
      plate: "CB 1234 AB",
      make: undefined,
      model: "Octavia",
      vin: undefined,
      mileageKm: 120000,
      servicedAt: "2026-01-15",
    });
  });

  it("sends the VIN in upper case, matching what the validator accepted", () => {
    expect(
      toRequestBody({
        plate: "A",
        make: "",
        model: "",
        vin: " tmbjb7nx0lz123456 ",
        mileageKm: "",
        servicedAt: "",
      }).vin,
    ).toBe("TMBJB7NX0LZ123456");
  });

  it("omits an empty mileage and date", () => {
    expect(
      toRequestBody({
        plate: "A",
        make: "",
        model: "",
        vin: "",
        mileageKm: "",
        servicedAt: "",
      }),
    ).toEqual({
      plate: "A",
      make: undefined,
      model: undefined,
      vin: undefined,
      mileageKm: undefined,
      servicedAt: undefined,
    });
  });

  it("round-trips a car into an editable draft", () => {
    expect(toDraft(skoda)).toEqual({
      plate: "CB1234AB",
      make: "Skoda",
      model: "Octavia",
      vin: "TMBJB7NX0LZ123456",
      mileageKm: "120000",
      servicedAt: "2026-01-15",
    });
    expect(toDraft(toyota)).toEqual({
      plate: "E5678BH",
      make: "",
      model: "",
      vin: "",
      mileageKm: "",
      servicedAt: "",
    });
  });

  it("builds the list query", () => {
    expect(toListQuery({ text: " cb12 " }, 2, 21)).toBe("q=cb12&page=2&size=21");
    expect(toListQuery({ text: "  " }, 0, 21)).toBe("page=0&size=21");
  });

  it("reads and writes list state from the address bar", () => {
    expect(fromSearchParams(new URLSearchParams("q=ivan&page=3"))).toEqual({
      filters: { text: "ivan" },
      page: 3,
    });
    expect(fromSearchParams(new URLSearchParams("page=-1"))).toEqual({
      filters: { text: "" },
      page: 0,
    });
    expect(fromSearchParams(new URLSearchParams("page=5000"))).toEqual({
      filters: { text: "" },
      page: 0,
    });
    expect(
      toSearchParams({ filters: { text: " ivan " }, page: 2 }).toString(),
    ).toBe("q=ivan&page=2");
    expect(toSearchParams({ filters: { text: "" }, page: 0 }).toString()).toBe(
      "",
    );
  });
});
