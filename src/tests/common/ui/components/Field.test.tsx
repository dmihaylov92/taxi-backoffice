import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Field } from "../../../../common/ui/components/Field";

describe("Field", () => {
  it("marks password wrappers so the reveal button is anchored to the input", () => {
    render(<Field id="secret" label="Парола" type="password" />);

    expect(screen.getByLabelText("Парола", { exact: true }).parentElement).toHaveClass(
      "input-wrap",
      "password",
    );
  });

  it("drops the icon and pads plainly when no icon is wanted", () => {
    render(<Field id="name" label="Име" icon={false} />);

    const wrap = screen.getByLabelText("Име").parentElement;

    expect(wrap).toHaveClass("input-wrap", "plain");
    expect(wrap?.querySelector(".input-icon")).toBeNull();
  });
});
