import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { AuthError } from "../../../../auth/domain/models/AuthError";
import { bg } from "../../../../auth/ui/assets/copy";
import { renderApp } from "../renderApp";

describe("ResetPasswordPage", () => {
  it.each(["/reset-password", "/set-password"])(
    "missing link recovery on %s",
    (path) => {
      renderApp(path);

      expect(screen.getByRole("heading", { name: bg.missing })).toBeVisible();
      expect(screen.queryByLabelText(bg.password)).toBeNull();
    },
  );

  it.each(["/reset-password", "/set-password"])(
    "saves password via shared contract on %s",
    async (path) => {
      const { user, api } = renderApp(path, {}, "synthetic-token");

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
      const { user } = renderApp(
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
});
