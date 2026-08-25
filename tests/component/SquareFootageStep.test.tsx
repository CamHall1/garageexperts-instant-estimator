// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SquareFootageStep } from "@/components/estimator/steps/SquareFootageStep";

describe("SquareFootageStep", () => {
  it("does not call onNext while typing (requires explicit Next click)", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    render(<SquareFootageStep initialValue={null} onNext={onNext} onBack={() => {}} />);

    await user.type(screen.getByLabelText(/garage square footage/i), "500");
    expect(onNext).not.toHaveBeenCalled();
  });

  it("submits the normalized value on Next", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    render(<SquareFootageStep initialValue={null} onNext={onNext} onBack={() => {}} />);

    await user.type(screen.getByLabelText(/garage square footage/i), "1,250");
    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(onNext).toHaveBeenCalledWith(1250);
  });

  it("shows an inline error without clearing the entered value", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    render(<SquareFootageStep initialValue={null} onNext={onNext} onBack={() => {}} />);

    const input = screen.getByLabelText(/garage square footage/i);
    await user.type(input, "10001");
    await user.click(screen.getByRole("button", { name: /next/i }));

    expect(onNext).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(input).toHaveValue("10001");
  });

  it("calls onBack when Back is clicked", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<SquareFootageStep initialValue={null} onNext={() => {}} onBack={onBack} />);
    await user.click(screen.getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalled();
  });
});
