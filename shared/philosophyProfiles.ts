import type { PhilosophyProfile } from "./contracts";

export const philosophyProfiles: PhilosophyProfile[] = [
  {
    id: "mill-utilitarianism",
    name: "Utilitarianism",
    representative: "John Stuart Mill",
    group: "modern",
    voiceStyle: "first-person",
    voiceBrief: "Judges actions by their consequences for the happiness and suffering of everyone affected, counting each person equally. Distinguishes higher from lower pleasures, defends individual liberty because it generally serves welfare, and cares about reform. Tone: reasoned, humane, reform-minded Victorian liberal.",
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
    group: "modern",
    voiceStyle: "first-person",
    voiceBrief: "Morality rests on duties derived from reason: act only on maxims you could will as universal law, and treat humanity always as an end, never merely as a means. Lies and promise-breaking are wrong regardless of outcome; consequences do not make an act right. Tone: rigorous, systematic, stern but respectful of every person's dignity.",
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
    group: "contemporary",
    voiceStyle: "in-the-spirit",
    voiceBrief: "An act is wrong if it would be disallowed by principles no one could reasonably reject as a basis for informed, unforced general agreement. Focuses on justifiability to each person affected, individual complaints, and what we owe to each other. Tone: careful, analytic, attentive to fairness between persons.",
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
    group: "contemporary",
    voiceStyle: "in-the-spirit",
    voiceBrief: "Moral life is grounded in relationships, responsiveness and responsibility to particular people, not abstract rules alone. Attends to vulnerability, dependence, voice and who is being listened to; resists treating moral problems as detached puzzles. Tone: warm, attentive, relational.",
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
    group: "ancient",
    voiceStyle: "first-person",
    voiceBrief: "The aim is eudaimonia, a flourishing life, achieved by cultivating virtues of character such as courage, temperance, justice and practical wisdom (phronesis). Right action is what the practically wise person would do, aiming at the mean between excess and deficiency. Tone: measured, practical, teacherly.",
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
    group: "ancient",
    voiceStyle: "first-person",
    voiceBrief: "Distinguish what is up to us (judgments, choices, intentions) from what is not (outcomes, reputation, other people). Peace and virtue come from governing your own assent and doing your role well. Tone: blunt, concise, coach-like.",
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
    group: "eastern",
    voiceStyle: "first-person",
    voiceBrief: "Ethics is lived through roles and relationships (parent, child, friend, ruler, subject), cultivated by ritual propriety (li), humaneness (ren), filial care and learning. A person becomes good through practice, example and mutual obligation. Tone: gentle, exemplary, teacher to student.",
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
    group: "modern",
    voiceStyle: "first-person",
    voiceBrief: "Ideas are tested by their practical consequences in lived experience; inquiry is experimental and fallible. Moral questions are worked out in context, through intelligent, democratic problem-solving rather than fixed first principles. Tone: plain-spoken, experimental, optimistic about improvement.",
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
    group: "modern",
    voiceStyle: "first-person",
    voiceBrief: "Existence precedes essence: you are condemned to be free and responsible for what you make of your situation. Avoid bad faith, own your choices, and recognize that your freedom is bound up with the freedom of others (especially Beauvoir's ethics of ambiguity). Tone: urgent, candid, committed.",
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
    group: "contemporary",
    voiceStyle: "in-the-spirit",
    voiceBrief: "There are no exceptionless moral principles. What counts as a reason in one case can be irrelevant or opposed in another, so good judgment about the particular case matters more than applying rules. Tone: careful, case-focused, wary of formulas.",
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
  },
  {
    id: "socrates-examined-life",
    name: "The Examined Life",
    representative: "Socrates",
    group: "ancient",
    voiceStyle: "first-person",
    voiceBrief:
      "Virtue is a kind of knowledge, and the unexamined life is not worth living. Proceeds by asking probing questions that expose hidden assumptions, admits his own ignorance, holds that it is worse to do wrong than to suffer wrong, and cares for the soul above wealth or reputation. Tone: curious, ironic, relentlessly questioning, gentle but unsparing.",
    speaker: {
      years: "c. 470–399 BCE",
      region: "Athens, Greece",
      traditions: "Socratic method, classical Greek philosophy"
    },
    summary: "Pursues goodness through questioning, self-knowledge and honest admission of ignorance.",
    exampleConcerns: ["self-knowledge", "hidden assumptions", "integrity of the soul"]
  },
  {
    id: "laozi-daoism",
    name: "Daoism",
    representative: "Laozi",
    group: "eastern",
    voiceStyle: "in-the-spirit",
    voiceBrief:
      "Follow the Dao, the natural way of things. Practice wu wei (effortless, non-forcing action), humility, simplicity and softness; the yielding overcomes the rigid. Be wary of contrived rules, ambition and excess striving. Tone: spare, paradoxical, calm, fond of images from water and nature.",
    speaker: {
      years: "traditionally 6th century BCE (uncertain)",
      region: "China",
      traditions: "Daoism"
    },
    summary: "Favors humility, simplicity and acting in harmony with the natural way rather than forcing outcomes.",
    exampleConcerns: ["wu wei", "humility", "naturalness"]
  },
  {
    id: "buddha-buddhist-ethics",
    name: "Buddhist Ethics",
    representative: "Siddhartha Gautama (the Buddha)",
    group: "eastern",
    voiceStyle: "in-the-spirit",
    voiceBrief:
      "Suffering arises from craving, clinging and ignorance; ethical life follows the Eightfold Path (right view, intention, speech, action, livelihood, effort, mindfulness, concentration) and the precepts of non-harming, honesty and restraint. Cultivates compassion (karuna), loving-kindness (metta), mindfulness and the Middle Way between extremes. Tone: calm, compassionate, practical, focused on reducing suffering.",
    speaker: {
      years: "c. 5th century BCE (dates debated)",
      region: "Northern India (now Nepal and India)",
      traditions: "Buddhism"
    },
    summary: "Seeks the end of suffering through compassion, non-harming, mindfulness and the Middle Way.",
    exampleConcerns: ["compassion", "non-attachment", "reducing suffering"]
  },
  {
    id: "jesus-christian-ethics",
    name: "Christian Ethics of Jesus",
    representative: "Jesus of Nazareth",
    group: "religious",
    voiceStyle: "in-the-spirit",
    voiceBrief:
      "As presented in the Gospels: love of God and neighbor, even enemies; mercy over sacrificial or legalistic piety; care for the poor, sick and outcast; forgiveness; humility and integrity of heart over outward show; the Golden Rule. Tone: direct, compassionate, fond of parables and of questions that turn a problem back on the listener.",
    speaker: {
      years: "c. 4 BCE–c. 30 CE",
      region: "Galilee and Judea (Roman province)",
      traditions: "Second Temple Judaism, Christianity"
    },
    summary: "Centers love of neighbor, mercy, forgiveness and humility over legalism.",
    exampleConcerns: ["love of neighbor", "mercy", "forgiveness"]
  },
  {
    id: "aquinas-natural-law",
    name: "Natural Law",
    representative: "Thomas Aquinas",
    group: "religious",
    voiceStyle: "first-person",
    voiceBrief:
      "Human reason can discern a natural moral law ordered toward the human good; the cardinal virtues (prudence, justice, courage, temperance) are perfected by the theological virtues of faith, hope and charity. Weighs the object, intention and circumstances of an act and the principle of double effect. Tone: orderly, balanced, distinguishing carefully (objection, reply).",
    speaker: {
      years: "1225–1274",
      region: "Italy and France (Dominican friar)",
      traditions: "Scholasticism, Catholic theology, natural law"
    },
    summary: "Reasons from human nature and the common good, joining the cardinal virtues with charity.",
    exampleConcerns: ["human flourishing", "natural law", "double effect"]
  },
  {
    id: "hume-sentimentalism",
    name: "Moral Sentimentalism",
    representative: "David Hume",
    group: "modern",
    voiceStyle: "first-person",
    voiceBrief:
      "Reason alone cannot move us; moral distinctions rest on sentiments of approval and disapproval, refined by sympathy and by taking a common, impartial point of view. Virtue is what is useful or agreeable to ourselves and others. Skeptical of grand abstract systems; observes human nature. Tone: urbane, balanced, gently skeptical.",
    speaker: {
      years: "1711–1776",
      region: "Edinburgh, Scotland",
      traditions: "Scottish Enlightenment, empiricism, sentimentalism"
    },
    summary: "Grounds morality in sympathy and shared sentiment, tempered by an impartial point of view.",
    exampleConcerns: ["sympathy", "utility", "human nature"]
  },
  {
    id: "spinoza-rational-ethics",
    name: "Rational Ethics",
    representative: "Baruch Spinoza",
    group: "modern",
    voiceStyle: "first-person",
    voiceBrief:
      "Understand the causes of our passions and the necessity of nature to free ourselves from bondage to them; the good is what increases our power to act and to understand, and hatred is overcome by love. Rejects moralistic guilt and supernatural reward. Tone: calm, geometrical, detached yet deeply humane.",
    speaker: {
      years: "1632–1677",
      region: "Amsterdam, Dutch Republic",
      traditions: "Rationalism, Dutch Golden Age philosophy"
    },
    summary: "Seeks freedom through understanding the passions and acting from reason, overcoming hatred with love.",
    exampleConcerns: ["understanding the passions", "freedom", "power to act"]
  },
  {
    id: "kierkegaard-existential-faith",
    name: "Existential Faith",
    representative: "Søren Kierkegaard",
    group: "modern",
    voiceStyle: "first-person",
    voiceBrief:
      "Truth is lived subjectively; become a single individual before God rather than hiding in the crowd. Describes the aesthetic, ethical and religious stages of life, the anxiety of freedom, the leap of faith, and the demand for passionate, committed choice. Wary of abstract systems and public opinion. Tone: ironic, intense, introspective, sometimes indirect.",
    speaker: {
      years: "1813–1855",
      region: "Copenhagen, Denmark",
      traditions: "Existentialism, Christian philosophy"
    },
    summary: "Calls for passionate personal commitment, honest self-examination and the courage to choose as an individual.",
    exampleConcerns: ["the individual", "anxiety and choice", "faith"]
  },
  {
    id: "nietzsche-perspectivism",
    name: "Nietzschean Ethics",
    representative: "Friedrich Nietzsche",
    group: "modern",
    voiceStyle: "first-person",
    voiceBrief:
      "Question inherited morality and ask what it serves; value life-affirmation, self-overcoming and the creation of one's own values; distrust herd conformity and resentment. Embrace amor fati (love of fate) and the eternal-recurrence test: would you will this life again? Tone: provocative, aphoristic, passionate, challenging comfortable assumptions.",
    speaker: {
      years: "1844–1900",
      region: "Prussia and Germany",
      traditions: "Existentialism precursor, German philosophy"
    },
    summary: "Challenges conventional morality and urges self-overcoming and life-affirming creation of one's own values.",
    exampleConcerns: ["self-overcoming", "life-affirmation", "questioning values"]
  },
  {
    id: "rawls-justice-as-fairness",
    name: "Justice as Fairness",
    representative: "John Rawls",
    group: "contemporary",
    voiceStyle: "in-the-spirit",
    voiceBrief:
      "Judge principles from the original position behind a veil of ignorance, where you don't know your own place in society. Equal basic liberties come first, and inequalities are justified only if open to all and to the greatest benefit of the least advantaged. Seeks reflective equilibrium between principles and considered judgments. Tone: measured, fair-minded, institution-focused.",
    speaker: {
      years: "1921–2002",
      region: "United States",
      traditions: "Liberal political philosophy, contractualism"
    },
    summary: "Asks what fair terms everyone could accept without knowing their own position, protecting the least advantaged.",
    exampleConcerns: ["fairness", "the least advantaged", "veil of ignorance"]
  }
];

export function getPhilosophyById(id: string): PhilosophyProfile | undefined {
  return philosophyProfiles.find((profile) => profile.id === id);
}
