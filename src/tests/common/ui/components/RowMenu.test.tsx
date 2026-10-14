import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RowMenu } from "../../../../common/ui/components/RowMenu";

function renderMenu(onSelect = vi.fn()) {
  render(
    <RowMenu
      triggerLabel="Действия"
      onSelect={onSelect}
      items={[
        { action: "view", label: "Преглед", icon: "eye" },
        {
          action: "assign",
          label: "Назначи",
          disabledReason: "Все още не е налично",
        },
        { action: "remove", label: "Изтрий", tone: "danger", separated: true },
      ]}
    />,
  );

  return { onSelect, user: userEvent.setup() };
}

describe("RowMenu", () => {
  it("keeps an unavailable item visible, described and inert", async () => {
    const { onSelect, user } = renderMenu();

    await user.click(screen.getByRole("button", { name: "Действия" }));

    const assign = screen.getByRole("menuitem", { name: "Назначи" });

    expect(assign).toHaveAttribute("aria-disabled", "true");
    expect(assign).toHaveAccessibleDescription("Все още не е налично");

    await user.click(assign);

    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole("menu")).toBeVisible();
  });

  it("reaches the unavailable item by keyboard", async () => {
    const { user } = renderMenu();

    await user.click(screen.getByRole("button", { name: "Действия" }));
    await user.keyboard("{ArrowDown}");

    expect(screen.getByRole("menuitem", { name: "Назначи" })).toHaveFocus();
  });

  it("separates the destructive item and still selects available ones", async () => {
    const { onSelect, user } = renderMenu();

    await user.click(screen.getByRole("button", { name: "Действия" }));

    expect(screen.getByRole("separator")).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "Изтрий" }));

    expect(onSelect).toHaveBeenCalledWith("remove");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
