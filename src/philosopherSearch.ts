import type { PhilosophyProfile } from "../shared/contracts";

/**
 * Extra words people might search for that don't appear on a philosopher's card:
 * places, nationalities, eras, religions, alternative names, and the ideas they're known for.
 * Name, school, region, traditions and group are searched automatically.
 */
const KEYWORDS: Record<string, string> = {
  "mill-utilitarianism": "british english uk europe european victorian 19th century nineteenth consequences consequentialism happiness welfare greatest good liberty freedom harm principle reform",
  "kant-deontology": "german germany prussian europe european 18th century eighteenth enlightenment duty duties rules categorical imperative dignity respect universal law lying promises reason",
  "scanlon-contractualism": "american usa us america modern 20th century 21st century justifiable reasonable rejection what we owe each other fairness",
  "gilligan-care-ethics": "american usa us america modern 20th century women feminism feminist care caring relationships empathy compassion psychology",
  "aristotle-virtue-ethics": "greek greece europe ancient classical antiquity bc bce virtue character golden mean flourishing eudaimonia happiness habit friendship practical wisdom phronesis",
  "epictetus-stoicism": "greek greece roman rome turkey europe ancient antiquity slave stoic stoics control acceptance resilience calm discipline enchiridion",
  "confucius-role-ethics": "china chinese asia asian east eastern ancient kongzi kong fuzi analects ritual li ren benevolence filial piety family duty roles harmony respect elders",
  "pragmatism": "american usa us america 19th century 20th century practical experience experiment consequences democracy education",
  "existentialism": "french france paris europe european 20th century freedom choice authenticity responsibility meaning absurd feminism women atheism",
  "moral-particularism": "british english uk europe modern 20th century context case by case situational judgement judgment intuition no rules",
  "socrates-examined-life": "greek greece athenian europe ancient classical antiquity questioning dialogue socratic method wisdom ignorance self-knowledge virtue",
  "laozi-daoism": "china chinese asia asian east eastern ancient lao tzu lao-tzu taoism tao te ching dao de jing way nature simplicity wu wei harmony balance yin yang",
  "buddha-buddhist-ethics": "india indian nepal asia asian east eastern south ancient buddhism buddhist religion religious spiritual compassion suffering karma mindfulness meditation middle way nirvana eightfold path",
  "jesus-christian-ethics": "christianity christian christ jesus religion religious god faith bible gospel israel palestine middle east ancient love neighbour neighbor forgiveness mercy golden rule sermon on the mount",
  "aquinas-natural-law": "italian italy french france europe medieval middle ages christianity christian catholic church religion religious god faith saint thomas natural law reason",
  "hume-sentimentalism": "scottish scotland british uk europe 18th century enlightenment feelings emotions sentiment sympathy empathy passions",
  "spinoza-rational-ethics": "dutch netherlands holland jewish portuguese europe 17th century rationalism reason god nature freedom emotions",
  "kierkegaard-existential-faith": "danish denmark scandinavia scandinavian europe 19th century soren christianity christian religion religious faith god anxiety choice leap of faith individual",
  "nietzsche-perspectivism": "german germany europe 19th century will to power ubermensch overman superman values master slave morality god is dead perspectivism",
  "rawls-justice-as-fairness": "american usa us america 20th century justice fairness veil of ignorance equality inequality politics political liberal social contract",
  "plato-platonism": "greek greece athenian europe ancient classical antiquity republic forms justice soul ideals philosopher king",
  "epicurus-epicureanism": "greek greece europe ancient antiquity hellenistic pleasure happiness tranquility peace friendship simple life fear of death",
  "seneca-stoicism": "roman rome italy spanish spain europe ancient antiquity latin stoic stoics letters anger time death resilience calm",
  "marcus-aurelius-stoicism": "roman rome italy europe ancient antiquity emperor stoic stoics meditations duty discipline acceptance calm leadership",
  "diogenes-cynicism": "greek greece turkey europe ancient antiquity cynic cynics dog simplicity shamelessness convention rebellion",
  "mencius-confucianism": "china chinese asia asian east eastern ancient mengzi confucian human nature goodness compassion benevolence government",
  "zhuangzi-daoism": "china chinese asia asian east eastern ancient chuang tzu chuang-tzu taoism tao dao way nature spontaneity freedom relativity butterfly",
  "gandhi-nonviolence": "india indian asia asian south hindu hinduism jain religion religious mahatma satyagraha nonviolence non-violence ahimsa peace protest resistance truth civil disobedience independence 20th century",
  "ubuntu-african-ethics": "africa african south africa southern sub-saharan bantu zulu xhosa community communal togetherness humanity i am because we are relationships",
  "bhagavad-gita-dharma": "india indian asia asian south hindu hinduism religion religious god sanskrit krishna arjuna gita duty dharma karma yoga action detachment",
  "al-ghazali-islamic-ethics": "islam islamic muslim religion religious god faith persian persia iran iraq syria middle east medieval sufi sufism mysticism",
  "maimonides-jewish-ethics": "jewish judaism religion religious god faith torah talmud rabbi rambam spain spanish morocco egypt middle east north africa medieval moderation",
  "hobbes-social-contract": "british english uk europe 17th century leviathan social contract government authority order security self-interest politics political",
  "rousseau-general-will": "swiss switzerland french france europe 18th century enlightenment social contract general will democracy equality freedom politics political",
  "schopenhauer-compassion": "german germany europe 19th century compassion pity suffering pessimism will buddhism indian",
  "wollstonecraft-feminist-ethics": "british english uk europe 18th century women feminism feminist rights equality education reason",
  "arendt-responsibility": "german germany jewish american usa us america 20th century politics political totalitarianism banality of evil responsibility judgment judgement thinking",
  "singer-effective-ethics": "australian australia american usa us america modern 21st century utilitarian consequences charity giving poverty animals animal rights effective altruism",
  "foot-natural-goodness": "british english uk europe 20th century women virtue trolley problem natural goodness",
  "king-beloved-community": "american usa us america 20th century mlk martin luther king christian christianity baptist religion religious god faith civil rights racism race justice nonviolence non-violence protest equality love community"
};

// Group words, not the display labels: "Asian & African traditions" would make "asia" match Ubuntu.
const GROUP_WORDS: Record<PhilosophyProfile["group"], string> = {
  ancient: "ancient classical",
  eastern: "",
  religious: "religion religious",
  modern: "modern",
  contemporary: "contemporary modern living"
};

const fold = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ø/g, "o").replace(/[’']/g, "");

const indexCache = new Map<string, string[]>();

function wordsFor(profile: PhilosophyProfile): string[] {
  const cached = indexCache.get(profile.id);
  if (cached) return cached;
  const text = [
    profile.representative,
    profile.name,
    profile.speaker.region,
    profile.speaker.traditions,
    GROUP_WORDS[profile.group],
    KEYWORDS[profile.id] ?? ""
  ].join(" ");
  const words = fold(text).split(/[^a-z0-9]+/).filter(Boolean);
  indexCache.set(profile.id, words);
  return words;
}

/**
 * True when every word in the query starts some word in the philosopher's name, school, region,
 * traditions, group or keywords. So "chin" finds Chinese thinkers and "stoic rome" finds the Roman Stoics.
 */
export function matchesPhilosopher(profile: PhilosophyProfile, query: string): boolean {
  const terms = fold(query).split(/[^a-z0-9]+/).filter(Boolean);
  if (terms.length === 0) return true;
  const words = wordsFor(profile);
  return terms.every((term) => words.some((word) => word.startsWith(term)));
}
