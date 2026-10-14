import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { App } from "../../../../App";
import type { AccountApi } from "../../../../accounts/domain/services/AccountService";
import type { AuthApi } from "../../../../auth/domain/services/AuthService";
import { bg } from "../../../../auth/ui/assets/copy";
import { ApiError } from "../../../../common/domain/models/ApiError";
import type { Role } from "../../../../common/domain/models/Role";
import { ApiClient } from "../../../../common/domain/clients/ApiClient";
import { DriverLookupClient } from "../../../../rides/domain/clients/DriverLookupClient";
import { RideClient } from "../../../../rides/domain/clients/RideClient";
import { NO_RIDE_CAPABILITIES } from "../../../../rides/domain/models/RideCapabilities";
import {
  RideService,
  type RideApi,
} from "../../../../rides/domain/services/RideService";
import { csrfResponse, jsonResponse } from "../../../common/http";
import {
  ridesCopy,
  rideFailureText,
} from "../../../../rides/ui/assets/rideCopy";
import {
  acceptedRide,
  externalRide,
  finishedRide,
  pendingRide,
  rejectedRide,
  rideApi,
} from "../../rideFixtures";

const dispatcher = {
  id: "acc-dispatcher",
  email: "dispatcher@taxi.test",
  roles: ["DISPATCHER"] as Role[],
};

type User = ReturnType<typeof userEvent.setup>;

function renderRides({
  rides = {},
  service,
  identity = dispatcher,
  path = "/rides",
}: {
  rides?: Partial<RideApi>;
  /** A complete port, such as the real service over a fake transport. */
  service?: RideApi;
  identity?: { id: string; email: string; roles: Role[] };
  path?: string;
} = {}) {
  const api = service ?? rideApi(rides);
  const auth: AuthApi = {
    session: vi.fn().mockResolvedValue(identity),
    login: vi.fn(),
    forgot: vi.fn(),
    reset: vi.fn(),
    logout: vi.fn().mockResolvedValue(true),
  };
  const accounts = {
    list: vi.fn().mockResolvedValue({ items: [], hasNext: false }),
  } as unknown as AccountApi;

  render(
    <MemoryRouter initialEntries={[path]}>
      <App auth={auth} accounts={accounts} rides={api} />
    </MemoryRouter>,
  );

  return { api, auth, user: userEvent.setup() };
}

async function openMenu(user: User, number: string) {
  await user.click(
    await screen.findByRole("button", { name: ridesCopy.actionsFor(number) }),
  );
}

async function chooseAction(user: User, number: string, item: string) {
  await openMenu(user, number);
  await user.click(screen.getByRole("menuitem", { name: item }));
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });

  return { promise, resolve, reject };
}

async function fillCreateForm(user: User) {
  await user.type(screen.getByLabelText(/Телефон на клиента/), "888 123 456");
  await user.type(
    screen.getByLabelText(/Адрес за вземане/),
    "ул. Димитър Благоев 12",
  );
  await user.type(
    screen.getByLabelText(/Дестинация/),
    "ЖП гара Димитровград",
  );
}

describe("RidesPage (mocked ride port, not live integration)", () => {
  describe("list", () => {
    it("stops asking for driver names once the API has refused the lookup", async () => {
      const drivers = vi.fn().mockRejectedValue(new ApiError(403));
      const { api, user } = renderRides({ rides: { drivers } });

      await screen.findByRole("table");
      await waitFor(() => expect(drivers).toHaveBeenCalledTimes(1));
      await chooseAction(user, "001045", ridesCopy.menu.remove);
      await user.click(
        screen.getByRole("button", { name: ridesCopy.remove.confirm }),
      );

      await waitFor(() => expect(api.list).toHaveBeenCalledTimes(2));
      expect(drivers).toHaveBeenCalledTimes(1);
    });

    it("shows number, phone, route, status, driver and availability", async () => {
      renderRides();

      const table = await screen.findByRole("table", {
        name: ridesCopy.tableCaption,
      });
      const row = within(table).getByRole("row", { name: /001047/ });

      expect(within(row).getByText("+359 877 456 789")).toBeVisible();
      expect(within(row).getByText("бул. България 45")).toBeVisible();
      expect(within(row).getByText("→ ул. Христо Ботев 8")).toBeVisible();
      expect(within(row).getByText(ridesCopy.statuses.ACCEPTED)).toBeVisible();
      expect(await within(row).findByText("Иван Петров")).toBeVisible();
      expect(within(row).getByText(ridesCopy.availability.BUSY)).toBeVisible();
      expect(within(row).getByText("14.08.2026 10:11")).toBeVisible();
    });

    it("shows missing values as muted labels, not errors", async () => {
      renderRides({
        rides: {
          list: vi.fn().mockResolvedValue({
            items: [pendingRide, externalRide],
            hasNext: false,
          }),
        },
      });

      const table = await screen.findByRole("table");
      const pending = within(table).getByRole("row", { name: /001048/ });
      const external = within(table).getByRole("row", { name: /001043/ });

      expect(within(pending).getByText(ridesCopy.noDriver)).toBeVisible();
      expect(within(external).getByText(ridesCopy.noAddresses)).toBeVisible();
      expect(within(external).getByText(ridesCopy.driverUnknown)).toBeVisible();
      expect(within(external).getAllByText(ridesCopy.noValue)).toHaveLength(1);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("hides the type and estimate columns the API does not return", async () => {
      renderRides();

      await screen.findByRole("table");

      expect(
        screen.queryByRole("columnheader", { name: ridesCopy.columns.type }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("columnheader", { name: ridesCopy.columns.distance }),
      ).not.toBeInTheDocument();
    });

    it("shows those columns once the API returns the fields", async () => {
      renderRides({
        rides: {
          capabilities: {
            ...NO_RIDE_CAPABILITIES,
            rideType: true,
            estimatedDistance: true,
          },
          list: vi.fn().mockResolvedValue({
            items: [
              { ...acceptedRide, type: "BUSINESS", estimatedDistanceKm: 71.3 },
            ],
            hasNext: false,
          }),
        },
      });

      expect(
        await screen.findByRole("columnheader", { name: ridesCopy.columns.type }),
      ).toBeVisible();
      expect(screen.getByText(ridesCopy.types.BUSINESS)).toBeVisible();
      expect(screen.getByText("71,3 км")).toBeVisible();
    });

    it("keeps unsupported search and filters visibly disabled", async () => {
      renderRides();

      await screen.findByRole("table");

      expect(
        screen.getByRole("searchbox", { name: ridesCopy.searchLabel }),
      ).toBeDisabled();
      expect(
        screen.getByRole("combobox", { name: ridesCopy.typeFilter }),
      ).toBeDisabled();
      expect(
        screen.getByRole("combobox", { name: ridesCopy.driverFilter }),
      ).toBeDisabled();
      expect(
        screen.getByRole("combobox", { name: ridesCopy.statusFilter }),
      ).toBeEnabled();
    });

    it("filters by status through the API and the address bar", async () => {
      const { api, user } = renderRides();

      await screen.findByRole("table");
      await user.selectOptions(
        screen.getByRole("combobox", { name: ridesCopy.statusFilter }),
        "PENDING",
      );

      await waitFor(() =>
        expect(api.list).toHaveBeenLastCalledWith(
          { status: "PENDING" },
          0,
          expect.any(AbortSignal),
        ),
      );
    });

    it("restores the filter and page from the address bar", async () => {
      const { api } = renderRides({ path: "/rides?status=FINISHED&page=2" });

      await screen.findByRole("table");

      expect(api.list).toHaveBeenCalledWith(
        { status: "FINISHED" },
        2,
        expect.any(AbortSignal),
      );
    });

    it("cancels the stale list request when the filter changes", async () => {
      const signals: AbortSignal[] = [];
      const list = vi
        .fn()
        .mockImplementationOnce(
          (_filters: unknown, _page: number, signal: AbortSignal) => {
            signals.push(signal);

            return new Promise(() => undefined);
          },
        )
        .mockResolvedValue({ items: [pendingRide], hasNext: false });
      const { user } = renderRides({ rides: { list } });

      await user.selectOptions(
        await screen.findByRole("combobox", { name: ridesCopy.statusFilter }),
        "REJECTED",
      );

      await screen.findByRole("table");

      expect(signals[0].aborted).toBe(true);
    });

    it("pages without inventing totals", async () => {
      const list = vi
        .fn()
        .mockResolvedValueOnce({ items: [pendingRide], hasNext: true })
        .mockResolvedValue({ items: [acceptedRide], hasNext: false });
      const { user } = renderRides({ rides: { list } });

      const next = await screen.findByRole("button", {
        name: ridesCopy.next,
      });

      expect(screen.getByText(ridesCopy.shown(1))).toBeVisible();
      expect(screen.getByRole("button", { name: ridesCopy.previous })).toBeDisabled();

      await user.click(next);

      expect(await screen.findByText("001047")).toBeVisible();
      expect(list).toHaveBeenLastCalledWith(
        {},
        1,
        expect.any(AbortSignal),
      );
      expect(screen.getByRole("button", { name: ridesCopy.next })).toBeDisabled();
    });

    it("shows the empty state and opens the create dialog from it", async () => {
      const { user } = renderRides({
        rides: { list: vi.fn().mockResolvedValue({ items: [], hasNext: false }) },
      });

      expect(await screen.findByText(ridesCopy.emptyTitle)).toBeVisible();

      const buttons = screen.getAllByRole("button", { name: ridesCopy.newRide });
      await user.click(buttons[buttons.length - 1]);

      expect(
        screen.getByRole("dialog", { name: ridesCopy.create.title }),
      ).toBeVisible();
    });

    it("explains an empty filtered result and clears the filter", async () => {
      const list = vi
        .fn()
        .mockResolvedValueOnce({ items: [], hasNext: false })
        .mockResolvedValue({ items: [pendingRide], hasNext: false });
      const { user } = renderRides({
        rides: { list },
        path: "/rides?status=REJECTED",
      });

      expect(await screen.findByText(ridesCopy.noResultsTitle)).toBeVisible();
      expect(
        screen.getByText(ridesCopy.noResultsBody(ridesCopy.statuses.REJECTED)),
      ).toBeVisible();

      await user.click(
        screen.getByRole("button", { name: ridesCopy.clearFilters }),
      );

      expect(await screen.findByText("001048")).toBeVisible();
    });

    it("shows a retryable error when the list cannot be loaded", async () => {
      const list = vi
        .fn()
        .mockRejectedValueOnce(new ApiError(503))
        .mockResolvedValue({ items: [pendingRide], hasNext: false });
      const { user } = renderRides({ rides: { list } });

      expect(await screen.findByRole("alert")).toHaveTextContent(
        ridesCopy.errorBody,
      );

      await user.click(screen.getByRole("button", { name: ridesCopy.retry }));

      expect(await screen.findByText("001048")).toBeVisible();
    });

    it("signs out with the session notice when the API rejects the session", async () => {
      renderRides({
        rides: { list: vi.fn().mockRejectedValue(new ApiError(401)) },
      });

      expect(await screen.findByText(bg.session)).toBeVisible();
    });

    it("falls back to a generic driver label when drivers cannot be looked up", async () => {
      renderRides({
        rides: { drivers: vi.fn().mockRejectedValue(new ApiError(403)) },
      });

      const row = within(await screen.findByRole("table")).getByRole("row", {
        name: /001047/,
      });

      expect(await within(row).findByText(ridesCopy.driverUnknown)).toBeVisible();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("access", () => {
    it("puts the entry in the navigation", async () => {
      renderRides();

      expect(await screen.findByRole("link", { name: "Поръчки" })).toHaveAttribute(
        "href",
        "/rides",
      );
    });

    it("sends an administrator without DISPATCHER away from rides", async () => {
      renderRides({
        identity: { id: "a", email: "a@taxi.test", roles: ["ADMIN"] },
      });

      expect(
        await screen.findByRole("heading", { name: "Акаунти" }),
      ).toBeVisible();
      expect(
        screen.queryByRole("heading", { name: ridesCopy.title }),
      ).not.toBeInTheDocument();
    });

    it("lets an administrator who also dispatches in", async () => {
      renderRides({
        identity: {
          id: "a",
          email: "a@taxi.test",
          roles: ["ADMIN", "DISPATCHER"],
        },
      });

      expect(
        await screen.findByRole("heading", { name: ridesCopy.title }),
      ).toBeVisible();
    });

    it("sends accounts without staff roles to the holding page", async () => {
      renderRides({
        identity: { id: "d", email: "d@taxi.test", roles: ["DRIVER"] },
      });

      expect(
        await screen.findByRole("heading", { name: bg.authenticated }),
      ).toBeVisible();
    });

    it("sends a dispatcher who opens another module to rides", async () => {
      renderRides({ path: "/accounts" });

      expect(
        await screen.findByRole("heading", { name: ridesCopy.title }),
      ).toBeVisible();
    });
  });

  describe("row actions", () => {
    async function menuLabels(user: User, number: string) {
      await openMenu(user, number);

      return screen.getAllByRole("menuitem").map((item) => item.textContent);
    }

    it("offers the actions of the approved matrix for each status", async () => {
      const { user } = renderRides({
        rides: {
          list: vi.fn().mockResolvedValue({
            items: [pendingRide, acceptedRide, finishedRide, rejectedRide],
            hasNext: false,
          }),
        },
      });

      await screen.findByRole("table");

      expect(await menuLabels(user, "001048")).toEqual([
        "Преглед",
        "Редактирай",
        `${ridesCopy.menu.assign}${ridesCopy.unavailable}`,
        "Откажи",
        "Изтрий",
      ]);
      await user.keyboard("{Escape}");

      expect(await menuLabels(user, "001047")).toEqual([
        "Преглед",
        "Редактирай",
        `${ridesCopy.menu.reassign}${ridesCopy.unavailable}`,
        "Откажи",
        "Изтрий",
      ]);
      await user.keyboard("{Escape}");

      expect(await menuLabels(user, "001046")).toEqual([
        "Преглед",
        "Редактирай",
        `${ridesCopy.menu.reassign}${ridesCopy.unavailable}`,
        "Откажи",
        `${ridesCopy.menu.reopen}${ridesCopy.unavailable}`,
        "Изтрий",
      ]);
      await user.keyboard("{Escape}");

      expect(await menuLabels(user, "001045")).toEqual([
        "Преглед",
        "Редактирай",
        `${ridesCopy.menu.reassign}${ridesCopy.unavailable}`,
        `${ridesCopy.menu.reopen}${ridesCopy.unavailable}`,
        "Изтрий",
      ]);
    });

    it("names unavailable operations and does nothing when they are chosen", async () => {
      const { user } = renderRides();

      await openMenu(user, "001048");

      const assign = screen.getByRole("menuitem", {
        name: ridesCopy.menu.assign,
      });

      expect(assign).toHaveAttribute("aria-disabled", "true");
      expect(assign).toHaveAccessibleDescription(ridesCopy.unavailable);

      await user.click(assign);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("words assignment by whether a driver is held", async () => {
      const assign = vi.fn();
      const { user } = renderRides({
        rides: {
          assign,
          list: vi.fn().mockResolvedValue({
            items: [{ ...pendingRide, driverId: undefined }, acceptedRide],
            hasNext: false,
          }),
        },
      });

      await openMenu(user, "001048");

      expect(
        screen.getByRole("menuitem", { name: ridesCopy.menu.assign }),
      ).not.toHaveAttribute("aria-disabled");

      await user.keyboard("{Escape}");
      await openMenu(user, "001047");

      expect(
        screen.getByRole("menuitem", { name: ridesCopy.menu.reassign }),
      ).toBeVisible();
    });
  });

  describe("details", () => {
    it("shows every field and the footer of an accepted ride", async () => {
      const { user } = renderRides();

      await screen.findByRole("table");
      await chooseAction(user, "001047", ridesCopy.menu.view);

      const dialog = screen.getByRole("dialog", {
        name: ridesCopy.details.title,
      });

      expect(within(dialog).getByText("001047")).toBeVisible();
      expect(within(dialog).getByText("+359 877 456 789")).toBeVisible();
      expect(within(dialog).getByText("бул. България 45")).toBeVisible();
      expect(within(dialog).getByText("ул. Христо Ботев 8")).toBeVisible();
      expect(await within(dialog).findByText("Иван Петров")).toBeVisible();
      expect(within(dialog).getByText(ridesCopy.details.you)).toBeVisible();
      expect(within(dialog).getByText("14.08.2026 10:13")).toBeVisible();
      expect(
        within(dialog).getByRole("button", { name: ridesCopy.menu.reassign }),
      ).toBeVisible();
      expect(
        within(dialog).getByRole("button", { name: ridesCopy.menu.reject }),
      ).toBeVisible();
      expect(
        within(dialog).queryByRole("button", { name: ridesCopy.menu.reopen }),
      ).not.toBeInTheDocument();
      expect(
        within(dialog).getByRole("button", { name: ridesCopy.details.edit }),
      ).toBeVisible();
    });

    it("offers reopening instead of rejecting for a finished ride", async () => {
      const { user } = renderRides();

      await screen.findByRole("table");
      await chooseAction(user, "001046", ridesCopy.menu.view);

      const dialog = screen.getByRole("dialog", {
        name: ridesCopy.details.title,
      });

      expect(
        within(dialog).getByRole("button", { name: ridesCopy.menu.reopen }),
      ).toBeVisible();
      expect(
        within(dialog).queryByRole("button", { name: ridesCopy.menu.reject }),
      ).not.toBeInTheDocument();
      expect(within(dialog).getByText(ridesCopy.details.otherDispatcher)).toBeVisible();
    });

    it("shows missing data as muted labels", async () => {
      const { user } = renderRides({
        rides: {
          list: vi.fn().mockResolvedValue({
            items: [externalRide],
            hasNext: false,
          }),
        },
      });

      await screen.findByRole("table");
      await chooseAction(user, "001043", ridesCopy.menu.view);

      const dialog = screen.getByRole("dialog", {
        name: ridesCopy.details.title,
      });

      expect(within(dialog).getByText(ridesCopy.details.noPhone)).toBeVisible();
      expect(within(dialog).getAllByText(ridesCopy.details.noAddress)).toHaveLength(2);
      expect(within(dialog).getByText(ridesCopy.details.noDispatcher)).toBeVisible();
      expect(within(dialog).getByText(ridesCopy.driverUnknown)).toBeVisible();
      expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
    });

    it("returns focus to the row menu trigger when closed", async () => {
      const { user } = renderRides();

      await screen.findByRole("table");
      await chooseAction(user, "001048", ridesCopy.menu.view);
      await user.keyboard("{Escape}");

      expect(
        screen.getByRole("button", { name: ridesCopy.actionsFor("001048") }),
      ).toHaveFocus();
    });

    it("opens editing on top of the details and returns to them on cancel", async () => {
      const { user } = renderRides();

      await screen.findByRole("table");
      await chooseAction(user, "001048", ridesCopy.menu.view);
      await user.click(
        screen.getByRole("button", { name: ridesCopy.details.edit }),
      );

      expect(
        screen.getByRole("dialog", { name: ridesCopy.edit.title("001048") }),
      ).toBeVisible();

      await user.click(screen.getByRole("button", { name: ridesCopy.cancel }));

      expect(
        screen.getByRole("dialog", { name: ridesCopy.details.title }),
      ).toBeVisible();
    });
  });

  describe("create", () => {
    async function openCreate(user: User) {
      await screen.findByRole("table");
      await user.click(screen.getByRole("button", { name: ridesCopy.newRide }));
    }

    it("sends a pasted full phone number to the API as +359 and nine digits", async () => {
      const wire = {
        id: acceptedRide.id,
        status: "PENDING",
        phoneNumber: "+359888123456",
        pickupAddress: "ул. Димитър Благоев 12",
        destinationAddress: "ЖП гара Димитровград",
      };
      const requests: { url: string; method?: string; body?: unknown }[] = [];
      const fetcher = vi.fn(
        async (input: RequestInfo | URL, init?: RequestInit) => {
          const url = String(input);

          requests.push({ url, method: init?.method, body: init?.body });

          if (url.startsWith("/api/v1/auth/session/csrf")) {
            return csrfResponse();
          }

          if (init?.method === "POST") {
            return jsonResponse(201, wire);
          }

          return jsonResponse(200, url.startsWith("/api/v1/rides?") ? [wire] : []);
        },
      );
      const transport = new ApiClient({ fetcher });
      const service = new RideService(
        new RideClient(transport),
        new DriverLookupClient(transport),
      );
      const { user } = renderRides({ service });

      await openCreate(user);
      await user.type(
        screen.getByLabelText(/Телефон на клиента/),
        "+359 888 123 456",
      );
      await user.type(
        screen.getByLabelText(/Адрес за вземане/),
        "ул. Димитър Благоев 12",
      );
      await user.type(
        screen.getByLabelText(/Дестинация/),
        "ЖП гара Димитровград",
      );
      await user.click(
        screen.getByRole("button", { name: ridesCopy.create.submit }),
      );

      expect(await screen.findByText(/създадена/)).toBeVisible();

      const post = requests.find((request) => request.method === "POST");

      expect(post?.url).toBe("/api/v1/rides");
      expect(JSON.parse(String(post?.body))).toEqual({
        phoneNumber: "+359888123456",
        pickupAddress: "ул. Димитър Благоев 12",
        destinationAddress: "ЖП гара Димитровград",
      });
    });

    it("offers normal rides and shows business as unavailable", async () => {
      const { user } = renderRides();

      await openCreate(user);

      expect(screen.getByRole("radio", { name: /Обикновена/ })).toBeChecked();
      expect(screen.getByRole("radio", { name: /Бизнес/ })).toBeDisabled();
      expect(
        screen.getByText(ridesCopy.form.businessUnavailable),
      ).toBeVisible();
      expect(screen.getByText(ridesCopy.form.distanceNone)).toBeVisible();
      expect(screen.getByText("+359")).toBeVisible();
      expect(
        screen.queryByLabelText(new RegExp(ridesCopy.form.driver)),
      ).not.toBeInTheDocument();
    });

    it("creates a ride and confirms only after the server answers", async () => {
      const pending = deferred<typeof pendingRide>();
      const create = vi.fn().mockReturnValue(pending.promise);
      const { api, user } = renderRides({ rides: { create } });

      await openCreate(user);
      await fillCreateForm(user);
      await user.click(
        screen.getByRole("button", { name: ridesCopy.create.submit }),
      );

      expect(create).toHaveBeenCalledOnce();
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "NORMAL",
          phone: "888 123 456",
          pickupAddress: "ул. Димитър Благоев 12",
          destinationAddress: "ЖП гара Димитровград",
        }),
      );
      expect(
        screen.getByRole("button", { name: ridesCopy.create.pending }),
      ).toBeDisabled();
      expect(screen.getByText(ridesCopy.notices.pendingTitle)).toBeVisible();
      expect(
        screen.queryByText(ridesCopy.notices.created("001049")),
      ).not.toBeInTheDocument();

      pending.resolve({ ...pendingRide, id: "aaaaaaaaaaaaaaaaaa001049" });

      expect(
        await screen.findByText(ridesCopy.notices.created("001049")),
      ).toBeVisible();
      expect(
        screen.getByText(ridesCopy.notices.createdBody(ridesCopy.statuses.PENDING)),
      ).toBeVisible();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.queryByText(ridesCopy.notices.pendingTitle)).not.toBeInTheDocument();
      expect(api.list).toHaveBeenCalledTimes(2);
    });

    it("does not send the request twice when submitted again while pending", async () => {
      const pending = deferred<typeof pendingRide>();
      const create = vi.fn().mockReturnValue(pending.promise);
      const { user } = renderRides({ rides: { create } });

      await openCreate(user);
      await fillCreateForm(user);

      const submit = screen.getByRole("button", {
        name: ridesCopy.create.submit,
      });

      await user.click(submit);
      await user.click(screen.getByRole("button", { name: ridesCopy.create.pending }));
      await user.keyboard("{Enter}");

      expect(create).toHaveBeenCalledOnce();

      pending.resolve(pendingRide);
      await screen.findByText(ridesCopy.notices.created("001048"));
    });

    it("shows field errors, keeps what was typed and calls nothing", async () => {
      const { api, user } = renderRides();

      await openCreate(user);
      await user.type(screen.getByLabelText(/Телефон на клиента/), "88 12");
      await user.type(
        screen.getByLabelText(/Адрес за вземане/),
        "ул. Димитър Благоев 12",
      );
      await user.click(
        screen.getByRole("button", { name: ridesCopy.create.submit }),
      );

      const dialog = screen.getByRole("dialog");
      const phone = within(dialog).getByLabelText(/Телефон на клиента/);

      expect(
        within(dialog).getByText(ridesCopy.create.failedSummary),
      ).toBeVisible();
      expect(within(dialog).getByText("Въведете валиден номер", { exact: false })).toBeVisible();
      expect(
        within(dialog).getByText(
          "Въведете адрес на дестинация.",
        ),
      ).toBeVisible();
      expect(phone).toHaveAttribute("aria-invalid", "true");
      expect(phone).toHaveAccessibleDescription(/Въведете валиден номер/);
      expect(phone).toHaveFocus();
      expect(phone).toHaveValue("88 12");
      expect(within(dialog).getByLabelText(/Адрес за вземане/)).toHaveValue(
        "ул. Димитър Благоев 12",
      );
      expect(api.create).not.toHaveBeenCalled();
    });

    it("clears a field error as soon as the field is edited", async () => {
      const { user } = renderRides();

      await openCreate(user);
      await user.click(
        screen.getByRole("button", { name: ridesCopy.create.submit }),
      );

      expect(screen.getByText("Въведете телефон на клиента.")).toBeVisible();

      await user.type(screen.getByLabelText(/Телефон на клиента/), "8");

      expect(
        screen.queryByText("Въведете телефон на клиента."),
      ).not.toBeInTheDocument();
    });

    it("keeps the entered data and retries after a failed save", async () => {
      const create = vi
        .fn()
        .mockRejectedValueOnce(new ApiError(503))
        .mockResolvedValue({ ...pendingRide, id: "aaaaaaaaaaaaaaaaaa001049" });
      const { user } = renderRides({ rides: { create } });

      await openCreate(user);
      await fillCreateForm(user);
      await user.click(
        screen.getByRole("button", { name: ridesCopy.create.submit }),
      );

      const alert = await screen.findByRole("alert");

      expect(alert).toHaveTextContent(rideFailureText.unavailable);
      expect(screen.getByLabelText(/Телефон на клиента/)).toHaveValue(
        "888 123 456",
      );
      expect(
        screen.queryByText(ridesCopy.notices.created("001049")),
      ).not.toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: ridesCopy.create.submit }),
      );

      expect(
        await screen.findByText(ridesCopy.notices.created("001049")),
      ).toBeVisible();
      expect(create).toHaveBeenCalledTimes(2);
    });

    it("explains an offline failure without losing the form", async () => {
      const { user } = renderRides({
        rides: { create: vi.fn().mockRejectedValue(new ApiError(0)) },
      });

      await openCreate(user);
      await fillCreateForm(user);
      await user.click(
        screen.getByRole("button", { name: ridesCopy.create.submit }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        rideFailureText.offline,
      );
      expect(screen.getByRole("dialog")).toBeVisible();
    });

    it("clears the filter and returns to the first page after creating", async () => {
      const { api, user } = renderRides({ path: "/rides?status=REJECTED&page=1" });

      await openCreate(user);
      await fillCreateForm(user);
      await user.click(
        screen.getByRole("button", { name: ridesCopy.create.submit }),
      );

      await screen.findByText(ridesCopy.notices.created("001049"));

      await waitFor(() =>
        expect(api.list).toHaveBeenLastCalledWith(
          {},
          0,
          expect.any(AbortSignal),
        ),
      );
    });

    it("uses address proposals when a provider is available", async () => {
      const suggestAddresses = vi.fn().mockResolvedValue([
        { id: "1", label: "гр. Хасково, бул. Съединение 52" },
      ]);
      const { api, user } = renderRides({ rides: { suggestAddresses } });

      await openCreate(user);
      await user.type(screen.getByLabelText(/Телефон на клиента/), "888123456");
      await user.type(
        screen.getByLabelText(/Адрес за вземане/),
        "ул. Димитър Благоев 12",
      );
      await user.type(screen.getByLabelText(/Дестинация/), "Хасково");
      await user.click(
        await screen.findByRole("option", { name: /Съединение 52/ }),
      );

      expect(screen.getByLabelText(/Дестинация/)).toHaveValue(
        "гр. Хасково, бул. Съединение 52",
      );

      await user.click(
        screen.getByRole("button", { name: ridesCopy.create.submit }),
      );

      expect(api.create).toHaveBeenCalledWith(
        expect.objectContaining({
          destinationAddress: "гр. Хасково, бул. Съединение 52",
        }),
      );
    });
  });

  describe("business rides (once the API supports them)", () => {
    const capabilities = {
      rideType: true,
      estimatedDistance: true,
      driverOnCreate: true,
      driverNotifications: false,
    };

    it("requires a driver, takes a planned period and makes the rest optional", async () => {
      const create = vi.fn().mockResolvedValue({
        ...pendingRide,
        id: "aaaaaaaaaaaaaaaaaa001049",
      });
      const { user } = renderRides({ rides: { capabilities, create } });

      await screen.findByRole("table");
      await user.click(screen.getByRole("button", { name: ridesCopy.newRide }));
      await user.click(screen.getByRole("radio", { name: /Бизнес/ }));
      await user.click(
        screen.getByRole("button", { name: ridesCopy.create.submit }),
      );

      expect(screen.getByText("Изберете шофьор.")).toBeVisible();
      expect(create).not.toHaveBeenCalled();
      expect(screen.getByText(ridesCopy.form.businessNote)).toBeVisible();
      expect(
        screen.getByLabelText(new RegExp(ridesCopy.form.plannedFrom)),
      ).toBeVisible();

      await user.selectOptions(
        screen.getByRole("combobox", { name: /Шофьор/ }),
        "drv-petar",
      );
      await user.click(
        screen.getByRole("button", { name: ridesCopy.create.submit }),
      );

      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ type: "BUSINESS", driverId: "drv-petar" }),
      );
    });
  });

  describe("edit", () => {
    it("prefills the ride and saves the change", async () => {
      const update = vi.fn().mockResolvedValue(pendingRide);
      const { user } = renderRides({ rides: { update } });

      await screen.findByRole("table");
      await chooseAction(user, "001048", ridesCopy.menu.edit);

      const dialog = screen.getByRole("dialog", {
        name: ridesCopy.edit.title("001048"),
      });
      const destination = within(dialog).getByLabelText(/Дестинация/);

      expect(within(dialog).getByLabelText(/Телефон на клиента/)).toHaveValue(
        "888123456",
      );
      expect(destination).toHaveValue("ЖП гара Димитровград");
      expect(
        within(dialog).queryByText(ridesCopy.edit.addressNoticeSilent(undefined)),
      ).not.toBeInTheDocument();

      await user.clear(destination);
      await user.type(destination, "ул. Христо Ботев 8");
      await user.click(
        within(dialog).getByRole("button", { name: ridesCopy.edit.submit }),
      );

      expect(update).toHaveBeenCalledWith(
        pendingRide.id,
        expect.objectContaining({ destinationAddress: "ул. Христо Ботев 8" }),
      );
      expect(await screen.findByText(ridesCopy.notices.saved)).toBeVisible();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("tells the dispatcher the driver of an accepted ride is not notified by the system yet", async () => {
      const { user } = renderRides();

      await screen.findByRole("table");
      await chooseAction(user, "001047", ridesCopy.menu.edit);

      expect(
        await screen.findByText(ridesCopy.edit.addressNoticeSilent("Иван Петров")),
      ).toBeVisible();
      expect(
        screen.queryByText(ridesCopy.edit.addressNotice("Иван Петров")),
      ).not.toBeInTheDocument();
      expect(screen.getByText(ridesCopy.edit.driverHintUnavailable)).toBeVisible();
    });

    it("shows status and driver as read-only fields", async () => {
      const { user } = renderRides();

      await screen.findByRole("table");
      await chooseAction(user, "001047", ridesCopy.menu.edit);

      const dialog = screen.getByRole("dialog");
      const status = within(dialog).getByRole("group", {
        name: ridesCopy.details.status,
      });

      expect(within(status).getByText(ridesCopy.statuses.ACCEPTED)).toBeVisible();
      expect(
        within(dialog).getByRole("group", { name: ridesCopy.details.driver }),
      ).toBeVisible();
    });

    it("edits an accepted ride through the real service, sending only the editable fields", async () => {
      const wire = {
        id: acceptedRide.id,
        status: "ACCEPTED",
        phoneNumber: acceptedRide.phoneNumber,
        pickupAddress: acceptedRide.pickupAddress,
        destinationAddress: acceptedRide.destinationAddress,
        driverId: "drv-ivan",
        dispatcherId: "acc-dispatcher",
        createdAt: "2026-08-14T10:11:00",
      };
      const requests: { url: string; method?: string; body?: unknown }[] = [];
      const fetcher = vi.fn(
        async (input: RequestInfo | URL, init?: RequestInit) => {
          const url = String(input);

          requests.push({ url, method: init?.method, body: init?.body });

          if (url.startsWith("/api/v1/auth/session/csrf")) {
            return csrfResponse();
          }

          if (url.startsWith("/api/v1/rides?")) {
            return jsonResponse(200, [wire]);
          }

          if (url.startsWith("/api/v1/accounts?")) {
            return jsonResponse(200, [
              { id: "drv-ivan", email: "ivan@taxi.test", firstName: "Иван", lastName: "Петров", availability: "BUSY" },
            ]);
          }

          if (init?.method === "PUT") {
            return jsonResponse(200, { ...wire, destinationAddress: "ул. Нова 1" });
          }

          return jsonResponse(404);
        },
      );
      const transport = new ApiClient({ fetcher });
      const service = new RideService(
        new RideClient(transport),
        new DriverLookupClient(transport),
      );
      const { user } = renderRides({ service });

      await screen.findByRole("table");
      await chooseAction(user, "001047", ridesCopy.menu.edit);

      const destination = screen.getByLabelText(/Дестинация/);

      await user.clear(destination);
      await user.type(destination, "ул. Нова 1");
      await user.click(
        screen.getByRole("button", { name: ridesCopy.edit.submit }),
      );

      expect(await screen.findByText(ridesCopy.notices.saved)).toBeVisible();

      const put = requests.find((request) => request.method === "PUT");

      expect(put?.url).toBe(`/api/v1/rides/${acceptedRide.id}`);
      expect(JSON.parse(String(put?.body))).toEqual({
        phoneNumber: "+359877456789",
        pickupAddress: "бул. България 45",
        destinationAddress: "ул. Нова 1",
      });
    });

    it("offers a reload when another user changed the ride", async () => {
      const update = vi.fn().mockRejectedValue(new ApiError(409));
      const { api, user } = renderRides({ rides: { update } });

      await screen.findByRole("table");
      await chooseAction(user, "001048", ridesCopy.menu.edit);
      await user.click(
        screen.getByRole("button", { name: ridesCopy.edit.submit }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        rideFailureText.conflict,
      );
      expect(screen.queryByText(ridesCopy.notices.saved)).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: ridesCopy.reload }));

      await waitFor(() => expect(api.list).toHaveBeenCalledTimes(2));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("reject", () => {
    it("promises a driver notification only when the server sends one", async () => {
      const { user } = renderRides({
        rides: {
          capabilities: { ...NO_RIDE_CAPABILITIES, driverNotifications: true },
        },
      });

      await screen.findByRole("table");
      await chooseAction(user, "001047", ridesCopy.menu.reject);

      expect(
        await screen.findByText(ridesCopy.reject.notifiesDriver("Иван Петров")),
      ).toBeVisible();
      expect(
        screen.queryByText(ridesCopy.reject.notNotified),
      ).not.toBeInTheDocument();
    });

    it("dismisses with Назад without calling the API", async () => {
      const { api, user } = renderRides();

      await screen.findByRole("table");
      await chooseAction(user, "001047", ridesCopy.menu.reject);

      const dialog = screen.getByRole("dialog", {
        name: ridesCopy.reject.title,
      });

      expect(
        within(dialog).getByText(ridesCopy.reject.keepsAvailability),
      ).toBeVisible();
      expect(
        await within(dialog).findByText(ridesCopy.reject.notNotified),
      ).toBeVisible();
      expect(
        within(dialog).queryByRole("button", { name: ridesCopy.cancel }),
      ).not.toBeInTheDocument();

      await user.click(
        within(dialog).getByRole("button", { name: ridesCopy.back }),
      );

      expect(api.reject).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("rejects and confirms after the server answers", async () => {
      const pending = deferred<typeof acceptedRide>();
      const reject = vi.fn().mockReturnValue(pending.promise);
      const { user } = renderRides({ rides: { reject } });

      await screen.findByRole("table");
      await chooseAction(user, "001047", ridesCopy.menu.reject);
      await user.click(
        screen.getByRole("button", { name: ridesCopy.reject.confirm }),
      );

      expect(reject).toHaveBeenCalledWith(acceptedRide.id);
      expect(
        screen.getByRole("button", { name: ridesCopy.reject.pending }),
      ).toBeDisabled();
      expect(screen.queryByText(ridesCopy.notices.rejected)).not.toBeInTheDocument();

      pending.resolve({ ...acceptedRide, status: "REJECTED" });

      expect(await screen.findByText(ridesCopy.notices.rejected)).toBeVisible();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("stays open and explains a failed rejection", async () => {
      const { user } = renderRides({
        rides: { reject: vi.fn().mockRejectedValue(new ApiError(503)) },
      });

      await screen.findByRole("table");
      await chooseAction(user, "001047", ridesCopy.menu.reject);
      await user.click(
        screen.getByRole("button", { name: ridesCopy.reject.confirm }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        rideFailureText.unavailable,
      );
      expect(screen.getByRole("dialog")).toBeVisible();
      expect(screen.queryByText(ridesCopy.notices.rejected)).not.toBeInTheDocument();
    });

    it("rejects from the details footer and closes both dialogs", async () => {
      const { api, user } = renderRides();

      await screen.findByRole("table");
      await chooseAction(user, "001047", ridesCopy.menu.view);
      await user.click(
        screen.getByRole("button", { name: ridesCopy.menu.reject }),
      );
      await user.click(
        screen.getByRole("button", { name: ridesCopy.reject.confirm }),
      );

      expect(await screen.findByText(ridesCopy.notices.rejected)).toBeVisible();
      expect(api.reject).toHaveBeenCalledOnce();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("delete", () => {
    it("deletes permanently after confirmation", async () => {
      const { api, user } = renderRides();

      await screen.findByRole("table");
      await chooseAction(user, "001045", ridesCopy.menu.remove);

      const dialog = screen.getByRole("dialog", { name: ridesCopy.remove.title });

      expect(within(dialog).getByText(ridesCopy.remove.body)).toBeVisible();
      expect(within(dialog).getByText(/\+359 878 654 321/)).toBeVisible();

      await user.click(
        within(dialog).getByRole("button", { name: ridesCopy.remove.confirm }),
      );

      expect(api.remove).toHaveBeenCalledWith(rejectedRide.id);
      expect(await screen.findByText(ridesCopy.notices.removed)).toBeVisible();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      // The row that opened the dialog is gone, so focus lands on the page heading.
      await waitFor(() =>
        expect(
          screen.getByRole("heading", { name: ridesCopy.title }),
        ).toHaveFocus(),
      );
    });

    it("reports a ride that was already deleted and refreshes the list behind the dialog", async () => {
      const { api, user } = renderRides({
        rides: { remove: vi.fn().mockRejectedValue(new ApiError(404)) },
      });

      await screen.findByRole("table");
      await chooseAction(user, "001045", ridesCopy.menu.remove);
      await user.click(
        screen.getByRole("button", { name: ridesCopy.remove.confirm }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        rideFailureText.notFound,
      );
      expect(screen.queryByText(ridesCopy.notices.removed)).not.toBeInTheDocument();
      await waitFor(() => expect(api.list).toHaveBeenCalledTimes(2));
    });
  });

  describe("reopen (once the API supports it)", () => {
    it("confirms with the current status and reloads after success", async () => {
      const reopen = vi.fn().mockResolvedValue({ ...finishedRide, status: "PENDING" });
      const { api, user } = renderRides({ rides: { reopen } });

      await screen.findByRole("table");
      await chooseAction(user, "001046", ridesCopy.menu.reopen);

      const dialog = screen.getByRole("dialog", { name: ridesCopy.reopen.title });

      expect(
        within(dialog).getByText(ridesCopy.reopen.note(ridesCopy.statuses.FINISHED)),
      ).toBeVisible();

      await user.click(
        within(dialog).getByRole("button", { name: ridesCopy.reopen.confirm }),
      );

      expect(reopen).toHaveBeenCalledWith(finishedRide.id);
      expect(await screen.findByText(ridesCopy.notices.reopened)).toBeVisible();
      expect(api.list).toHaveBeenCalledTimes(2);
    });
  });

  describe("assign (once the API supports it)", () => {
    const held = new Map([["drv-ivan", acceptedRide.id]]);

    it("disables a driver who already holds an accepted ride and says why", async () => {
      const assign = vi.fn().mockResolvedValue({ ...pendingRide, status: "ACCEPTED", driverId: "drv-petar" });
      const { user } = renderRides({
        rides: { assign, acceptedAssignments: vi.fn().mockResolvedValue(held) },
      });

      await screen.findByRole("table");
      await chooseAction(user, "001048", ridesCopy.menu.assign);

      const dialog = screen.getByRole("dialog", { name: ridesCopy.assign.title });
      const blocked = await within(dialog).findByRole("radio", {
        name: /Иван Петров/,
      });

      expect(blocked).toBeDisabled();
      expect(blocked).toHaveAccessibleDescription(
        ridesCopy.assign.holdsRide("001047"),
      );
      expect(
        within(dialog).getByRole("radio", { name: /Георги Димитров/ }),
      ).toBeEnabled();
      expect(within(dialog).getByText(ridesCopy.availability.AVAILABLE)).toBeVisible();
      expect(within(dialog).getByText(ridesCopy.availability.OFFLINE)).toBeVisible();
      expect(within(dialog).getByText(ridesCopy.assign.availabilityNote)).toBeVisible();
      expect(
        within(dialog).getByRole("button", { name: ridesCopy.assign.title }),
      ).toBeDisabled();
    });

    it("assigns the chosen driver and confirms after the server answers", async () => {
      const assign = vi.fn().mockResolvedValue({ ...pendingRide, status: "ACCEPTED", driverId: "drv-petar" });
      const { user } = renderRides({
        rides: { assign, acceptedAssignments: vi.fn().mockResolvedValue(held) },
      });

      await screen.findByRole("table");
      await chooseAction(user, "001048", ridesCopy.menu.assign);
      await user.click(
        await screen.findByRole("radio", { name: /Петър Стоянов/ }),
      );
      await user.click(
        screen.getByRole("button", {
          name: ridesCopy.assign.submit("Петър Стоянов"),
        }),
      );

      expect(assign).toHaveBeenCalledWith(pendingRide.id, "drv-petar");
      expect(await screen.findByText(ridesCopy.notices.assigned)).toBeVisible();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("does not offer the ride's current driver again and filters by typing", async () => {
      const { user } = renderRides({
        rides: {
          assign: vi.fn(),
          acceptedAssignments: vi.fn().mockResolvedValue(held),
        },
      });

      await screen.findByRole("table");
      await chooseAction(user, "001047", ridesCopy.menu.reassign);

      const dialog = screen.getByRole("dialog", {
        name: ridesCopy.assign.reassignTitle,
      });

      expect(await within(dialog).findByRole("radio", { name: /Иван Петров/ })).toBeDisabled();
      expect(within(dialog).getByText(ridesCopy.assign.currentDriver, { selector: ".tag" })).toBeVisible();
      expect(
        within(dialog).queryByText(ridesCopy.assign.holdsRide("001047")),
      ).not.toBeInTheDocument();

      await user.type(
        within(dialog).getByRole("searchbox", { name: ridesCopy.assign.searchLabel }),
        "георги",
      );

      expect(
        within(dialog).queryByRole("radio", { name: /Петър Стоянов/ }),
      ).not.toBeInTheDocument();
      expect(
        within(dialog).getByRole("radio", { name: /Георги Димитров/ }),
      ).toBeVisible();
    });

    it("reports a lookup failure inside the dialog and retries", async () => {
      // The first call is the page's own name lookup; the dialog's lookup is the second.
      const drivers = vi
        .fn()
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(new ApiError(403))
        .mockResolvedValue([]);
      const { user } = renderRides({
        rides: { assign: vi.fn(), drivers },
      });

      await screen.findByRole("table");
      await chooseAction(user, "001048", ridesCopy.menu.assign);

      expect(
        await within(screen.getByRole("dialog")).findByRole("alert"),
      ).toHaveTextContent(ridesCopy.assign.failed);

      await user.click(screen.getByRole("button", { name: ridesCopy.assign.retry }));

      expect(await screen.findByText(ridesCopy.assign.none)).toBeVisible();
    });

    it("shows a conflict from the server inside the dialog", async () => {
      const assign = vi.fn().mockRejectedValue(new ApiError(409));
      const { user } = renderRides({ rides: { assign } });

      await screen.findByRole("table");
      await chooseAction(user, "001048", ridesCopy.menu.assign);
      await user.click(
        await screen.findByRole("radio", { name: /Петър Стоянов/ }),
      );
      await user.click(
        screen.getByRole("button", {
          name: ridesCopy.assign.submit("Петър Стоянов"),
        }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        ridesCopy.assign.conflict,
      );
      expect(screen.queryByText(ridesCopy.notices.assigned)).not.toBeInTheDocument();
    });
  });
});
