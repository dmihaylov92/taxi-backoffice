import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter } from "react-router";
import { App } from "../../../App";
import type { AuthApi } from "../../../auth/domain/services/AuthService";
import { bg } from "../../../auth/ui/assets/copy";

export const identity = {
  id: "fixture-user",
  email: "staff@example.test",
  roles: ["DRIVER"] as ["DRIVER"],
};

export function renderApp(
  path = "/login",
  overrides: Partial<AuthApi> = {},
  token?: string,
) {
  const api: AuthApi = {
    login: vi.fn().mockResolvedValue(identity),
    forgot: vi.fn().mockResolvedValue(undefined),
    reset: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(true),
    ...overrides,
  };

  render(
    <MemoryRouter initialEntries={[path]}>
      <App auth={api} linkToken={token} />
    </MemoryRouter>,
  );

  return { api, user: userEvent.setup() };
}

export async function fillLogin(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(bg.email), identity.email);
  await user.type(screen.getByLabelText(bg.password, { exact: true }), "short");
  await user.click(screen.getByRole("button", { name: bg.login }));
}
