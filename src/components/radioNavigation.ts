import type { KeyboardEvent } from "react";

/** Roving keyboard selection for the existing button-based radio groups. */
export function navigateRadios(event: KeyboardEvent<HTMLElement>) {
  if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) return;
  const radios = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]'));
  const index = radios.indexOf(event.target as HTMLButtonElement);
  if (index < 0) return;
  event.preventDefault();
  const next = event.key === "Home" ? 0 : event.key === "End" ? radios.length - 1 :
    (index + (event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1) + radios.length) % radios.length;
  radios[next].focus();
  radios[next].click();
}
