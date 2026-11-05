import type { KeyboardEvent } from "react";

/**
 * Roving keyboard selection for the button-based radio groups.
 * Left/Right move linearly; Up/Down move by visual row when the radios wrap into a grid.
 */
export function navigateRadios(event: KeyboardEvent<HTMLElement>) {
  if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) return;
  const radios = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]'));
  const index = radios.indexOf(event.target as HTMLButtonElement);
  if (index < 0) return;
  event.preventDefault();
  let next = event.key === "Home" ? 0 : event.key === "End" ? radios.length - 1 :
    (index + (event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1) + radios.length) % radios.length;
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    const byRow = rowNeighbour(radios, index, event.key === "ArrowDown" ? 1 : -1);
    if (byRow !== null) next = byRow;
  }
  radios[next].focus();
  radios[next].click();
}

function rowNeighbour(radios: HTMLElement[], index: number, direction: 1 | -1): number | null {
  const rects = radios.map((radio) => radio.getBoundingClientRect());
  const current = rects[index];
  const centre = (rect: DOMRect) => rect.left + rect.width / 2;
  const candidates = rects
    .map((rect, i) => ({ rect, i }))
    .filter(({ rect }) => direction > 0 ? rect.top > current.top + 2 : rect.top < current.top - 2);
  if (candidates.length === 0) return null;
  const rowTop = direction > 0
    ? Math.min(...candidates.map(({ rect }) => rect.top))
    : Math.max(...candidates.map(({ rect }) => rect.top));
  const row = candidates.filter(({ rect }) => Math.abs(rect.top - rowTop) <= 2);
  row.sort((a, b) => Math.abs(centre(a.rect) - centre(current)) - Math.abs(centre(b.rect) - centre(current)));
  return row[0].i;
}
