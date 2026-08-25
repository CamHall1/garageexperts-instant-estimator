"use client";

import type { ReactNode } from "react";

export interface AnswerCardProps {
  name: string;
  value: string;
  label: string;
  description?: string;
  icon: ReactNode;
  checked: boolean;
  disabled?: boolean;
  onSelect: (value: string) => void;
}

/**
 * A large, keyboard-operable selectable card backed by a visually-hidden
 * native radio input, so screen readers announce it as an ordinary radio
 * button (state, position-in-set) even though it's fully custom styled.
 * The group's accessible name comes from the visible step heading via
 * aria-labelledby on the enclosing fieldset (see AnswerCardGroup).
 */
export function AnswerCard({
  name,
  value,
  label,
  description,
  icon,
  checked,
  disabled,
  onSelect,
}: AnswerCardProps) {
  return (
    <label
      className={[
        "group relative flex min-h-[44px] cursor-pointer items-start gap-4 rounded-2xl border-2 p-4 transition-colors duration-150 motion-reduce:transition-none sm:p-5",
        "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--ge-green)]",
        checked
          ? "border-[var(--ge-green)] bg-[var(--ge-green)]/5 shadow-[0_0_0_1px_var(--ge-green)]"
          : "border-[var(--ge-light-gray)] bg-white hover:border-[var(--ge-supporting-gray)]",
        disabled ? "cursor-not-allowed opacity-50" : "",
      ].join(" ")}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onSelect(value)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={[
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-current transition-colors motion-reduce:transition-none",
          checked
            ? "border-[var(--ge-green)] bg-[var(--ge-green)] text-white"
            : "border-[var(--ge-supporting-gray)] text-[var(--ge-dark-gray)] group-hover:border-[var(--ge-dark-gray)]",
        ].join(" ")}
      >
        {icon}
      </span>
      <span className="flex-1">
        <span className="block font-[var(--font-heading)] text-base font-semibold text-[var(--ge-dark-gray)] sm:text-lg">
          {label}
        </span>
        {description ? (
          <span className="mt-1 block text-sm text-[var(--ge-supporting-gray)]">{description}</span>
        ) : null}
      </span>
      <span
        aria-hidden="true"
        className="mt-1 h-6 w-6 shrink-0 rounded-full border-2 border-[var(--ge-supporting-gray)] peer-checked:border-[var(--ge-green)] peer-checked:bg-[var(--ge-green)]"
      />
    </label>
  );
}
