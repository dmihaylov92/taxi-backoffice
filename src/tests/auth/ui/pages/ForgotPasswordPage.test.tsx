import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { bg } from "../../../../auth/ui/assets/copy";
import { renderApp } from "../renderApp";

describe("ForgotPasswordPage", () => {
  it("renders conditional recovery confirmation without inbox-delivery claim", async () => {
    const { user, api } = renderApp("/forgot-password");

    await user.type(screen.getByLabelText(bg.email), "unknown@example.test");
    await user.click(screen.getByRole("button", { name: bg.send }));

    expect(
      await screen.findByRole("heading", { name: bg.mailTitle }),
    ).toHaveFocus();
    expect(screen.getByText(bg.mailSafe)).toBeVisible();
    expect(api.forgot).toHaveBeenCalledWith("unknown@example.test");
  });
});
