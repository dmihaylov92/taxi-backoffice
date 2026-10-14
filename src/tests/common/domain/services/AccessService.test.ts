import { describe, expect, it } from "vitest";
import {
  canAccess,
  landingPath,
  visibleModules,
} from "../../../../common/domain/services/AccessService";

const ids = (roles: Parameters<typeof visibleModules>[0]) =>
  visibleModules(roles).map((module) => module.id);

describe("AccessService", () => {
  it("lets anyone open public screens and only signed-in accounts the rest", () => {
    expect(canAccess(undefined, "PUBLIC")).toBe(true);
    expect(canAccess(undefined, "AUTHENTICATED")).toBe(false);
    expect(canAccess(["DRIVER"], "AUTHENTICATED")).toBe(true);
  });

  it("requires the exact role without implying one from another", () => {
    expect(canAccess(["ADMIN"], "DISPATCHER")).toBe(false);
    expect(canAccess(["ADMIN", "DISPATCHER"], "DISPATCHER")).toBe(true);
    expect(canAccess(undefined, "ADMIN")).toBe(false);
  });

  it("shows an administrator with dispatching every module in order", () => {
    expect(ids(["ADMIN", "DISPATCHER"])).toEqual([
      "home",
      "rides",
      "cars",
      "accounts",
      "settings",
    ]);
  });

  it("shows a dispatcher only home and rides", () => {
    expect(ids(["DISPATCHER"])).toEqual(["home", "rides"]);
  });

  it("shows an administrator without dispatching no rides", () => {
    expect(ids(["ADMIN"])).toEqual(["home", "cars", "accounts", "settings"]);
  });

  it("shows a driver alone only home, and a signed-out visitor nothing", () => {
    expect(ids(["DRIVER"])).toEqual(["home"]);
    expect(ids(undefined)).toEqual([]);
  });

  it("gives paths only to modules that have a screen", () => {
    expect(visibleModules(["ADMIN", "DISPATCHER"])).toEqual([
      { id: "home", path: undefined },
      { id: "rides", path: "/rides" },
      { id: "cars", path: "/cars" },
      { id: "accounts", path: "/accounts" },
      { id: "settings", path: undefined },
    ]);
  });

  it("lands each account on the first screen it may open", () => {
    expect(landingPath(["ADMIN", "DISPATCHER"])).toBe("/accounts");
    expect(landingPath(["ADMIN"])).toBe("/accounts");
    expect(landingPath(["DISPATCHER"])).toBe("/rides");
    expect(landingPath(["DRIVER"])).toBeUndefined();
  });
});
