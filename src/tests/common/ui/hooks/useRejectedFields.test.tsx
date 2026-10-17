import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ApiFailure } from "../../../../common/domain/models/ApiFailure";
import { violationText } from "../../../../common/ui/assets/copy";
import { useRejectedFields } from "../../../../common/ui/hooks/useRejectedFields";

type Field = "phone" | "address";

const ORDER: readonly Field[] = ["phone", "address"];
const IDS: Record<Field, string> = { phone: "phone", address: "address" };
const FIELD_MAP = { phoneNumber: "phone", addressLine: "address" } as const;

function Harness({
  failure,
  onRejected,
}: {
  failure: ApiFailure | null;
  onRejected?: (first: Field) => void;
}) {
  const rejected = useRejectedFields<Field>({
    failure,
    fieldMap: FIELD_MAP,
    order: ORDER,
    ids: IDS,
    messages: { phone: { REQUIRED: "Нужен телефон." } },
    onRejected,
  });

  return (
    <div>
      <input id="phone" aria-label="phone" onChange={() => rejected.dismiss("phone")} />
      <p data-testid="phone">{rejected.messageFor("phone")}</p>
      <input id="address" aria-label="address" />
      <p data-testid="address">{rejected.messageFor("address")}</p>
    </div>
  );
}

const refused = (...violations: { field: string; code: string }[]): ApiFailure => ({
  kind: "invalid",
  violations,
});

describe("useRejectedFields", () => {
  it("shows the form wording where it has some and the shared default elsewhere", () => {
    render(
      <Harness
        failure={refused(
          { field: "phoneNumber", code: "REQUIRED" },
          { field: "addressLine", code: "TOO_LONG" },
        )}
      />,
    );

    expect(screen.getByTestId("phone")).toHaveTextContent("Нужен телефон.");
    expect(screen.getByTestId("address")).toHaveTextContent(violationText.TOO_LONG);
  });

  it("focuses the first refused field in form order and reports it", () => {
    const onRejected = vi.fn();

    render(
      <Harness
        failure={refused(
          { field: "addressLine", code: "REQUIRED" },
          { field: "phoneNumber", code: "REQUIRED" },
        )}
        onRejected={onRejected}
      />,
    );

    expect(screen.getByLabelText("phone")).toHaveFocus();
    expect(onRejected).toHaveBeenCalledWith("phone");
  });

  it("shows nothing for other failures or ones that named no field", () => {
    const { rerender } = render(<Harness failure={{ kind: "conflict" }} />);

    expect(screen.getByTestId("phone")).toBeEmptyDOMElement();

    rerender(<Harness failure={refused()} />);

    expect(screen.getByTestId("phone")).toBeEmptyDOMElement();
  });

  it("clears a refusal when its field is edited", async () => {
    const failure = refused({ field: "phoneNumber", code: "REQUIRED" });

    render(<Harness failure={failure} />);

    expect(screen.getByTestId("phone")).toHaveTextContent("Нужен телефон.");

    await userEvent.type(screen.getByLabelText("phone"), "8");

    expect(screen.getByTestId("phone")).toBeEmptyDOMElement();
  });

  it("clears a refusal when the failure goes away", () => {
    const failure = refused({ field: "phoneNumber", code: "REQUIRED" });
    const { rerender } = render(<Harness failure={failure} />);

    rerender(<Harness failure={null} />);

    expect(screen.getByTestId("phone")).toBeEmptyDOMElement();
  });
});
