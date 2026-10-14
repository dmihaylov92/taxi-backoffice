import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { AddressSuggestion } from "../../../../rides/domain/models/AddressSuggestion";
import { ridesCopy } from "../../../../rides/ui/assets/rideCopy";
import { AddressField } from "../../../../rides/ui/components/AddressField";

const proposals: AddressSuggestion[] = [
  { id: "1", label: "гр. Хасково, бул. Съединение 52", context: "Хасково" },
  { id: "2", label: "гр. Хасково, бул. България 100", context: "Хасково" },
];

function Harness({
  suggest,
  onSubmit = () => undefined,
}: {
  suggest?: (text: string, signal: AbortSignal) => Promise<AddressSuggestion[]>;
  onSubmit?: () => void;
}) {
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <AddressField
        id="address"
        label="Дестинация"
        value={value}
        suggest={suggest}
        onChange={setValue}
      />
    </form>
  );
}

describe("AddressField", () => {
  it("is a plain text input without a provider", async () => {
    const user = userEvent.setup();

    render(<Harness />);

    const input = screen.getByLabelText("Дестинация");

    await user.type(input, "ул. Христо Ботев 8");

    expect(input).toHaveValue("ул. Христо Ботев 8");
    expect(input).not.toHaveAttribute("role", "combobox");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("proposes addresses while typing and fills the chosen one", async () => {
    const suggest = vi.fn().mockResolvedValue(proposals);
    const user = userEvent.setup();

    render(<Harness suggest={suggest} />);

    const input = screen.getByRole("combobox", { name: "Дестинация" });

    await user.type(input, "Хасково");

    expect(await screen.findByRole("option", { name: /Съединение 52/ })).toBeVisible();
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(ridesCopy.addresses.hint)).toBeVisible();
    expect(suggest).toHaveBeenLastCalledWith("Хасково", expect.any(AbortSignal));

    await user.click(screen.getByRole("option", { name: /България 100/ }));

    expect(input).toHaveValue("гр. Хасково, бул. България 100");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not search again for the address that was just chosen", async () => {
    const suggest = vi.fn().mockResolvedValue(proposals);
    const user = userEvent.setup();

    render(<Harness suggest={suggest} />);

    await user.type(screen.getByRole("combobox"), "Хасково");
    await user.click(await screen.findByRole("option", { name: /Съединение 52/ }));

    const calls = suggest.mock.calls.length;

    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(suggest).toHaveBeenCalledTimes(calls);
  });

  it("is operable by keyboard without submitting the form", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<Harness suggest={vi.fn().mockResolvedValue(proposals)} onSubmit={onSubmit} />);

    const input = screen.getByRole("combobox");

    await user.type(input, "Хасково");
    await screen.findByRole("listbox");
    await user.keyboard("{ArrowDown}{ArrowDown}");

    expect(input).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: /България 100/ }).id,
    );

    await user.keyboard("{Enter}");

    expect(input).toHaveValue("гр. Хасково, бул. България 100");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("closes the proposals on Escape", async () => {
    const user = userEvent.setup();

    render(<Harness suggest={vi.fn().mockResolvedValue(proposals)} />);

    await user.type(screen.getByRole("combobox"), "Хасково");
    await screen.findByRole("listbox");
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("says when nothing was found and when the search failed", async () => {
    const suggest = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockRejectedValue(new Error("down"));
    const user = userEvent.setup();

    render(<Harness suggest={suggest} />);

    const input = screen.getByRole("combobox");

    await user.type(input, "Хасково");

    expect(await screen.findByText(ridesCopy.addresses.none)).toBeVisible();

    await user.type(input, "а");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      ridesCopy.addresses.failed,
    );
    expect(input).toHaveValue("Хасковоа");
  });

  it("cancels the previous search when the text changes", async () => {
    const signals: AbortSignal[] = [];
    const suggest = vi.fn((_text: string, signal: AbortSignal) => {
      signals.push(signal);

      return new Promise<AddressSuggestion[]>(() => undefined);
    });
    const user = userEvent.setup();

    render(<Harness suggest={suggest} />);

    const input = screen.getByRole("combobox");

    await user.type(input, "Хаск");
    await waitFor(() => expect(signals).toHaveLength(1));
    await user.type(input, "о");
    await waitFor(() => expect(signals).toHaveLength(2));

    expect(signals[0].aborted).toBe(true);
  });
});
