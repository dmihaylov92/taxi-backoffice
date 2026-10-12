import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { common } from "../../../../common/ui/assets/copy";
import { AuthError } from "../../../../auth/domain/models/AuthError";
import { bg } from "../../../../auth/ui/assets/copy";
import { fillLogin, identity, renderApp } from "../renderApp";

describe("LoginPage (mocked auth port, not live integration)", () => {
  it("accepts short existing password, resolves identity and logs out", async () => {
    const { user, api } = renderApp();

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
    renderApp("/authenticated");

    expect(screen.getByRole("button", { name: bg.login })).toBeVisible();
  });

  it("generic login failure preserves email, clears secret and focuses alert", async () => {
    const { user } = renderApp("/login", {
      login: vi.fn().mockRejectedValue(new AuthError(401)),
    });

    await fillLogin(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(bg.credentials);
    expect(screen.getByRole("alert")).toHaveFocus();
    expect(screen.getByLabelText(bg.email)).toHaveValue(identity.email);
    expect(screen.getByLabelText(bg.password, { exact: true })).toHaveValue("");
  });

  it("focuses first invalid field and toggles password without losing value", async () => {
    const { user, api } = renderApp();

    await user.click(screen.getByRole("button", { name: bg.login }));

    expect(screen.getByLabelText(bg.email)).toHaveFocus();
    expect(api.login).not.toHaveBeenCalled();

    await user.type(
      screen.getByLabelText(bg.password, { exact: true }),
      " secret ",
    );
    await user.click(
      screen.getByRole("button", { name: `${common.show}: ${bg.password}` }),
    );

    const password = screen.getByLabelText(bg.password, { exact: true });

    expect(password).toHaveAttribute("type", "text");
    expect(password).toHaveValue(" secret ");
  });

  it("blocks duplicate submissions while awaiting server", async () => {
    let resolve!: (value: typeof identity) => void;
    const { user, api } = renderApp("/login", {
      login: vi.fn().mockReturnValue(
        new Promise((settle) => {
          resolve = settle;
        }),
      ),
    });

    await fillLogin(user);

    expect(screen.getByRole("button", { name: bg.pending })).toBeDisabled();
    expect(api.login).toHaveBeenCalledOnce();

    resolve(identity);

    await screen.findByText(bg.authenticatedSub);
  });

  it("distinguishes local-only signout", async () => {
    const { user } = renderApp("/login", {
      logout: vi.fn().mockRejectedValue(new Error("network")),
    });

    await fillLogin(user);
    await user.click(await screen.findByRole("button", { name: bg.logout }));

    expect(await screen.findByText(bg.localSignout)).toBeVisible();
  });
});
