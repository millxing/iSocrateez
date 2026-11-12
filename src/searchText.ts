/** Lowercases text and removes accents and apostrophes, so "Søren" matches "soren" and "Kant’s" matches "kants". */
export const fold = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ø/g, "o").replace(/[’']/g, "");

/** Splits a query or a text into folded words. */
export const searchWords = (text: string) => fold(text).split(/[^a-z0-9]+/).filter(Boolean);
