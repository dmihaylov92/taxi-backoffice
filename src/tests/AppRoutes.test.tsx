import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { App } from "../App";
import type { AccountApi } from "../accounts/domain/services/AccountService";
import type { AuthApi } from "../auth/domain/services/AuthService";
import { bg } from "../auth/ui/assets/copy";
import type { Role } from "../common/domain/models/Role";
import { shell } from "../common/ui/assets/copy";
import { accountsCopy } from "../accounts/ui/assets/copy";
import { ridesCopy } from "../rides/ui/assets/rideCopy";
import { NO_RIDE_CAPABILITIES } from "../rides/domain/models/RideCapabilities";
import type { CarApi } from "../rides/domain/services/CarService";
import type { RideApi } from "../rides/domain/services/RideService";

const never = () => new Promise<never>(() => undefined);

const accounts: AccountApi = {
  list: vi.fn(never),
  create: vi.fn(never),
  update: vi.fn(never),
  deactivate: vi.fn(never),
  remove: vi.fn(never),
  resendInvitation: vi.fn(never),
};

const cars: CarApi = {
  list: vi.fn(never),
  create: vi.fn(never),
  update: vi.fn(never),
  remove: vi.fn(never),
  assignDriver: vi.fn(never),
  unassignDriver: vi.fn(never),
  searchDrivers: vi.fn(never),
};

const rides: RideApi = {
  capabilities: NO_RIDE_CAPABILITIES,
  list: vi.fn(never),
  create: vi.fn(never),
  update: vi.fn(never),
  reject: vi.fn(never),
  remove: vi.fn(never),
  drivers: vi.fn(never),
  acceptedAssignments: vi.fn(never),
};

function renderAt(path: string, roles: Role[] | undefined) {
  const auth: AuthApi = {
    session: vi.fn().mockResolvedValue(
      roles ? { id: "u1", email: "user@taxi.test", roles } : undefined,
    ),
    login: vi.fn(),
    forgot: vi.fn(),
    reset: vi.fn(),
    logout: vi.fn().mockResolvedValue(true),
  };

  render(
    <MemoryRouter initialEntries={[path]}>
      <App auth={auth} accounts={accounts} cars={cars} rides={rides} />
    </MemoryRouter>,
  );
}

async function navigationLabels(): Promise<string[]> {
  const nav = await screen.findByRole("navigation", { name: shell.navLabel });

  return within(nav)
    .getAllByRole("listitem")
    .map((item) => item.textContent ?? "");
}

describe("module access", () => {
  it("shows an administrator with dispatching every module", async () => {
    renderAt("/accounts", ["ADMIN", "DISPATCHER"]);

    const labels = await navigationLabels();

    expect(labels.map((label) => label.replace(shell.soon, "").replace(shell.unavailable, ""))).toEqual([
      shell.items.home,
      shell.items.rides,
      shell.items.cars,
      shell.items.accounts,
      shell.items.settings,
    ]);
  });

  it("shows a dispatcher only the modules it may open", async () => {
    renderAt("/rides", ["DISPATCHER"]);

    const nav = await screen.findByRole("navigation", { name: shell.navLabel });

    expect(within(nav).getByRole("link", { name: shell.items.rides })).toBeVisible();
    expect(within(nav).queryByText(shell.items.cars)).toBeNull();
    expect(within(nav).queryByText(shell.items.accounts)).toBeNull();
    expect(within(nav).queryByText(shell.items.settings)).toBeNull();
  });

  it("hides rides from an administrator without dispatching", async () => {
    renderAt("/accounts", ["ADMIN"]);

    const nav = await screen.findByRole("navigation", { name: shell.navLabel });

    expect(within(nav).queryByText(shell.items.rides)).toBeNull();
    expect(within(nav).getByRole("link", { name: shell.items.accounts })).toBeVisible();
    expect(within(nav).getByRole("link", { name: shell.items.cars })).toBeVisible();
  });

  it("sends a dispatcher away from administration to its own screen", async () => {
    renderAt("/accounts", ["DISPATCHER"]);

    // The rides page heading proves the guard redirected; navigation alone would not.
    expect(
      await screen.findByRole("heading", { name: ridesCopy.title }),
    ).toBeVisible();
    expect(screen.queryByRole("heading", { name: accountsCopy.title })).toBeNull();
  });

  it("sends a driver alone to the signed-in notice instead of any module", async () => {
    renderAt("/rides", ["DRIVER"]);

    expect(await screen.findByText(bg.authenticated)).toBeVisible();
    expect(screen.queryByRole("navigation", { name: shell.navLabel })).toBeNull();
  });

  it("sends a signed-out visitor to the login page", async () => {
    renderAt("/cars", undefined);

    expect(await screen.findByLabelText(bg.email)).toBeVisible();
  });
});
