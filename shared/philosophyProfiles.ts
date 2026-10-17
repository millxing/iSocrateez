import type { PhilosophyProfile } from "./contracts";

export const philosophyProfiles: PhilosophyProfile[] = [
  {
    id: "mill-utilitarianism",
    name: "Utilitarianism",
    representative: "John Stuart Mill",
    speaker: {
      years: "1806–1873",
      region: "England",
      traditions: "Utilitarianism, classical liberalism, empiricism"
    },
    coordinates: {
      outcomesPrinciples: -0.95,
      individualCollective: 0.35,
      reasonIntuition: -0.4
    },
    summary: "Measures moral choices by how well they increase well-being and reduce suffering overall.",
    exampleConcerns: ["aggregate harm", "practical effects", "social welfare"]
  },
  {
    id: "kant-deontology",
    name: "Kantian Deontology",
    representative: "Immanuel Kant",
    speaker: {
      years: "1724–1804",
      region: "Königsberg, Prussia (now Russia)",
      traditions: "Enlightenment, German idealism, deontological ethics"
    },
    coordinates: {
      outcomesPrinciples: 0.95,
      individualCollective: -0.3,
      reasonIntuition: -0.95
    },
    summary: "Centers morality on duties, universal principles, and respect for persons as ends in themselves.",
    exampleConcerns: ["consistency", "duty", "respect for persons"]
  },
  {
    id: "scanlon-contractualism",
    name: "Contractualism",
    representative: "T. M. Scanlon",
    speaker: {
      years: "born 1940",
      region: "United States",
      traditions: "Contractualism, contemporary analytic ethics"
    },
    coordinates: {
      outcomesPrinciples: 0.55,
      individualCollective: -0.1,
      reasonIntuition: -0.8
    },
    summary: "Asks what principles people could not reasonably reject when living together.",
    exampleConcerns: ["justifiability", "mutual respect", "reasonable rejection"]
  },
  {
    id: "gilligan-care-ethics",
    name: "Care Ethics",
    representative: "Carol Gilligan",
    speaker: {
      years: "born 1936",
      region: "United States",
      traditions: "Care ethics, feminist ethics, moral psychology"
    },
    coordinates: {
      outcomesPrinciples: 0.1,
      individualCollective: 0.75,
      reasonIntuition: 0.55
    },
    summary: "Emphasizes relationships, vulnerability, and the moral significance of attending to concrete human needs.",
    exampleConcerns: ["care", "dependency", "relational responsibility"]
  },
  {
    id: "aristotle-virtue-ethics",
    name: "Virtue Ethics",
    representative: "Aristotle",
    speaker: {
      years: "384–322 BCE",
      region: "Ancient Greece",
      traditions: "Virtue ethics, Peripatetic school"
    },
    coordinates: {
      outcomesPrinciples: 0.15,
      individualCollective: 0.15,
      reasonIntuition: 0.1
    },
    summary: "Focuses on character, practical wisdom, and what a flourishing person would do in context.",
    exampleConcerns: ["character", "balance", "practical wisdom"]
  },
  {
    id: "epictetus-stoicism",
    name: "Stoicism",
    representative: "Epictetus",
    speaker: {
      years: "c. 50–c. 135 CE",
      region: "Roman Empire (Phrygia and Nicopolis, Greece)",
      traditions: "Stoicism"
    },
    coordinates: {
      outcomesPrinciples: 0.7,
      individualCollective: -0.1,
      reasonIntuition: -0.7
    },
    summary: "Prioritizes inner discipline, principled action, and clear judgment about what is in one’s control.",
    exampleConcerns: ["self-command", "integrity", "control"]
  },
  {
    id: "confucius-role-ethics",
    name: "Confucian Role Ethics",
    representative: "Confucius",
    speaker: {
      years: "551–479 BCE",
      region: "China (state of Lu)",
      traditions: "Confucianism, role ethics"
    },
    coordinates: {
      outcomesPrinciples: 0.45,
      individualCollective: 0.85,
      reasonIntuition: 0.2
    },
    summary: "Frames ethics through cultivated roles, social harmony, and the responsibilities of relationship.",
    exampleConcerns: ["ritual propriety", "harmony", "familial duty"]
  },
  {
    id: "pragmatism",
    name: "Pragmatism",
    representative: "William James and John Dewey",
    speaker: {
      years: "James 1842–1910; Dewey 1859–1952",
      region: "United States",
      traditions: "Pragmatism, empiricism, functional psychology"
    },
    coordinates: {
      outcomesPrinciples: -0.45,
      individualCollective: 0.25,
      reasonIntuition: -0.2
    },
    summary: "Treats ethics as practical inquiry, testing ideas by how they work in lived social experience.",
    exampleConcerns: ["experimentation", "consequences", "growth"]
  },
  {
    id: "existentialism",
    name: "Existentialism",
    representative: "Jean-Paul Sartre and Simone de Beauvoir",
    speaker: {
      years: "Sartre 1905–1980; Beauvoir 1908–1986",
      region: "France",
      traditions: "Existentialism, phenomenology, feminist philosophy"
    },
    coordinates: {
      outcomesPrinciples: -0.05,
      individualCollective: -0.5,
      reasonIntuition: 0.45
    },
    summary: "Stresses freedom, responsibility, and the need to choose authentically under conditions of ambiguity.",
    exampleConcerns: ["authenticity", "freedom", "ambiguity"]
  },
  {
    id: "moral-particularism",
    name: "Moral Particularism",
    representative: "Jonathan Dancy",
    speaker: {
      years: "born 1946",
      region: "England",
      traditions: "Moral particularism, contemporary analytic ethics"
    },
    coordinates: {
      outcomesPrinciples: 0.1,
      individualCollective: -0.05,
      reasonIntuition: 0.85
    },
    summary: "Doubts that fixed moral principles can capture the full nuance of concrete situations.",
    exampleConcerns: ["context sensitivity", "nuance", "exceptional cases"]
  }
];
