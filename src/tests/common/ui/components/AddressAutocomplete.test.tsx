import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { AddressSearchApi } from "../../../../common/domain/services/AddressSearchService";
import type { AddressSelection } from "../../../../common/domain/models/AddressSelection";
import type { AddressSuggestion } from "../../../../common/domain/models/AddressSuggestion";
import { addressCopy } from "../../../../common/ui/assets/copy";
import { AddressAutocomplete } from "../../../../common/ui/components/AddressAutocomplete";
import { AddressSearchProvider } from "../../../../common/ui/components/AddressSearchProvider";

const proposals: AddressSuggestion[] = [
  { id: "1", label: "гр. Хасково, бул. Съединение 52", context: "Хасково" },
  { id: "2", label: "гр. Хасково, бул. България 100", context: "Хасково" },
];

function searchWith(overrides: Partial<AddressSearchApi> = {}): AddressSearchApi {
  return {
    debounceMs: 20,
    minLength: 3,
    search: vi.fn().mockResolvedValue(proposals),
    resolve: vi.fn(async (suggestion: AddressSuggestion) => ({
      label: suggestion.label,
      coordinates: { latitude: 41.93, longitude: 25.55 },
    })),
    ...overrides,
  };
}

function Harness({
  search,
  onSelect = () => undefined,
  onSubmit = () => undefined,
}: {
  search?: AddressSearchApi;
  onSelect?: (selection: AddressSelection) => void;
  onSubmit?: () => void;
}) {
  const [value, setValue] = useState("");

  return (
    <AddressSearchProvider search={search}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <AddressAutocomplete
          id="address"
          label="Дестинация"
          value={value}
          onChange={setValue}
          onSelect={onSelect}
        />
      </form>
    </AddressSearchProvider>
  );
}

describe("AddressAutocomplete", () => {
  it("is a plain text input without a provider", async () => {
    const user = userEvent.setup();

    render(<Harness />);

    const input = screen.getByLabelText("Дестинация");

    await user.type(input, "ул. Христо Ботев 8");

    expect(input).toHaveValue("ул. Христо Ботев 8");
    expect(input).not.toHaveAttribute("role", "combobox");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("proposes addresses once typing pauses and fills the chosen one", async () => {
    const search = searchWith();
    const user = userEvent.setup();

    render(<Harness search={search} />);

    const input = screen.getByRole("combobox", { name: "Дестинация" });

    await user.type(input, "Хасково");

    expect(await screen.findByRole("option", { name: /Съединение 52/ })).toBeVisible();
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(addressCopy.hint)).toBeVisible();
    expect(search.search).toHaveBeenLastCalledWith("Хасково", expect.any(AbortSignal));

    await user.click(screen.getByRole("option", { name: /България 100/ }));

    expect(input).toHaveValue("гр. Хасково, бул. България 100");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("waits for the configured pause before searching", async () => {
    const search = searchWith({ debounceMs: 150 });
    const user = userEvent.setup();

    render(<Harness search={search} />);

    await user.type(screen.getByRole("combobox"), "Хасково");

    expect(search.search).not.toHaveBeenCalled();

    await screen.findByRole("listbox");

    expect(search.search).toHaveBeenCalledTimes(1);
  });

  it("does not search for text shorter than the minimum", async () => {
    const search = searchWith();
    const user = userEvent.setup();

    render(<Harness search={search} />);

    await user.type(screen.getByRole("combobox"), "Ха");
    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(search.search).not.toHaveBeenCalled();
  });

  it("reports the place of the chosen address", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(<Harness search={searchWith()} onSelect={onSelect} />);

    await user.type(screen.getByRole("combobox"), "Хасково");
    await user.click(await screen.findByRole("option", { name: /Съединение 52/ }));

    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith({
        label: "гр. Хасково, бул. Съединение 52",
        coordinates: { latitude: 41.93, longitude: 25.55 },
      }),
    );
  });

  it("keeps the address and says so when its place cannot be found", async () => {
    const search = searchWith({ resolve: vi.fn().mockRejectedValue(new Error("down")) });
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(<Harness search={search} onSelect={onSelect} />);

    const input = screen.getByRole("combobox");

    await user.type(input, "Хасково");
    await user.click(await screen.findByRole("option", { name: /Съединение 52/ }));

    expect(await screen.findByText(addressCopy.noCoordinates)).toBeVisible();
    expect(input).toHaveValue("гр. Хасково, бул. Съединение 52");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("drops the place of a chosen address when the text is edited before it arrives", async () => {
    const onSelect = vi.fn();
    const search = searchWith({
      resolve: vi.fn(
        (suggestion: AddressSuggestion, signal: AbortSignal) =>
          new Promise<AddressSelection>((resolve) =>
            setTimeout(() => {
              if (!signal.aborted) {
                resolve({
                  label: suggestion.label,
                  coordinates: { latitude: 1, longitude: 2 },
                });
              }
            }, 50),
          ),
      ),
    });
    const user = userEvent.setup();

    render(<Harness search={search} onSelect={onSelect} />);

    const input = screen.getByRole("combobox");

    await user.type(input, "Хасково");
    await user.click(await screen.findByRole("option", { name: /Съединение 52/ }));
    await user.type(input, "!");
    await new Promise((resolve) => setTimeout(resolve, 120));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("does not search again for the address that was just chosen", async () => {
    const search = searchWith();
    const user = userEvent.setup();

    render(<Harness search={search} />);

    await user.type(screen.getByRole("combobox"), "Хасково");
    await user.click(await screen.findByRole("option", { name: /Съединение 52/ }));

    const calls = vi.mocked(search.search).mock.calls.length;

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(search.search).toHaveBeenCalledTimes(calls);
  });

  it("is operable by keyboard without submitting the form", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<Harness search={searchWith()} onSubmit={onSubmit} />);

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

    render(<Harness search={searchWith()} />);

    await user.type(screen.getByRole("combobox"), "Хасково");
    await screen.findByRole("listbox");
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("says when nothing was found and when the search failed", async () => {
    const search = searchWith({
      search: vi
        .fn()
        .mockResolvedValueOnce([])
        .mockRejectedValue(new Error("down")),
    });
    const user = userEvent.setup();

    render(<Harness search={search} />);

    const input = screen.getByRole("combobox");

    await user.type(input, "Хасково");

    expect(await screen.findByText(addressCopy.none)).toBeVisible();

    await user.type(input, "а");

    expect(await screen.findByRole("alert")).toHaveTextContent(addressCopy.failed);
    expect(input).toHaveValue("Хасковоа");
  });

  it("cancels the previous search when the text changes", async () => {
    const signals: AbortSignal[] = [];
    const search = searchWith({
      search: vi.fn((_text: string, signal: AbortSignal) => {
        signals.push(signal);

        return new Promise<AddressSuggestion[]>(() => undefined);
      }),
    });
    const user = userEvent.setup();

    render(<Harness search={search} />);

    const input = screen.getByRole("combobox");

    await user.type(input, "Хаск");
    await waitFor(() => expect(signals).toHaveLength(1));
    await user.type(input, "о");
    await waitFor(() => expect(signals).toHaveLength(2));

    expect(signals[0].aborted).toBe(true);
  });
});
