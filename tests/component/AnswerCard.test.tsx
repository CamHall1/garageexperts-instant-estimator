// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnswerCard } from "@/components/estimator/AnswerCard";

describe("AnswerCard", () => {
  it("renders as a radio input with the given label", () => {
    render(
      <AnswerCard
        name="test-group"
        value="a"
        label="Option A"
        icon={<span />}
        checked={false}
        onSelect={() => {}}
      />,
    );
    const radio = screen.getByRole("radio", { name: /option a/i });
    expect(radio).toBeInTheDocument();
    expect(radio).not.toBeChecked();
  });

  it("reflects the checked prop", () => {
    render(
      <AnswerCard
        name="test-group"
        value="a"
        label="Option A"
        icon={<span />}
        checked
        onSelect={() => {}}
      />,
    );
    expect(screen.getByRole("radio", { name: /option a/i })).toBeChecked();
  });

  it("calls onSelect with the option's value on click", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <AnswerCard
        name="test-group"
        value="b"
        label="Option B"
        icon={<span />}
        checked={false}
        onSelect={onSelect}
      />,
    );
    await user.click(screen.getByRole("radio", { name: /option b/i }));
    expect(onSelect).toHaveBeenCalledWith("b");
  });

  it("is keyboard-operable via Space", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <AnswerCard
        name="test-group"
        value="c"
        label="Option C"
        icon={<span />}
        checked={false}
        onSelect={onSelect}
      />,
    );
    await user.tab();
    expect(screen.getByRole("radio", { name: /option c/i })).toHaveFocus();
    await user.keyboard(" ");
    expect(onSelect).toHaveBeenCalledWith("c");
  });

  it("does not fire onSelect when disabled", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <AnswerCard
        name="test-group"
        value="d"
        label="Option D"
        icon={<span />}
        checked={false}
        disabled
        onSelect={onSelect}
      />,
    );
    await user.click(screen.getByRole("radio", { name: /option d/i }));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
