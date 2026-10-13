import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { App } from "../../../../App";
import type { AccountApi } from "../../../../accounts/domain/services/AccountService";
import { accountFailureText, accountsCopy } from "../../../../accounts/ui/assets/copy";
import type { AuthApi } from "../../../../auth/domain/services/AuthService";
import { bg } from "../../../../auth/ui/assets/copy";
import { ApiError } from "../../../../common/domain/models/ApiError";
import { admin, dispatcher, driver } from "../../fixtures";

const adminIdentity = {
  id: admin.id,
  email: admin.email,
  roles: ["ADMIN"] as ["ADMIN"],
};

function renderAccounts({
  accounts = {},
  identity = adminIdentity,
  path = "/accounts",
}: {
  accounts?: Partial<AccountApi>;
  identity?: { id: string; email: string; roles: ("ADMIN" | "DISPATCHER")[] };
  path?: string;
} = {}) {
  const api: AccountApi = {
    list: vi.fn().mockResolvedValue({ items: [driver, dispatcher, admin], hasNext: false }),
    create: vi.fn().mockResolvedValue(driver),
    update: vi.fn().mockResolvedValue(driver),
    deactivate: vi.fn().mockResolvedValue({ ...driver, status: "DISABLED" }),
    remove: vi.fn().mockResolvedValue(undefined),
    resendInvitation: vi.fn().mockResolvedValue(driver),
    ...accounts,
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
      <App auth={auth} accounts={api} />
    </MemoryRouter>,
  );

  return { api, auth, user: userEvent.setup() };
}

async function openMenu(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
  item: string,
) {
  await user.click(
    await screen.findByRole("button", { name: accountsCopy.actionsFor(name) }),
  );
  await user.click(screen.getByRole("menuitem", { name: item }));
}

describe("AccountsPage (mocked account port, not live integration)", () => {
  it("lists accounts and gives no actions on the signed-in administrator", async () => {
    renderAccounts();

    const table = await screen.findByRole("table", {
      name: accountsCopy.tableCaption,
    });

    expect(within(table).getByText("Иван Петров")).toBeVisible();
    expect(within(table).getByText("maria@taxi.test")).toBeVisible();
    expect(within(table).getAllByText(accountsCopy.statuses.ACTIVE)).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: accountsCopy.actionsFor("Иван Петров") }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: accountsCopy.actionsFor("Админ") }),
    ).not.toBeInTheDocument();
  });

  it("sends non-administrators to the holding page", async () => {
    renderAccounts({
      identity: { id: "x", email: "d@taxi.test", roles: ["DISPATCHER"] },
    });

    expect(
      await screen.findByRole("heading", { name: bg.authenticated }),
    ).toBeVisible();
  });

  it("shows the empty state and opens the create dialog from it", async () => {
    const { user } = renderAccounts({
      accounts: { list: vi.fn().mockResolvedValue({ items: [], hasNext: false }) },
    });

    expect(await screen.findByText(accountsCopy.emptyTitle)).toBeVisible();

    const buttons = screen.getAllByRole("button", { name: accountsCopy.newAccount });
    await user.click(buttons[buttons.length - 1]);

    expect(
      screen.getByRole("dialog", { name: accountsCopy.create.title }),
    ).toBeVisible();
  });

  it("shows a retryable error when the list cannot be loaded", async () => {
    const list = vi
      .fn()
      .mockRejectedValueOnce(new ApiError(503))
      .mockResolvedValue({ items: [driver], hasNext: false });
    const { user } = renderAccounts({ accounts: { list } });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      accountsCopy.errorBody,
    );

    await user.click(screen.getByRole("button", { name: accountsCopy.retry }));

    expect(await screen.findByText("Иван Петров")).toBeVisible();
    expect(list).toHaveBeenCalledTimes(2);
  });

  it("signs out with the session notice when the API rejects the session", async () => {
    renderAccounts({
      accounts: { list: vi.fn().mockRejectedValue(new ApiError(401)) },
    });

    expect(await screen.findByText(bg.session)).toBeVisible();
    expect(screen.getByRole("button", { name: bg.login })).toBeVisible();
  });

  it("requests filtered pages from the API", async () => {
    const { api, user } = renderAccounts();

    await screen.findByText("Иван Петров");
    await user.type(
      screen.getByRole("searchbox", { name: accountsCopy.searchLabel }),
      "ivan",
    );

    await waitFor(() =>
      expect(api.list).toHaveBeenLastCalledWith(
        { text: "ivan", role: undefined, status: undefined },
        0,
        expect.any(AbortSignal),
      ),
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: accountsCopy.roleFilter }),
      "DRIVER",
    );

    await waitFor(() =>
      expect(api.list).toHaveBeenLastCalledWith(
        { text: "ivan", role: "DRIVER", status: undefined },
        0,
        expect.any(AbortSignal),
      ),
    );
  });

  it("pages forward only while the API reports another page", async () => {
    const list = vi
      .fn()
      .mockResolvedValueOnce({ items: [driver], hasNext: true })
      .mockResolvedValue({ items: [dispatcher], hasNext: false });
    const { user } = renderAccounts({ accounts: { list } });

    await screen.findByText("Иван Петров");
    expect(
      screen.getByRole("button", { name: accountsCopy.previous }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: accountsCopy.next }));

    expect(await screen.findByText("maria@taxi.test")).toBeVisible();
    expect(list).toHaveBeenLastCalledWith(
      { text: "", role: undefined, status: undefined },
      1,
      expect.any(AbortSignal),
    );
    expect(screen.getByRole("button", { name: accountsCopy.next })).toBeDisabled();
  });

  it("creates an account through the guided steps and confirms the invitation", async () => {
    const created = { ...driver, email: "new.driver@taxi.test" };
    const create = vi.fn().mockResolvedValue(created);
    const { api, user } = renderAccounts({ accounts: { create } });

    await screen.findByText("Иван Петров");
    await user.click(screen.getByRole("button", { name: accountsCopy.newAccount }));

    await user.click(screen.getByRole("button", { name: accountsCopy.continue }));
    expect(screen.getByLabelText(`${accountsCopy.fields.email} *`)).toHaveFocus();
    expect(
      screen.getByText("Въведете валиден имейл (до 254 знака)."),
    ).toBeVisible();

    await user.type(
      screen.getByLabelText(`${accountsCopy.fields.email} *`),
      "new.driver@taxi.test",
    );
    await user.click(screen.getByRole("button", { name: accountsCopy.continue }));

    await user.click(screen.getByRole("button", { name: accountsCopy.continue }));
    expect(screen.getByText("Изберете поне една роля.")).toBeVisible();

    await user.click(screen.getByLabelText(new RegExp(accountsCopy.roles.DRIVER)));
    await user.click(screen.getByRole("button", { name: accountsCopy.continue }));
    await user.click(
      screen.getByRole("button", { name: accountsCopy.create.submit }),
    );

    expect(
      await screen.findByText(
        accountsCopy.invitation.body("new.driver@taxi.test"),
      ),
    ).toBeVisible();
    expect(create).toHaveBeenCalledWith({
      email: "new.driver@taxi.test",
      firstName: "",
      lastName: "",
      roles: ["DRIVER"],
      status: "ACTIVE",
    });
    expect(api.list).toHaveBeenCalledTimes(2);
  });

  it("keeps the dialog open and explains a rejected save", async () => {
    const update = vi.fn().mockRejectedValue(new ApiError(409));
    const { user } = renderAccounts({ accounts: { update } });

    await openMenu(user, "Иван Петров", accountsCopy.menu.edit);
    await user.click(
      screen.getByRole("button", { name: accountsCopy.edit.submit }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      accountFailureText.conflict,
    );
    expect(
      screen.getByRole("dialog", { name: accountsCopy.edit.title }),
    ).toBeVisible();
  });

  it("saves edits and reloads the list", async () => {
    const { api, user } = renderAccounts();

    await openMenu(user, "Иван Петров", accountsCopy.menu.edit);
    await user.clear(screen.getByLabelText(accountsCopy.fields.firstName));
    await user.type(screen.getByLabelText(accountsCopy.fields.firstName), "Петър");
    await user.click(
      screen.getByRole("button", { name: accountsCopy.edit.submit }),
    );

    expect(await screen.findByText(accountsCopy.notices.saved)).toBeVisible();
    expect(api.update).toHaveBeenCalledWith(
      "acc-driver",
      expect.objectContaining({ firstName: "Петър", lastName: "Петров" }),
    );
    expect(api.list).toHaveBeenCalledTimes(2);
  });

  it("deletes only after confirmation", async () => {
    const { api, user } = renderAccounts();

    await openMenu(user, "Иван Петров", accountsCopy.menu.remove);

    expect(api.remove).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: accountsCopy.remove.confirm }),
    );

    expect(await screen.findByText(accountsCopy.notices.removed)).toBeVisible();
    expect(api.remove).toHaveBeenCalledWith("acc-driver");
  });

  it("deactivates an active account and resends invitations", async () => {
    const { api, user } = renderAccounts();

    await openMenu(user, "Иван Петров", accountsCopy.menu.deactivate);

    expect(await screen.findByText(accountsCopy.notices.deactivated)).toBeVisible();
    expect(api.deactivate).toHaveBeenCalledWith(driver);

    await openMenu(user, "Иван Петров", accountsCopy.menu.resend);

    expect(
      await screen.findByText(accountsCopy.invitation.body(driver.email)),
    ).toBeVisible();
    expect(api.resendInvitation).toHaveBeenCalledWith("acc-driver");
  });

  it("reports a failed row action without claiming success", async () => {
    const { user } = renderAccounts({
      accounts: { deactivate: vi.fn().mockRejectedValue(new ApiError(0)) },
    });

    await openMenu(user, "Иван Петров", accountsCopy.menu.deactivate);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      accountFailureText.offline,
    );
    expect(
      screen.queryByText(accountsCopy.notices.deactivated),
    ).not.toBeInTheDocument();
  });
});
