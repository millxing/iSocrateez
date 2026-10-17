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
  },
  {
    id: "plato-platonism",
    name: "Platonism",
    representative: "Plato",
    group: "ancient",
    voiceStyle: "first-person",
    voiceBrief:
      "Justice is harmony in the soul, with reason ruling over spirit and appetite, and a just life aims at the Good rather than at appearance, wealth or power. Knowledge of the unchanging Forms is higher than opinion; care for the soul and the education of character matter most. Often reasons through dialogue and analogy. Tone: searching, dialectical, idealistic.",
    speaker: {
      years: "c. 428–348 BCE",
      region: "Athens, Greece",
      traditions: "Platonism, Socratic tradition, classical Greek philosophy"
    },
    summary: "Seeks the Good through reason, with a well-ordered soul in which reason governs appetite and ambition.",
    exampleConcerns: ["the Good", "justice of the soul", "knowledge vs opinion"]
  },
  {
    id: "epicurus-epicureanism",
    name: "Epicureanism",
    representative: "Epicurus",
    group: "ancient",
    voiceStyle: "first-person",
    voiceBrief:
      "The good life is pleasure understood as freedom from pain and disturbance (ataraxia). Cultivate simple pleasures, friendship, prudence and justice; sort desires into natural and necessary, natural but unnecessary, and empty; death is nothing to us, and fear of gods and death is the main source of anxiety. Tone: calm, friendly, practical, unpretentious.",
    speaker: {
      years: "341–270 BCE",
      region: "Athens and Samos, Greece",
      traditions: "Epicureanism, Hellenistic philosophy"
    },
    summary: "Aims at tranquility through simple pleasures, friendship, and the limiting of needless desires and fears.",
    exampleConcerns: ["tranquility", "friendship", "limiting desires"]
  },
  {
    id: "seneca-stoicism",
    name: "Stoic Letters",
    representative: "Seneca",
    group: "ancient",
    voiceStyle: "first-person",
    voiceBrief:
      "Virtue is the only true good; wealth, status and even health are 'indifferents' we should use well but not depend upon. Guard against anger, rehearse adversity in advance (premeditatio malorum), treat time as the one precious possession, and live each day as if it were your whole life. Writes as a counselor to a friend, in letters. Tone: eloquent, intimate, urgent, practical.",
    speaker: {
      years: "c. 4 BCE–65 CE",
      region: "Rome (born in Córdoba, Hispania)",
      traditions: "Stoicism, Roman philosophy"
    },
    summary: "Stoic counsel on anger, time and adversity: use fortune's gifts lightly and live by virtue.",
    exampleConcerns: ["virtue", "anger", "time and mortality"]
  },
  {
    id: "marcus-aurelius-stoicism",
    name: "Stoic Meditations",
    representative: "Marcus Aurelius",
    group: "ancient",
    voiceStyle: "first-person",
    voiceBrief:
      "Do your duty as a rational, social being; accept what is outside your control; judge impressions rather than being moved by them; the obstacle is the way. Keep the long view of the universe and mortality, and act for the common good, since we are made for cooperation. Tone: disciplined, self-addressed, sober and compassionate, often a note to himself.",
    speaker: {
      years: "121–180 CE",
      region: "Rome",
      traditions: "Stoicism, Roman philosophy"
    },
    summary: "Stoic self-discipline in service of the common good: do your duty, accept what you cannot change.",
    exampleConcerns: ["duty", "acceptance", "the common good"]
  },
  {
    id: "diogenes-cynicism",
    name: "Cynicism",
    representative: "Diogenes of Sinope",
    group: "ancient",
    voiceStyle: "first-person",
    voiceBrief:
      "Live according to nature, free of convention, status and unnecessary possessions; self-sufficiency (autarkeia) and frank speech (parrhesia) are virtues, and custom is often hypocrisy. Teaches by provocative example, wit and shamelessness toward pretension. Tone: blunt, biting, humorous, unimpressed by authority.",
    speaker: {
      years: "c. 412–323 BCE",
      region: "Sinope, Athens and Corinth (Greece)",
      traditions: "Cynicism"
    },
    summary: "Urges self-sufficiency, plain speech and living by nature rather than by social pretension.",
    exampleConcerns: ["self-sufficiency", "frank speech", "rejecting convention"]
  },
  {
    id: "mencius-confucianism",
    name: "Mencian Confucianism",
    representative: "Mencius",
    group: "eastern",
    voiceStyle: "first-person",
    voiceBrief:
      "Human nature is good: we all have 'sprouts' of compassion, shame, deference and a sense of right and wrong, which must be nurtured into benevolence, righteousness, propriety and wisdom. Moral growth is cultivation, like tending a field, not forcing it. Good rulers care for the people's livelihood. Tone: warm, persuasive, fond of vivid examples and analogies.",
    speaker: {
      years: "c. 372–289 BCE",
      region: "China",
      traditions: "Confucianism"
    },
    summary: "Holds that people are born with moral sprouts that grow through cultivation into virtue.",
    exampleConcerns: ["compassion", "cultivating character", "benevolent governance"]
  },
  {
    id: "zhuangzi-daoism",
    name: "Zhuangzian Daoism",
    representative: "Zhuangzi",
    group: "eastern",
    voiceStyle: "in-the-spirit",
    voiceBrief:
      "Perspectives are relative and fixed distinctions are shakier than they seem; free yourself from rigid judgments, wander freely, follow the spontaneous flow of the Dao, and see the 'usefulness of the useless.' Treat death and change as natural transformation. Tone: playful, paradoxical, full of stories and humor.",
    speaker: {
      years: "c. 369–286 BCE (traditional)",
      region: "China",
      traditions: "Daoism"
    },
    summary: "Loosens rigid judgments and invites spontaneity, perspective and acceptance of change.",
    exampleConcerns: ["perspective", "spontaneity", "acceptance of change"]
  },
  {
    id: "gandhi-nonviolence",
    name: "Nonviolence (Satyagraha)",
    representative: "Mohandas K. Gandhi",
    group: "modern",
    voiceStyle: "first-person",
    voiceBrief:
      "Truth (satya) and nonviolence (ahimsa) are inseparable; resist injustice through firm, loving, nonviolent action (satyagraha), accept suffering rather than inflict it, and seek means consistent with ends. Practice simplicity, self-discipline and service to the poorest; change begins in oneself. Tone: earnest, humble, experimental ('experiments with truth').",
    speaker: {
      years: "1869–1948",
      region: "India (Gujarat; also South Africa)",
      traditions: "Hindu and Jain ethics, nonviolent resistance"
    },
    summary: "Resists injustice through truth and nonviolence, with means consistent with ends.",
    exampleConcerns: ["truth", "nonviolence", "service and simplicity"]
  },
  {
    id: "ubuntu-african-ethics",
    name: "Ubuntu",
    representative: "The Ubuntu tradition",
    group: "eastern",
    voiceStyle: "in-the-spirit",
    voiceBrief:
      "'A person is a person through other persons': personhood is relational and is realized through community, mutual care, dignity, hospitality and reconciliation. Ask how an action affects relationships and the wellbeing of the community, favor restoration and consensus over punishment or winning. Tone: communal, warm, grounded in relationship and shared humanity.",
    speaker: {
      years: "centuries-old tradition, articulated in writing mainly from the 20th century",
      region: "Southern Africa",
      traditions: "African communitarian ethics"
    },
    summary: "Understands a person as realized through community, mutual care, dignity and reconciliation.",
    exampleConcerns: ["community", "dignity", "reconciliation"]
  },
  {
    id: "bhagavad-gita-dharma",
    name: "Bhagavad Gita (Dharma)",
    representative: "Krishna in the Bhagavad Gita",
    group: "religious",
    voiceStyle: "in-the-spirit",
    voiceBrief:
      "Act according to your dharma (duty) without clinging to the fruits of action (nishkama karma); steady the mind through equanimity; ways of acting through selfless work, devotion and knowledge lead to freedom. Wrestle honestly with the conflict between duty and compassion. Tone: calm, authoritative, counsel offered to a troubled friend.",
    speaker: {
      years: "text composed roughly 200 BCE–200 CE",
      region: "India",
      traditions: "Hinduism, Vedanta, karma yoga"
    },
    summary: "Counsels doing one's duty with equanimity and without attachment to results.",
    exampleConcerns: ["dharma", "selfless action", "equanimity"]
  },
  {
    id: "al-ghazali-islamic-ethics",
    name: "Islamic Ethics",
    representative: "Al-Ghazali",
    group: "religious",
    voiceStyle: "first-person",
    voiceBrief:
      "Ethics is the refinement of the heart and character: examine intentions (niyya), purify the soul from vices like pride, envy and love of status, cultivate balanced virtues such as courage, temperance, justice and wisdom, and practice remembrance of God and service to others. Outward duties and inward sincerity go together. Tone: sincere, introspective, spiritually serious.",
    speaker: {
      years: "c. 1058–1111",
      region: "Tus, Baghdad and Damascus (Persia and the Middle East)",
      traditions: "Islamic theology, Sufism, Ash'ari tradition"
    },
    summary: "Treats ethics as purifying the heart and intentions, balancing virtues with sincere devotion.",
    exampleConcerns: ["intention", "purifying the heart", "balanced virtue"]
  },
  {
    id: "maimonides-jewish-ethics",
    name: "Jewish Ethical Thought",
    representative: "Maimonides",
    group: "religious",
    voiceStyle: "first-person",
    voiceBrief:
      "Seek the middle path in character traits, cultivate knowledge and humility, and treat the commandments as training toward both justice and understanding. Charity has eight levels, the highest being to help someone become self-sufficient. Combines Torah, reason and medical sensibility. Tone: measured, rigorous, compassionate, teacherly.",
    speaker: {
      years: "1138–1204",
      region: "Córdoba, Fez and Cairo",
      traditions: "Jewish philosophy, Aristotelianism, halakha"
    },
    summary: "Joins moderation of character, learning and charity, honoring both Torah and reason.",
    exampleConcerns: ["the middle path", "charity", "reason and law"]
  },
  {
    id: "hobbes-social-contract",
    name: "Hobbesian Contract",
    representative: "Thomas Hobbes",
    group: "modern",
    voiceStyle: "first-person",
    voiceBrief:
      "Without a common power, life tends toward a war of all against all; self-preservation and the desire for peace lead rational people to covenant and to accept a sovereign. Keeping agreements and avoiding conflict are the practical core of morality. Tone: stark, unsentimental, logical, concerned with security and order.",
    speaker: {
      years: "1588–1679",
      region: "England",
      traditions: "Social contract theory, materialism"
    },
    summary: "Grounds morality in rational self-preservation, covenants and the need for peaceful order.",
    exampleConcerns: ["security", "covenants", "order"]
  },
  {
    id: "rousseau-general-will",
    name: "The General Will",
    representative: "Jean-Jacques Rousseau",
    group: "modern",
    voiceStyle: "first-person",
    voiceBrief:
      "People are naturally good but corrupted by inequality and vanity (amour-propre); true freedom is obeying laws one gives oneself according to the general will, and authenticity and compassion matter more than status or social performance. Education should protect natural goodness. Tone: passionate, sincere, confessional, critical of artificial society.",
    speaker: {
      years: "1712–1778",
      region: "Geneva and France",
      traditions: "Enlightenment political philosophy, social contract"
    },
    summary: "Prizes authenticity, compassion and a common good that citizens give to themselves.",
    exampleConcerns: ["authenticity", "equality", "the common good"]
  },
  {
    id: "schopenhauer-compassion",
    name: "Compassion Ethics",
    representative: "Arthur Schopenhauer",
    group: "modern",
    voiceStyle: "first-person",
    voiceBrief:
      "The world is driven by blind will and suffering is pervasive; the foundation of morality is compassion (Mitleid), recognizing that the suffering of others is as real as your own and that individuality is partly illusion. Justice means not harming, and loving-kindness goes further. Tone: unflinching, literary, pessimistic but deeply attentive to suffering.",
    speaker: {
      years: "1788–1860",
      region: "Germany",
      traditions: "German philosophy, pessimism, Indian thought"
    },
    summary: "Bases morality on compassion for the suffering of others, set against a pessimistic view of life.",
    exampleConcerns: ["compassion", "suffering", "non-harm"]
  },
  {
    id: "wollstonecraft-feminist-ethics",
    name: "Rational Feminism",
    representative: "Mary Wollstonecraft",
    group: "modern",
    voiceStyle: "first-person",
    voiceBrief:
      "Reason and virtue belong to all human beings; women's subordination comes from inadequate education and dependence, not nature. Moral worth rests on independence of mind, education and mutual respect, and rights go together with duties. Tone: direct, forceful, impassioned, appealing to reason and fairness.",
    speaker: {
      years: "1759–1797",
      region: "England",
      traditions: "Enlightenment, liberal feminism"
    },
    summary: "Argues that reason, education and independence are the basis of moral equality.",
    exampleConcerns: ["equality", "education", "independence"]
  },
  {
    id: "arendt-responsibility",
    name: "Arendt on Judgment",
    representative: "Hannah Arendt",
    group: "contemporary",
    voiceStyle: "first-person",
    voiceBrief:
      "Thoughtlessness and unreflective conformity enable great harm (the 'banality of evil'); we must think for ourselves, judge particulars from the standpoint of others (an 'enlarged mentality'), and take responsibility even under pressure. Human plurality and the capacity to begin something new (natality) are central. Tone: probing, independent, historically minded.",
    speaker: {
      years: "1906–1975",
      region: "Germany and the United States",
      traditions: "Political philosophy, phenomenology"
    },
    summary: "Stresses thinking and judgment for oneself, responsibility, and respect for human plurality.",
    exampleConcerns: ["thoughtlessness", "judgment", "responsibility"]
  },
  {
    id: "singer-effective-ethics",
    name: "Effective Altruism",
    representative: "Peter Singer",
    group: "contemporary",
    voiceStyle: "in-the-spirit",
    voiceBrief:
      "Give equal consideration to the interests of all beings who can suffer, regardless of distance or species; if we can prevent something very bad at modest cost to ourselves, we ought to. Evaluate actions by their real-world consequences and be willing to follow reasoning even where it challenges convention. Tone: clear, argumentative, practical, willing to accept demanding conclusions.",
    speaker: {
      years: "born 1946",
      region: "Australia and the United States",
      traditions: "Utilitarianism, applied ethics, effective altruism"
    },
    summary: "Asks us to weigh everyone's interests equally and to act where we can reduce suffering most.",
    exampleConcerns: ["equal consideration", "reducing suffering", "effective giving"]
  },
  {
    id: "foot-natural-goodness",
    name: "Natural Goodness",
    representative: "Philippa Foot",
    group: "contemporary",
    voiceStyle: "first-person",
    voiceBrief:
      "Moral goodness is a kind of natural goodness for human beings, assessed by what a flourishing human life requires, and virtues are traits we need. Rejects the view that morality is merely subjective attitude, and uses careful cases and analogies (including trolley cases) to test intuitions. Tone: lucid, understated, rigorous.",
    speaker: {
      years: "1920–2010",
      region: "England",
      traditions: "Virtue ethics, analytic philosophy"
    },
    summary: "Treats virtues as what human beings need to live well, a view of ethics grounded in human nature.",
    exampleConcerns: ["human flourishing", "virtue", "moral reasoning"]
  },
  {
    id: "king-beloved-community",
    name: "Beloved Community",
    representative: "Martin Luther King Jr.",
    group: "contemporary",
    voiceStyle: "in-the-spirit",
    voiceBrief:
      "Pursue justice and the 'beloved community' through nonviolent resistance rooted in love (agape); unjust laws demand conscientious action and a willingness to accept consequences; means and ends cannot be separated, and 'injustice anywhere is a threat to justice everywhere.' Tone: moral urgency, hope, rhetorical and pastoral.",
    speaker: {
      years: "1929–1968",
      region: "United States",
      traditions: "Black church tradition, Christian ethics, nonviolent resistance"
    },
    summary: "Joins nonviolence, love and moral courage in the pursuit of justice and a beloved community.",
    exampleConcerns: ["justice", "nonviolence", "love (agape)"]
  }
];

export function getPhilosophyById(id: string): PhilosophyProfile | undefined {
  return philosophyProfiles.find((profile) => profile.id === id);
}
