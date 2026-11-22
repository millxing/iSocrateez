/**
 * Rob's scores of the 40 thinkers on 10 dimensions, 0 to 10: the 6 moral foundations and 4 axes.
 * Source: docs/Philosophers.xlsx (2026-11-21). Each value is the mean of three models (Astra 6.2, Fable 5.2, Neon 5),
 * rounded to one decimal. Generated; do not edit by hand. Shown on the results page (Speaker tab and export) and
 * used by the verdict-check variants `hybrid10` and `hybrid10f`.
 */
export interface DimensionScores {
  care: number;
  fairness: number;
  loyalty: number;
  authority: number;
  sanctity: number;
  liberty: number;
  /** 0 = individual, 10 = collective */
  individualCollective: number;
  /** 0 = outcomes, 10 = principles */
  outcomesPrinciples: number;
  /** 0 = reason, 10 = intuition */
  reasonIntuition: number;
  /** 0 = everyone equally, 10 = my own people first */
  impartialPartial: number;
}

export const PHILOSOPHER_SCORES: Record<string, DimensionScores> = {
  "al-ghazali-islamic-ethics": { care: 7.0, fairness: 7.0, loyalty: 5.7, authority: 8.7, sanctity: 10.0, liberty: 2.3, individualCollective: 6.0, outcomesPrinciples: 8.3, reasonIntuition: 6.7, impartialPartial: 6.3 },
  "aristotle-virtue-ethics": { care: 5.7, fairness: 8.0, loyalty: 7.0, authority: 6.7, sanctity: 3.3, liberty: 4.0, individualCollective: 6.3, outcomesPrinciples: 5.0, reasonIntuition: 3.7, impartialPartial: 7.3 },
  "schopenhauer-compassion": { care: 10.0, fairness: 6.7, loyalty: 1.7, authority: 2.0, sanctity: 5.0, liberty: 3.3, individualCollective: 4.0, outcomesPrinciples: 4.3, reasonIntuition: 8.7, impartialPartial: 1.0 },
  "spinoza-rational-ethics": { care: 5.7, fairness: 6.0, loyalty: 3.3, authority: 3.3, sanctity: 3.3, liberty: 8.0, individualCollective: 3.7, outcomesPrinciples: 3.7, reasonIntuition: 0.3, impartialPartial: 2.3 },
  "gilligan-care-ethics": { care: 10.0, fairness: 5.7, loyalty: 5.7, authority: 2.0, sanctity: 1.3, liberty: 5.7, individualCollective: 7.3, outcomesPrinciples: 4.3, reasonIntuition: 7.7, impartialPartial: 7.7 },
  "confucius-role-ethics": { care: 7.7, fairness: 5.7, loyalty: 9.3, authority: 9.7, sanctity: 6.7, liberty: 1.7, individualCollective: 9.0, outcomesPrinciples: 7.3, reasonIntuition: 5.7, impartialPartial: 9.0 },
  "hume-sentimentalism": { care: 8.3, fairness: 7.3, loyalty: 5.7, authority: 4.7, sanctity: 1.0, liberty: 5.7, individualCollective: 6.0, outcomesPrinciples: 2.7, reasonIntuition: 9.0, impartialPartial: 6.3 },
  "diogenes-cynicism": { care: 3.3, fairness: 4.3, loyalty: 0.7, authority: 0.0, sanctity: 1.0, liberty: 9.3, individualCollective: 0.3, outcomesPrinciples: 6.7, reasonIntuition: 5.3, impartialPartial: 1.3 },
  "epictetus-stoicism": { care: 4.3, fairness: 6.0, loyalty: 5.7, authority: 6.3, sanctity: 5.0, liberty: 6.0, individualCollective: 3.0, outcomesPrinciples: 9.0, reasonIntuition: 1.3, impartialPartial: 3.0 },
  "epicurus-epicureanism": { care: 7.0, fairness: 6.0, loyalty: 6.3, authority: 1.7, sanctity: 1.3, liberty: 6.3, individualCollective: 2.3, outcomesPrinciples: 1.3, reasonIntuition: 3.0, impartialPartial: 7.3 },
  "nietzsche-perspectivism": { care: 1.3, fairness: 2.0, loyalty: 2.0, authority: 3.3, sanctity: 3.3, liberty: 7.7, individualCollective: 0.3, outcomesPrinciples: 4.0, reasonIntuition: 7.3, impartialPartial: 6.0 },
  "arendt-responsibility": { care: 5.0, fairness: 7.3, loyalty: 4.3, authority: 3.3, sanctity: 1.7, liberty: 9.0, individualCollective: 6.0, outcomesPrinciples: 6.3, reasonIntuition: 4.0, impartialPartial: 3.3 },
  "kant-deontology": { care: 5.0, fairness: 9.0, loyalty: 2.3, authority: 5.0, sanctity: 4.7, liberty: 8.0, individualCollective: 3.0, outcomesPrinciples: 10.0, reasonIntuition: 0.0, impartialPartial: 1.0 },
  "rousseau-general-will": { care: 7.7, fairness: 8.3, loyalty: 7.7, authority: 5.3, sanctity: 3.7, liberty: 8.3, individualCollective: 8.3, outcomesPrinciples: 6.7, reasonIntuition: 7.3, impartialPartial: 7.0 },
  "existentialism": { care: 5.0, fairness: 6.3, loyalty: 2.7, authority: 0.7, sanctity: 0.7, liberty: 9.7, individualCollective: 2.0, outcomesPrinciples: 5.0, reasonIntuition: 5.7, impartialPartial: 3.3 },
  "jesus-christian-ethics": { care: 10.0, fairness: 7.0, loyalty: 3.7, authority: 4.7, sanctity: 7.7, liberty: 5.3, individualCollective: 6.0, outcomesPrinciples: 7.3, reasonIntuition: 7.0, impartialPartial: 1.0 },
  "rawls-justice-as-fairness": { care: 6.7, fairness: 10.0, loyalty: 3.3, authority: 3.7, sanctity: 1.0, liberty: 9.3, individualCollective: 5.7, outcomesPrinciples: 8.3, reasonIntuition: 2.0, impartialPartial: 2.0 },
  "mill-utilitarianism": { care: 9.0, fairness: 7.7, loyalty: 2.3, authority: 2.0, sanctity: 1.3, liberty: 9.7, individualCollective: 4.7, outcomesPrinciples: 1.0, reasonIntuition: 2.0, impartialPartial: 0.7 },
  "moral-particularism": { care: 4.7, fairness: 4.7, loyalty: 3.3, authority: 1.7, sanctity: 2.0, liberty: 4.3, individualCollective: 5.0, outcomesPrinciples: 4.7, reasonIntuition: 7.7, impartialPartial: 5.0 },
  "bhagavad-gita-dharma": { care: 5.3, fairness: 5.3, loyalty: 6.7, authority: 9.3, sanctity: 9.3, liberty: 3.0, individualCollective: 6.7, outcomesPrinciples: 10.0, reasonIntuition: 5.3, impartialPartial: 4.7 },
  "laozi-daoism": { care: 7.0, fairness: 4.0, loyalty: 2.7, authority: 2.0, sanctity: 5.7, liberty: 8.0, individualCollective: 4.0, outcomesPrinciples: 4.3, reasonIntuition: 8.7, impartialPartial: 3.3 },
  "maimonides-jewish-ethics": { care: 8.0, fairness: 8.0, loyalty: 7.0, authority: 8.3, sanctity: 8.0, liberty: 4.0, individualCollective: 6.7, outcomesPrinciples: 8.0, reasonIntuition: 1.3, impartialPartial: 6.7 },
  "marcus-aurelius-stoicism": { care: 6.3, fairness: 7.3, loyalty: 8.0, authority: 7.3, sanctity: 5.7, liberty: 4.3, individualCollective: 7.3, outcomesPrinciples: 8.3, reasonIntuition: 2.0, impartialPartial: 3.3 },
  "king-beloved-community": { care: 9.3, fairness: 10.0, loyalty: 6.3, authority: 4.3, sanctity: 7.0, liberty: 9.7, individualCollective: 7.3, outcomesPrinciples: 8.3, reasonIntuition: 5.3, impartialPartial: 1.0 },
  "wollstonecraft-feminist-ethics": { care: 6.7, fairness: 9.3, loyalty: 4.0, authority: 2.0, sanctity: 3.3, liberty: 9.3, individualCollective: 3.0, outcomesPrinciples: 7.7, reasonIntuition: 1.0, impartialPartial: 2.0 },
  "mencius-confucianism": { care: 9.3, fairness: 6.7, loyalty: 8.0, authority: 7.3, sanctity: 5.7, liberty: 3.7, individualCollective: 8.0, outcomesPrinciples: 7.0, reasonIntuition: 8.0, impartialPartial: 8.7 },
  "gandhi-nonviolence": { care: 10.0, fairness: 8.3, loyalty: 5.7, authority: 3.7, sanctity: 8.7, liberty: 9.0, individualCollective: 6.7, outcomesPrinciples: 9.0, reasonIntuition: 6.3, impartialPartial: 3.0 },
  "singer-effective-ethics": { care: 10.0, fairness: 8.7, loyalty: 0.7, authority: 0.7, sanctity: 0.0, liberty: 5.0, individualCollective: 6.3, outcomesPrinciples: 0.0, reasonIntuition: 0.3, impartialPartial: 0.0 },
  "foot-natural-goodness": { care: 7.0, fairness: 7.7, loyalty: 4.7, authority: 3.3, sanctity: 2.3, liberty: 5.0, individualCollective: 5.3, outcomesPrinciples: 7.0, reasonIntuition: 3.3, impartialPartial: 5.0 },
  "plato-platonism": { care: 4.7, fairness: 8.0, loyalty: 6.7, authority: 9.0, sanctity: 7.0, liberty: 2.0, individualCollective: 8.3, outcomesPrinciples: 8.0, reasonIntuition: 1.0, impartialPartial: 6.3 },
  "seneca-stoicism": { care: 6.7, fairness: 6.3, loyalty: 5.3, authority: 5.3, sanctity: 4.3, liberty: 6.0, individualCollective: 4.0, outcomesPrinciples: 8.0, reasonIntuition: 2.0, impartialPartial: 3.0 },
  "buddha-buddhist-ethics": { care: 10.0, fairness: 5.7, loyalty: 3.0, authority: 3.7, sanctity: 7.7, liberty: 5.0, individualCollective: 4.7, outcomesPrinciples: 4.0, reasonIntuition: 5.0, impartialPartial: 0.7 },
  "socrates-examined-life": { care: 5.3, fairness: 8.0, loyalty: 5.3, authority: 4.7, sanctity: 5.7, liberty: 6.0, individualCollective: 3.3, outcomesPrinciples: 9.0, reasonIntuition: 1.3, impartialPartial: 4.3 },
  "kierkegaard-existential-faith": { care: 6.0, fairness: 3.7, loyalty: 2.3, authority: 5.3, sanctity: 9.0, liberty: 6.7, individualCollective: 0.3, outcomesPrinciples: 8.3, reasonIntuition: 8.0, impartialPartial: 2.3 },
  "scanlon-contractualism": { care: 6.7, fairness: 10.0, loyalty: 3.3, authority: 2.3, sanctity: 1.3, liberty: 6.7, individualCollective: 3.3, outcomesPrinciples: 8.0, reasonIntuition: 1.7, impartialPartial: 2.3 },
  "ubuntu-african-ethics": { care: 9.0, fairness: 7.7, loyalty: 9.3, authority: 5.3, sanctity: 4.3, liberty: 4.0, individualCollective: 10.0, outcomesPrinciples: 4.7, reasonIntuition: 6.7, impartialPartial: 7.3 },
  "aquinas-natural-law": { care: 7.7, fairness: 8.0, loyalty: 6.0, authority: 9.0, sanctity: 9.0, liberty: 3.7, individualCollective: 7.0, outcomesPrinciples: 8.7, reasonIntuition: 1.7, impartialPartial: 6.7 },
  "hobbes-social-contract": { care: 4.0, fairness: 6.3, loyalty: 4.7, authority: 10.0, sanctity: 1.0, liberty: 3.0, individualCollective: 6.0, outcomesPrinciples: 2.0, reasonIntuition: 1.0, impartialPartial: 6.7 },
  "pragmatism": { care: 7.0, fairness: 7.3, loyalty: 4.3, authority: 2.3, sanctity: 1.7, liberty: 7.7, individualCollective: 6.0, outcomesPrinciples: 2.0, reasonIntuition: 4.0, impartialPartial: 3.3 },
  "zhuangzi-daoism": { care: 4.7, fairness: 3.0, loyalty: 1.7, authority: 0.7, sanctity: 4.3, liberty: 8.7, individualCollective: 1.3, outcomesPrinciples: 4.3, reasonIntuition: 9.7, impartialPartial: 3.3 },
};

/** Display order and labels for the 6 moral foundations (one-sided, 0 = not important, 10 = central). */
export const FOUNDATION_LABELS: { key: keyof DimensionScores; label: string }[] = [
  { key: "care", label: "Care" },
  { key: "fairness", label: "Fairness" },
  { key: "loyalty", label: "Loyalty" },
  { key: "authority", label: "Authority" },
  { key: "sanctity", label: "Sanctity" },
  { key: "liberty", label: "Liberty" }
];

/** Display order and labels for the 4 two-sided axes (0 = low label, 10 = high label). */
export const SCORE_AXIS_LABELS: { key: keyof DimensionScores; low: string; high: string }[] = [
  { key: "outcomesPrinciples", low: "Outcomes", high: "Principles" },
  { key: "individualCollective", low: "Individual", high: "Collective" },
  { key: "reasonIntuition", low: "Reason", high: "Intuition" },
  { key: "impartialPartial", low: "Everyone equally", high: "My own people first" }
];

export function getPhilosopherScores(id: string): DimensionScores | undefined {
  return PHILOSOPHER_SCORES[id];
}

/** Plain words for a 0-10 foundation score. */
export function describeFoundation(value: number): string {
  if (value >= 8) return "Central";
  if (value >= 6) return "Important";
  if (value >= 4) return "Some weight";
  if (value >= 2) return "Minor";
  return "Little or none";
}

/** Plain words for a 0-10 position on a two-sided axis. */
export function describeScoreAxis(value: number, low: string, high: string): string {
  if (value <= 2) return `Strongly toward ${low.toLowerCase()}`;
  if (value <= 4) return `Moderately toward ${low.toLowerCase()}`;
  if (value >= 8) return `Strongly toward ${high.toLowerCase()}`;
  if (value >= 6) return `Moderately toward ${high.toLowerCase()}`;
  return "Balanced";
}
