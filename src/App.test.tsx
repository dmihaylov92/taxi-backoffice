import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { App } from "./App";
import { AuthError, type AuthPort } from "./auth/contract";
import { bg } from "./auth/copy";
import { feedback, validate } from "./auth/validation";
const identity = {
  id: "fixture-user",
  email: "staff@example.test",
  roles: ["DISPATCHER"] as ["DISPATCHER"],
};
function setup(
  path = "/login",
  overrides: Partial<AuthPort> = {},
  token?: string,
) {
  const api: AuthPort = {
    login: vi.fn().mockResolvedValue(identity),
    forgot: vi.fn().mockResolvedValue(undefined),
    reset: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
  render(
    <MemoryRouter initialEntries={[path]}>
      <App api={api} linkToken={token} />
    </MemoryRouter>,
  );
  return { api, user: userEvent.setup() };
}
async function fillLogin(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(bg.email), identity.email);
  await user.type(screen.getByLabelText(bg.password, { exact: true }), "short");
  await user.click(screen.getByRole("button", { name: bg.login }));
}
describe("authentication UI with mocked port (not live integration)", () => {
  it("accepts short existing password, resolves identity and logs out", async () => {
    const { user, api } = setup();
    await fillLogin(user);
    expect(
      await screen.findByRole("heading", { name: bg.authenticated }),
    ).toBeVisible();
    expect(api.login).toHaveBeenCalledWith(identity.email, "short");
    await user.click(screen.getByRole("button", { name: bg.logout }));
    expect(await screen.findByText(bg.signedOut)).toBeVisible();
    expect(api.logout).toHaveBeenCalledOnce();
  });
  it("denies private route before login", () => {
    setup("/authenticated");
    expect(screen.getByRole("button", { name: bg.login })).toBeVisible();
  });
  it("generic login failure preserves email, clears secret and focuses alert", async () => {
    const { user } = setup("/login", {
      login: vi.fn().mockRejectedValue(new AuthError(401)),
    });
    await fillLogin(user);
    expect(await screen.findByRole("alert")).toHaveTextContent(bg.credentials);
    expect(screen.getByRole("alert")).toHaveFocus();
    expect(screen.getByLabelText(bg.email)).toHaveValue(identity.email);
    expect(screen.getByLabelText(bg.password, { exact: true })).toHaveValue("");
  });
  it("focuses first invalid field and toggles password without losing value", async () => {
    const { user, api } = setup();
    await user.click(screen.getByRole("button", { name: bg.login }));
    expect(screen.getByLabelText(bg.email)).toHaveFocus();
    expect(api.login).not.toHaveBeenCalled();
    await user.type(
      screen.getByLabelText(bg.password, { exact: true }),
      " secret ",
    );
    await user.click(
      screen.getByRole("button", { name: `${bg.show}: ${bg.password}` }),
    );
    expect(screen.getByLabelText(bg.password, { exact: true })).toHaveAttribute(
      "type",
      "text",
    );
    expect(screen.getByLabelText(bg.password, { exact: true })).toHaveValue(
      " secret ",
    );
  });
  it("blocks duplicate submissions while awaiting server", async () => {
    let resolve!: (value: typeof identity) => void;
    const { user, api } = setup("/login", {
      login: vi.fn().mockReturnValue(
        new Promise((r) => {
          resolve = r;
        }),
      ),
    });
    await fillLogin(user);
    expect(screen.getByRole("button", { name: bg.pending })).toBeDisabled();
    expect(api.login).toHaveBeenCalledOnce();
    resolve(identity);
    await screen.findByText(bg.authenticatedSub);
  });
  it("renders conditional recovery confirmation without inbox-delivery claim", async () => {
    const { user, api } = setup("/forgot-password");
    await user.type(screen.getByLabelText(bg.email), "unknown@example.test");
    await user.click(screen.getByRole("button", { name: bg.send }));
    expect(
      await screen.findByRole("heading", { name: bg.mailTitle }),
    ).toHaveFocus();
    expect(screen.getByText(bg.mailSafe)).toBeVisible();
    expect(api.forgot).toHaveBeenCalledWith("unknown@example.test");
  });
  it.each(["/reset-password", "/set-password"])(
    "missing link recovery on %s",
    (path) => {
      setup(path);
      expect(screen.getByRole("heading", { name: bg.missing })).toBeVisible();
      expect(screen.queryByLabelText(bg.password)).toBeNull();
    },
  );
  it.each(["/reset-password", "/set-password"])(
    "saves password via shared contract on %s",
    async (path) => {
      const { user, api } = setup(path, {}, "synthetic-token");
      await user.type(
        screen.getByLabelText(bg.password, { exact: true }),
        " twelve chars ",
      );
      await user.type(screen.getByLabelText(bg.confirm), " twelve chars ");
      await user.click(screen.getByRole("button", { name: bg.save }));
      expect(
        await screen.findByRole("heading", { name: bg.saved }),
      ).toBeVisible();
      expect(api.reset).toHaveBeenCalledWith(
        "synthetic-token",
        " twelve chars ",
      );
      expect(api.login).not.toHaveBeenCalled();
    },
  );
  it.each([401, 409, 503, 0])(
    "freezes unsafe same-link resubmit after %s",
    async (status) => {
      const { user } = setup(
        "/reset-password",
        { reset: vi.fn().mockRejectedValue(new AuthError(status)) },
        "synthetic-token",
      );
      await user.type(
        screen.getByLabelText(bg.password, { exact: true }),
        "long-password",
      );
      await user.type(screen.getByLabelText(bg.confirm), "long-password");
      await user.click(screen.getByRole("button", { name: bg.save }));
      await waitFor(() =>
        expect(screen.getByRole("button", { name: bg.save })).toBeDisabled(),
      );
      expect(screen.getByRole("link", { name: bg.newLink })).toHaveAttribute(
        "href",
        "/forgot-password",
      );
    },
  );
  it("distinguishes local-only signout", async () => {
    const { user } = setup("/login", {
      logout: vi.fn().mockRejectedValue(new Error("network")),
    });
    await fillLogin(user);
    await user.click(await screen.findByRole("button", { name: bg.logout }));
    expect(await screen.findByText(bg.localSignout)).toBeVisible();
  });
});
describe("validation and contract mapping", () => {
  it("counts UTF-16 and UTF-8; allows paste, spaces and short login", () => {
    expect(validate("login", identity.email, "short", "")).toEqual({});
    expect(validate("reset", "", "😀".repeat(18), "😀".repeat(18))).toEqual({});
    expect(
      validate("reset", "", "я".repeat(37), "я".repeat(37)),
    ).toHaveProperty("password");
    expect(validate("reset", "", "123456789012", "different")).toHaveProperty(
      "confirm",
    );
  });
  it.each([400, 403, 413, 429])(
    "maps %s without server error echo",
    (status) => {
      expect(
        feedback(new AuthError(status, "PRIVATE_SERVER_MESSAGE"), "login").text,
      ).not.toContain("PRIVATE_SERVER_MESSAGE");
    },
  );
});
