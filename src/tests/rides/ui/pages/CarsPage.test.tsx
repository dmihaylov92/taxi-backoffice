import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { App } from "../../../../App";
import type { AuthApi } from "../../../../auth/domain/services/AuthService";
import { bg } from "../../../../auth/ui/assets/copy";
import { ApiError } from "../../../../common/domain/models/ApiError";
import type { CarApi } from "../../../../rides/domain/services/CarService";
import { carFailureText, carsCopy } from "../../../../rides/ui/assets/copy";
import { georgi, ivan, skoda, toyota, unnamed } from "../../fixtures";

const adminIdentity = {
  id: "acc-admin",
  email: "admin@taxi.test",
  roles: ["ADMIN"] as ["ADMIN"],
};

function renderCars({
  cars = {},
  identity = adminIdentity,
  path = "/cars",
}: {
  cars?: Partial<CarApi>;
  identity?: { id: string; email: string; roles: ("ADMIN" | "DISPATCHER" | "DRIVER")[] };
  path?: string;
} = {}) {
  const api: CarApi = {
    list: vi.fn().mockResolvedValue({ items: [skoda, toyota], hasNext: false }),
    create: vi.fn().mockResolvedValue(skoda),
    update: vi.fn().mockResolvedValue(skoda),
    remove: vi.fn().mockResolvedValue(undefined),
    assignDriver: vi.fn().mockResolvedValue(toyota),
    unassignDriver: vi.fn().mockResolvedValue(toyota),
    searchDrivers: vi.fn().mockResolvedValue([ivan, georgi, unnamed]),
    ...cars,
  };
  const auth: AuthApi = {
    session: vi.fn().mockResolvedValue(identity),
    login: vi.fn(),
    forgot: vi.fn(),
    reset: vi.fn(),
    logout: vi.fn().mockResolvedValue(true),
  };

  render(
    <MemoryRouter initialEntries={[path]}>
      <App auth={auth} cars={api} />
    </MemoryRouter>,
  );

  return { api, auth, user: userEvent.setup() };
}

async function openMenu(
  user: ReturnType<typeof userEvent.setup>,
  plate: string,
  item: string,
) {
  await user.click(
    await screen.findByRole("button", { name: carsCopy.actionsFor(plate) }),
  );
  await user.click(screen.getByRole("menuitem", { name: item }));
}

describe("CarsPage (mocked car port, not live integration)", () => {
  it("lists plate, drivers, VIN and service date", async () => {
    renderCars();

    const table = await screen.findByRole("table", {
      name: carsCopy.tableCaption,
    });

    expect(within(table).getByText("CB1234AB")).toBeVisible();
    expect(within(table).getByText("Иван Петров")).toBeVisible();
    expect(within(table).getByText("Георги Иванов")).toBeVisible();
    expect(within(table).getByText("TMBJB7NX0LZ123456")).toBeVisible();
    expect(within(table).getByText("15.01.2026")).toBeVisible();
    expect(within(table).getByText(carsCopy.noDriver)).toBeVisible();
    expect(within(table).getAllByText(carsCopy.noValue)).toHaveLength(2);
  });

  it("shows the Cars entry in the navigation", async () => {
    renderCars();

    expect(
      await screen.findByRole("link", { name: "Автомобили" }),
    ).toHaveAttribute("href", "/cars");
  });

  it("sends accounts without staff roles to the holding page", async () => {
    renderCars({
      identity: { id: "x", email: "d@taxi.test", roles: ["DRIVER"] },
    });

    expect(
      await screen.findByRole("heading", { name: bg.authenticated }),
    ).toBeVisible();
  });

  it("shows the empty state and opens the create dialog from it", async () => {
    const { user } = renderCars({
      cars: { list: vi.fn().mockResolvedValue({ items: [], hasNext: false }) },
    });

    expect(await screen.findByText(carsCopy.emptyTitle)).toBeVisible();

    const buttons = screen.getAllByRole("button", { name: carsCopy.newCar });
    await user.click(buttons[buttons.length - 1]);

    expect(
      screen.getByRole("dialog", { name: carsCopy.create.title }),
    ).toBeVisible();
  });

  it("shows a retryable error when the list cannot be loaded", async () => {
    const list = vi
      .fn()
      .mockRejectedValueOnce(new ApiError(503))
      .mockResolvedValue({ items: [skoda], hasNext: false });
    const { user } = renderCars({ cars: { list } });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      carsCopy.errorBody,
    );

    await user.click(screen.getByRole("button", { name: carsCopy.retry }));

    expect(await screen.findByText("CB1234AB")).toBeVisible();
    expect(list).toHaveBeenCalledTimes(2);
  });

  it("signs out with the session notice when the API rejects the session", async () => {
    renderCars({
      cars: { list: vi.fn().mockRejectedValue(new ApiError(401)) },
    });

    expect(await screen.findByText(bg.session)).toBeVisible();
  });

  it("searches by plate or driver name through the API", async () => {
    const { api, user } = renderCars();

    await screen.findByText("CB1234AB");
    await user.type(
      screen.getByRole("searchbox", { name: carsCopy.searchLabel }),
      "ivan",
    );

    await waitFor(() =>
      expect(api.list).toHaveBeenLastCalledWith(
        { text: "ivan" },
        0,
        expect.any(AbortSignal),
      ),
    );
  });

  it("pages forward only while the API reports another page", async () => {
    const list = vi
      .fn()
      .mockResolvedValueOnce({ items: [skoda], hasNext: true })
      .mockResolvedValue({ items: [toyota], hasNext: false });
    const { user } = renderCars({ cars: { list } });

    await screen.findByText("CB1234AB");
    expect(
      screen.getByRole("button", { name: carsCopy.previous }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: carsCopy.next }));

    expect(await screen.findByText("E5678BH")).toBeVisible();
    expect(list).toHaveBeenLastCalledWith(
      { text: "" },
      1,
      expect.any(AbortSignal),
    );
    expect(screen.getByRole("button", { name: carsCopy.next })).toBeDisabled();
  });

  it("restores the search and page from the address and steps back from an empty page", async () => {
    const list = vi.fn().mockImplementation((_filters, page: number) =>
      Promise.resolve(
        page === 2
          ? { items: [], hasNext: false }
          : { items: [toyota], hasNext: false },
      ),
    );

    renderCars({ cars: { list }, path: "/cars?q=toy&page=2" });

    expect(await screen.findByText("E5678BH")).toBeVisible();
    expect(list).toHaveBeenCalledWith(
      { text: "toy" },
      2,
      expect.any(AbortSignal),
    );
    expect(list).toHaveBeenLastCalledWith(
      { text: "toy" },
      1,
      expect.any(AbortSignal),
    );
    expect(
      screen.getByRole("searchbox", { name: carsCopy.searchLabel }),
    ).toHaveValue("toy");
  });

  it("validates the plate before sending and then creates the car", async () => {
    const { api, user } = renderCars();

    await screen.findByText("CB1234AB");
    await user.click(screen.getByRole("button", { name: carsCopy.newCar }));
    await user.click(
      screen.getByRole("button", { name: carsCopy.create.submit }),
    );

    expect(
      screen.getByLabelText(`${carsCopy.fields.plate} *`),
    ).toHaveFocus();
    expect(screen.getByText("Въведете регистрационен номер.")).toBeVisible();
    expect(api.create).not.toHaveBeenCalled();

    await user.type(
      screen.getByLabelText(`${carsCopy.fields.plate} *`),
      "PB 0001 AA",
    );
    await user.click(
      screen.getByRole("button", { name: carsCopy.create.submit }),
    );

    expect(await screen.findByText(carsCopy.notices.created)).toBeVisible();
    expect(api.create).toHaveBeenCalledWith(
      expect.objectContaining({ plate: "PB 0001 AA", vin: "", mileageKm: "" }),
    );
    expect(api.list).toHaveBeenCalledTimes(2);
  });

  it("shows the API refusal of a field beside it and focuses it", async () => {
    const update = vi
      .fn()
      .mockRejectedValue(
        new ApiError(400, [{ field: "vin", code: "INVALID_FORMAT" }]),
      );
    const { user } = renderCars({ cars: { update } });

    await openMenu(user, "CB1234AB", carsCopy.menu.edit);
    await user.click(
      screen.getByRole("button", { name: carsCopy.edit.submit }),
    );

    expect(await screen.findByText(/VIN трябва да е точно/)).toBeVisible();
    expect(screen.getByLabelText(new RegExp(carsCopy.fields.vin))).toHaveFocus();
  });

  it("keeps the dialog open and explains a rejected save", async () => {
    const update = vi.fn().mockRejectedValue(new ApiError(409));
    const { user } = renderCars({ cars: { update } });

    await openMenu(user, "CB1234AB", carsCopy.menu.edit);
    await user.click(
      screen.getByRole("button", { name: carsCopy.edit.submit }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      carFailureText.conflict,
    );
    expect(
      screen.getByRole("dialog", { name: carsCopy.edit.title }),
    ).toBeVisible();
  });

  it("saves edits and reloads the list", async () => {
    const { api, user } = renderCars();

    await openMenu(user, "CB1234AB", carsCopy.menu.edit);
    await user.clear(screen.getByLabelText(`${carsCopy.fields.plate} *`));
    await user.type(
      screen.getByLabelText(`${carsCopy.fields.plate} *`),
      "CB9999AA",
    );
    await user.click(
      screen.getByRole("button", { name: carsCopy.edit.submit }),
    );

    expect(await screen.findByText(carsCopy.notices.saved)).toBeVisible();
    expect(api.update).toHaveBeenCalledWith(
      "car-skoda",
      expect.objectContaining({ plate: "CB9999AA", make: "Skoda" }),
    );
    expect(api.list).toHaveBeenCalledTimes(2);
  });

  it("deletes only after confirmation", async () => {
    const { api, user } = renderCars();

    await openMenu(user, "CB1234AB", carsCopy.menu.remove);

    expect(api.remove).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: carsCopy.remove.confirm }),
    );

    expect(await screen.findByText(carsCopy.notices.removed)).toBeVisible();
    expect(api.remove).toHaveBeenCalledWith("car-skoda");
  });

  it("assigns an available driver and keeps assigned drivers out of the candidates", async () => {
    const withIvan = { ...toyota, drivers: [ivan] };
    const assignDriver = vi.fn().mockResolvedValue(withIvan);
    const { api, user } = renderCars({ cars: { assignDriver } });

    await openMenu(user, "E5678BH", carsCopy.menu.drivers);

    const dialog = await screen.findByRole("dialog", {
      name: carsCopy.drivers.title("E5678BH"),
    });
    expect(
      await within(dialog).findByText(carsCopy.drivers.noneAssigned),
    ).toBeVisible();
    expect(within(dialog).getByText(carsCopy.drivers.releaseHint)).toBeVisible();

    await user.click(
      await within(dialog).findByRole("button", {
        name: carsCopy.drivers.assignFor("Иван Петров"),
      }),
    );

    expect(
      await within(dialog).findByText(carsCopy.drivers.assignedNotice),
    ).toBeVisible();
    expect(assignDriver).toHaveBeenCalledWith("car-toyota", "drv-ivan");
    expect(
      within(dialog).queryByRole("button", {
        name: carsCopy.drivers.assignFor("Иван Петров"),
      }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", {
        name: carsCopy.drivers.unassignFor("Иван Петров"),
      }),
    ).toBeVisible();
    await waitFor(() => expect(api.list).toHaveBeenCalledTimes(2));
  });

  it("unassigns a driver and reports a failed assignment without claiming success", async () => {
    const unassignDriver = vi.fn().mockResolvedValue({ ...skoda, drivers: [georgi] });
    const assignDriver = vi.fn().mockRejectedValue(new ApiError(409));
    const { user } = renderCars({ cars: { unassignDriver, assignDriver } });

    await openMenu(user, "CB1234AB", carsCopy.menu.drivers);

    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", {
        name: carsCopy.drivers.unassignFor("Иван Петров"),
      }),
    );

    expect(
      await within(dialog).findByText(carsCopy.drivers.unassignedNotice),
    ).toBeVisible();
    expect(unassignDriver).toHaveBeenCalledWith("car-skoda", "drv-ivan");
    expect(
      within(dialog).queryByRole("button", {
        name: carsCopy.drivers.unassignFor("Иван Петров"),
      }),
    ).not.toBeInTheDocument();

    await user.click(
      await within(dialog).findByRole("button", {
        name: carsCopy.drivers.assignFor("Иван Петров"),
      }),
    );

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      carFailureText.conflict,
    );
    expect(
      within(dialog).queryByText(carsCopy.drivers.assignedNotice),
    ).not.toBeInTheDocument();
  });

  it("narrows driver candidates while typing", async () => {
    const { api, user } = renderCars();

    await openMenu(user, "E5678BH", carsCopy.menu.drivers);

    const dialog = await screen.findByRole("dialog");
    await user.type(
      within(dialog).getByRole("searchbox", {
        name: carsCopy.drivers.searchLabel,
      }),
      "geo",
    );

    await waitFor(() =>
      expect(api.searchDrivers).toHaveBeenLastCalledWith(
        "geo",
        expect.any(AbortSignal),
      ),
    );
  });

  it("reports a failed driver lookup", async () => {
    const searchDrivers = vi.fn().mockRejectedValue(new ApiError(503));
    const { user } = renderCars({ cars: { searchDrivers } });

    await openMenu(user, "E5678BH", carsCopy.menu.drivers);

    expect(
      await screen.findByText(carsCopy.drivers.searchFailed),
    ).toBeVisible();
  });
});
