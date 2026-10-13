import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Modal } from "../../../../common/ui/components/Modal";

function Harness({ initiallyBusy = false }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(initiallyBusy);
  const [failed, setFailed] = useState(false);

  function submit() {
    setBusy(true);
    window.setTimeout(() => {
      setFailed(true);
      setBusy(false);
    }, 20);
  }

  return (
    <>
      <button onClick={() => setOpen(true)}>open</button>
      {open && (
        <Modal title="Диалог" busy={busy} onClose={() => setOpen(false)}>
          <input aria-label="field" disabled={busy} />
          {failed && <p role="alert">грешка</p>}
          <button disabled={busy} onClick={submit}>
            save
          </button>
        </Modal>
      )}
    </>
  );
}

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "open" }));
}

describe("Modal", () => {
  it("focuses the first field and returns focus to the opener on Escape", async () => {
    const user = userEvent.setup();

    render(<Harness />);
    await openDialog(user);

    expect(screen.getByLabelText("field")).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "open" })).toHaveFocus();
  });

  it("keeps Tab inside the dialog", async () => {
    const user = userEvent.setup();

    render(<Harness />);
    await openDialog(user);

    for (let index = 0; index < 5; index += 1) {
      await user.tab();
      expect(screen.getByRole("dialog")).toContainElement(
        document.activeElement as HTMLElement,
      );
    }
  });

  it("ignores Escape while busy and keeps focus on the panel", async () => {
    const user = userEvent.setup();

    render(<Harness initiallyBusy />);
    await openDialog(user);
    await user.keyboard("{Escape}");

    expect(screen.getByRole("dialog")).toBeVisible();
    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("moves focus to the alert when a busy submit fails", async () => {
    const user = userEvent.setup();

    render(<Harness />);
    await openDialog(user);
    await user.click(screen.getByRole("button", { name: "save" }));

    expect(screen.getByRole("dialog")).toHaveFocus();

    await waitFor(() => expect(screen.getByRole("alert")).toHaveFocus());
  });
});
