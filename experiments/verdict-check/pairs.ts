/**
 * Paired cases for the verdict check.
 *
 * A pair is one case told twice. The two tellings differ in one fact (the "pivot"). The key says,
 * for each listed thinker, if that fact reverses the thinker's answer ("flip") or does not ("same").
 * The test then asks: does the app's answer change when it should, and stay when it should?
 *
 * The harness runs every pair for all test philosophers (the core four and the transfer thinkers) and for a baseline with no philosopher.
 * A correct pattern counts as evidence for a thinker only where it differs from the baseline's pattern:
 * a sensible adviser with no philosophy also flips on many of these pairs.
 *
 * This design came from the second review of the first answer key (reviews/second-reviewer-2026-11.md).
 * It does not need agreement on one disputed answer. It needs agreement on which fact matters to whom.
 *
 * STATUS: PROVISIONAL. Written by an AI model on 2026-11-20. Not yet checked by a philosopher.
 * Checked on 2026-11-20 by two other AI models: one checked the references against online texts,
 * and one criticised the design. This file has their corrections. Pairs added after that check
 * (drug-stakes, wallet-owner, lamb-at-the-shrine, favour-asked, friend-who-changed) had the reference
 * check only where their source line says so. pardon-the-surgeon was added on 2026-11-21 with a reference check
 * against Hastie's translation of the Doctrine of Right. mourning-leave, anger-at-the-meeting and loan-i-cannot-repay
 * were added on 2026-11-21 for the distinctness test: in each, a thinker's text gives an answer that a sensible adviser
 * with no philosophy may not give. Entries for the transfer thinkers (answerKey.ts) were added on the same day.
 *
 * Basis, for each side of a pair:
 * "recorded": the thinker's own text gives an answer to a case of this shape.
 * "inferred": our reading of the thinker's principles; no text gives the answer directly.
 *
 * LIMITS. Most "recorded" pairs can be passed by recall of a famous passage. If the passages behind the
 * holdout pairs are put into the app's notes on a philosopher, the holdout measures copying, so those
 * passages are kept out of every prompt (HOLDOUT_PASSAGES, at the end of this file). Kant has one "flip"
 * pair (pardon-the-surgeon). Use --samples to measure run-to-run variation.
 *
 * Analects numbers follow D. C. Lau; Legge's numbers differ by one or two in some books.
 */
import type { TestPhilosopherId, VerdictOption } from "./answerKey";

export type Basis = "recorded" | "inferred";

export interface PairExpectation {
  /** "flip": the answer changes between the two cases. "same": it does not. */
  expect: "flip" | "same";
  /** Expected option id in the base case. */
  base: string;
  /** Expected option id in the variant case. Equal to `base` when `expect` is "same". */
  variant: string;
  basis: { base: Basis; variant: Basis };
  /** Why the pivot fact matters, or does not matter, to this thinker. */
  reason: string;
  source: string;
}

export interface CasePair {
  id: string;
  title: string;
  /** "holdout" pairs are for the final measurement. Do not use them to tune a prompt. */
  split: "development" | "holdout";
  /** The one fact that differs between the two cases, in plain words. */
  pivot: string;
  base: string;
  variant: string;
  /** The same two options apply to both cases. */
  options: VerdictOption[];
  /** A control pair: every thinker, and a sensible adviser, should give the same pattern. Distinctness should be low. */
  control?: boolean;
  thinkers: Partial<Record<TestPhilosopherId, PairExpectation>>;
}

const MEDICINE_OPTIONS: VerdictOption[] = [
  { id: "take", label: "Break in and take the drug" },
  { id: "not-take", label: "Do not take the drug" }
];

export const CASE_PAIRS: CasePair[] = [
  // ------------------------------------------------------------------ development
  {
    id: "cap-and-bow",
    title: "The cap and the bow",
    split: "development",
    pivot: "What the new custom changes: the cost of the cap, or the deference that the bow shows.",
    base: "In my community's ancestral ceremony, the rite prescribes a cap of hemp. Most people now wear a silk cap, which costs much less. The only difference is the cost. I must choose which cap to wear at this year's ceremony. Should I keep the hemp cap that the rite prescribes, or wear silk as most people now do?",
    variant: "In my community's ancestral ceremony, the rite prescribes that a guest bows to the elder who presides while the guest is still at the foot of the steps, before he goes up into the hall. Most people now go up the steps first and bow when they stand level with the elder. I must choose what to do at this year's ceremony. Should I bow at the foot of the steps as the rite prescribes, or bow at the top as most people now do?",
    options: [
      { id: "old", label: "Keep the old practice that the rite prescribes" },
      { id: "new", label: "Follow the new common practice" }
    ],
    thinkers: {
      "confucius-role-ethics": {
        expect: "flip",
        base: "new",
        variant: "old",
        basis: { base: "recorded", variant: "recorded" },
        reason: "Confucius accepts the silk cap because the change is only thrift. He rejects the bow at the top of the steps because that change is arrogant, and he keeps the old practice against the majority. The passage does not say to whom the bow is made; the usual reading is a minister before his ruler, and the case puts a presiding elder in that place.",
        source: "Analects 9.3"
      }
    }
  },
  {
    id: "hold-back-or-urge",
    title: "The same question from two different people",
    split: "development",
    pivot: "The character of the person who asks: one takes things on too fast, the other waits too long.",
    base: "A friend is starting a free evening school for workers in our town. He asks me to teach there two evenings a week, from next week. It costs me no money, and I can stop when I want. I live with my father and my elder brother, and I have not told them. People who know me say that I take things on before I think, and twice this year I had to break promises that I made too fast. Should I say yes now, or first talk it over with my father and my brother?",
    variant: "A friend is starting a free evening school for workers in our town. He asks me to teach there two evenings a week, from next week. It costs me no money, and I can stop when I want. I live with my father and my elder brother, and I have not told them. People who know me say that I wait too long, and twice this year I let a good chance pass because I could not decide. Should I say yes now, or first talk it over with my father and my brother?",
    options: [
      { id: "act", label: "Say yes now, on your own judgment" },
      { id: "consult", label: "Wait, and talk it over with the father and the brother first" }
    ],
    thinkers: {
      "confucius-role-ethics": {
        expect: "flip",
        base: "consult",
        variant: "act",
        basis: { base: "recorded", variant: "recorded" },
        reason: "Two disciples ask Confucius the same question: should one act at once on what one hears? He tells Zilu, who has more than his share of energy, that his father and elder brothers are there to be consulted. He tells Ran You, who holds back, to act at once. He explains that he restrains the one and urges on the other. The recorded contrast is the temperament; only Zilu is told of his father and brothers.",
        source: "Analects 11.22 (Legge 11.21)"
      }
    }
  },
  {
    id: "credit-stakes",
    title: "The credit: a celebration, or the board's decision",
    split: "development",
    pivot: "What depends on the wrong impression: nothing but applause, or who the board puts in charge of the risks.",
    base: "I led a project that saved our company. At the staff celebration, the director thanked a senior colleague as the leader, and the room applauded him. He did little. I speak next. Nothing is recorded, and nothing depends on who is thanked: the board already has the correct facts. If I say plainly that I led the work, I get the credit that I earned, and he loses face in front of everyone. If I say nothing of my own part, the wrong impression stays. I will not say anything false. Should I say that I led the work?",
    variant: "I led a project that saved our company. At the board meeting, the director named a senior colleague as the leader. He did little. The board will now put the leader in charge of the risks that remain, and he does not understand them. What is said at this meeting is the only record. I speak next. If I say plainly that I led the work, the board knows the facts, and he loses face in front of everyone. If I say nothing of my own part, the wrong impression stays. I will not say anything false. Should I say that I led the work?",
    options: [
      { id: "claim", label: "Say plainly that you led the work" },
      { id: "deflect", label: "Say nothing of your own part" }
    ],
    thinkers: {
      "confucius-role-ethics": {
        expect: "flip",
        base: "deflect",
        variant: "claim",
        basis: { base: "inferred", variant: "inferred" },
        reason: "Where only recognition is at stake, the gentleman does not put forward his own merit: Confucius praises an officer who would not boast of his, and says that he is not troubled when others do not recognise him. Where those who decide will act on a false account, one must not let them be deceived: if names are not correct, affairs cannot be carried on to success.",
        source: "Analects 6.15 (Legge 6.13) and 1.16, for the base case; 13.3 and 14.22 (Legge 14.23: do not impose on him, and withstand him to his face), for the variant"
      }
    }
  },
  {
    id: "club-purpose",
    title: "The music club and its purpose",
    split: "development",
    pivot: "What the club was founded for: a first-class ensemble, or the teaching of beginners.",
    base: "Our music club was founded to prepare a first-class ensemble for public performance. That purpose is in its charter. This year the club has money for one thing: an advanced course for its six best players, or basic lessons for thirty members who have never had a lesson. Neither group can get this teaching anywhere else. The money cannot be divided, and there will be no more next year. I must cast the deciding vote. Which should I choose?",
    variant: "Our music club was founded to introduce people with no training to music. That purpose is in its charter. This year the club has money for one thing: an advanced course for its six best players, or basic lessons for thirty members who have never had a lesson. Neither group can get this teaching anywhere else. The money cannot be divided, and there will be no more next year. I must cast the deciding vote. Which should I choose?",
    options: [
      { id: "six", label: "Fund the advanced course for the six best players" },
      { id: "thirty", label: "Fund basic lessons for the thirty beginners" }
    ],
    thinkers: {
      "aristotle-virtue-ethics": {
        expect: "flip",
        base: "six",
        variant: "thirty",
        basis: { base: "inferred", variant: "inferred" },
        reason: "A claim to a good is measured by what that good is for. The best flutes go to the best players because playing well is what flutes are for. The claim of the six is strong where the club exists for excellent performance, and weak where it exists to teach beginners. A person with no philosophy will probably follow the charter too, so this pair is a control: it shows that the app does not always choose the six for Aristotle.",
        source: "Politics III.12; Nicomachean Ethics V.3"
      }
    }
  },
  {
    id: "debt-or-father",
    title: "The debt, the friend and the father",
    split: "development",
    pivot: "Who the other claimant is: a friend who would like a loan, or a father who must be ransomed.",
    base: "A year ago a man lent me $5,000 when I was in trouble. The loan is due this week, and he has asked for it. I have exactly $5,000. A close friend is opening a shop and asks me to lend him the same $5,000. It would help him, but he can open without it. I cannot do both. Should I repay the lender now, or give the money to my friend and make the lender wait?",
    variant: "A year ago a man lent me $5,000 when I was in trouble. The loan is due this week, and he has asked for it. I have exactly $5,000. My father has been kidnapped while he was travelling abroad. The kidnappers demand $5,000 this week, and no other person can pay it. I cannot do both. Should I repay the lender now, or pay the ransom for my father and make the lender wait?",
    options: [
      { id: "repay", label: "Repay the lender now" },
      { id: "give", label: "Give the money to the other person, and make the lender wait" }
    ],
    thinkers: {
      "maimonides-jewish-ethics": {
        expect: "flip",
        base: "repay",
        variant: "give",
        basis: { base: "inferred", variant: "inferred" },
        reason: "To repay a debt when it is due is an obligation, and a loan to a friend who can manage without it does not set it aside. The ransom of captives comes before the support of the poor, and there is no greater commandment; a father's life is at stake.",
        source: "Mishneh Torah, Hilkhot Matnot Aniyim 8:10 (ransom of captives); Hilkhot Malveh ve-Loveh 1:3 (repayment of a debt)"
      },
      "aristotle-virtue-ethics": {
        expect: "flip",
        base: "repay",
        variant: "give",
        basis: { base: "recorded", variant: "recorded" },
        reason: "For the most part we must return a benefit before we oblige a friend, as we must repay a loan before we make one. But perhaps not always: Aristotle's example is a man who must either pay the person who ransomed him or ransom his father, and he judges that it would seem that the father comes first. Both the relation and the stakes change in his example, and in this pair.",
        source: "Nicomachean Ethics IX.2"
      }
    }
  },
  {
    id: "experienced-eye",
    title: "The unease of a beginner, and of an old auditor",
    split: "development",
    pivot: "The experience of the person who feels the unease: none, or thirty years.",
    base: "Our tenants' association must choose a treasurer. On every fact that I can check, Mr R is the best candidate: experience, references, a clean record. But in two meetings, the way he spoke about money and about people made me deeply uneasy. I cannot point to one fact that supports this feeling. I joined the committee this year, and I have never before had to judge a person for a position of trust. The other candidate is adequate. The vote is tonight. There is no way to check further, and I cannot abstain. My vote decides. Should I vote for Mr R?",
    variant: "Our tenants' association must choose a treasurer. On every fact that I can check, Mr R is the best candidate: experience, references, a clean record. But in two meetings, the way he spoke about money and about people made me deeply uneasy. I cannot point to one fact that supports this feeling. I have audited small charities for thirty years, and I have often had to judge whom to trust with money. The other candidate is adequate. The vote is tonight. There is no way to check further, and I cannot abstain. My vote decides. Should I vote for Mr R?",
    options: [
      { id: "record", label: "Vote for Mr R, on the evidence" },
      { id: "feeling", label: "Vote for the other candidate, on the strength of the unease" }
    ],
    thinkers: {
      "hume-sentimentalism": {
        expect: "flip",
        base: "record",
        variant: "feeling",
        basis: { base: "inferred", variant: "inferred" },
        reason: "A wise man proportions his belief to the evidence. A newcomer's unease rests on no experience, so it is weak evidence against a clean record. All reasoning about matters of fact rests on custom formed by experience; thirty years of judging whom to trust with money is such experience, and the unease it produces is evidence of that kind.",
        source: "Enquiry concerning Human Understanding, sec. 10 part 1 (proportion belief to the evidence); sec. 5 (custom is the great guide of human life); 'Of the Standard of Taste' (the judgment of a critic formed by long practice)"
      },
      "aristotle-virtue-ethics": {
        expect: "flip",
        base: "record",
        variant: "feeling",
        basis: { base: "inferred", variant: "inferred" },
        reason: "We should attend to the undemonstrated judgments of experienced people not less than to demonstrations, because experience has given them an eye to see correctly. The feeling of a person with no experience has no such standing. The text says 'not less than'; it does not say that the experienced judgment must win.",
        source: "Nicomachean Ethics VI.11"
      }
    }
  },
  {
    id: "lie-stakes",
    title: "A lie at the door: for convenience, or to prevent violence",
    split: "development",
    pivot: "What the lie prevents: a tedious evening, or a violent attack.",
    base: "A friend is in my flat. A man whom she knows is at my door now and asks if she is here. He is harmless, but he talks for hours, and she does not want to see him tonight. If I refuse to answer, he will understand that she is here and stay for the evening. If I say that she left town, he will go away. Should I lie to him?",
    variant: "A friend is hiding in my flat from her violent former partner. He is at my door now and asks if she is here. The police will arrive in ten minutes. If I refuse to answer, he will understand that she is here and force his way in. If I say that she left town, he will go away. Should I lie to him?",
    options: [
      { id: "lie", label: "Lie: say that she is not there" },
      { id: "no-lie", label: "Do not lie: tell the truth or refuse to answer" }
    ],
    thinkers: {
      "mill-utilitarianism": {
        expect: "flip",
        base: "no-lie",
        variant: "lie",
        basis: { base: "recorded", variant: "recorded" },
        reason: "Mill says that a person who lies for a convenience to himself or to another acts as an enemy of mankind, because he weakens the trust in human assertion. In the same passage he allows the exception: to keep a fact from a malefactor, when that saves a person from great and unmerited evil and can only be done by denial.",
        source: "Utilitarianism, ch. 2 (the passage on expediency and veracity, near the end)"
      },
      "kant-deontology": {
        expect: "same",
        base: "no-lie",
        variant: "no-lie",
        basis: { base: "recorded", variant: "recorded" },
        reason: "The duty not to lie does not depend on what the lie would prevent. Kant denies a right to lie even to a murderer who asks where his victim is.",
        source: "'On a Supposed Right to Lie from Philanthropy' (1797); Metaphysics of Morals, Doctrine of Virtue, §9"
      }
    }
  },
  {
    id: "thin-ice",
    title: "The man who walks onto the ice",
    split: "development",
    pivot: "The danger and his knowledge of it: a certain harm that he does not know of, with no time to warn him, or a risk that he knows and accepts.",
    base: "My neighbour is walking onto the frozen lake to fish. An hour ago I saw workers cut a wide channel in the ice just where he is heading, and new snow now hides it. He does not know. He wears headphones and cannot hear me shout, and he will reach the channel in seconds. I am close enough to seize his arm and pull him back. Should I stop him by force?",
    variant: "My neighbour is walking onto the frozen lake to fish. The ice is thin this week, and there is a real risk that it will break. He knows this: I have told him, the warning signs are posted, and he says that the fishing is worth the risk to him. He is an adult of sound mind, and no one depends on him. I am close enough to seize his arm, and strong enough to keep him off the ice. Should I stop him by force?",
    options: [
      { id: "stop", label: "Stop him by force" },
      { id: "warn", label: "Do not use force: warn him at most, and let him decide" }
    ],
    thinkers: {
      "mill-utilitarianism": {
        expect: "flip",
        base: "stop",
        variant: "warn",
        basis: { base: "recorded", variant: "recorded" },
        reason: "Mill's example is a man about to cross an unsafe bridge. If the harm is certain and there is no time to warn him, one may seize him, because he does not desire to fall into the river. If there is only a danger, he alone can judge if the risk is worth it, and he ought only to be warned, unless he is a child, delirious, or too excited or absorbed to reflect. A person with no philosophy will probably answer in the same way, so this pair is a control.",
        source: "On Liberty, ch. 5 (the unsafe bridge)"
      }
    }
  },
  {
    id: "drug-stakes",
    title: "The drug: a life, or two weeks of pain",
    split: "development",
    pivot: "What the drug prevents: the wife's death, or two weeks of severe pain.",
    base: "My wife will die within weeks without a drug. The only pharmacist who has it asks $40,000. I have raised $8,000, and he refuses a lower price or later payment. I have tried doctors, charities and the courts, and there is no time left. I can break into his store tonight and take the drug. I would leave the $8,000 there. Should I take it?",
    variant: "My wife has a painful illness. Without a drug she will be in severe pain for the next two weeks, until a cheaper drug arrives. She will not die. The only pharmacist who has it asks $40,000. I have raised $8,000, and he refuses a lower price or later payment. I have tried doctors, charities and the courts, and there is no time left. I can break into his store tonight and take the drug. I would leave the $8,000 there. Should I take it?",
    options: MEDICINE_OPTIONS,
    thinkers: {
      "hume-sentimentalism": {
        expect: "flip",
        base: "take",
        variant: "not-take",
        basis: { base: "recorded", variant: "inferred" },
        reason: "In extreme necessity, as after a shipwreck or in a besieged city perishing of hunger, the rules of property give way, because they exist for their usefulness. Two weeks of pain, with a cheaper drug coming, is not that kind of necessity, and the rule holds.",
        source: "Enquiry concerning the Principles of Morals, sec. 3 part 1"
      },
      "maimonides-jewish-ethics": {
        expect: "flip",
        base: "take",
        variant: "not-take",
        basis: { base: "inferred", variant: "inferred" },
        reason: "Saving a life sets aside the prohibition of theft. Pain without danger to life does not, so the property of the pharmacist must not be taken.",
        source: "Mishneh Torah, Hilkhot Yesodei ha-Torah 5:1-2; Hilkhot Hovel u-Mazik 8:2"
      },
      "mill-utilitarianism": {
        expect: "flip",
        base: "take",
        variant: "not-take",
        basis: { base: "recorded", variant: "inferred" },
        reason: "Mill gives the first case himself: to save a life, it can be a duty to steal or take by force the necessary food or medicine. The saving of a life is his example of a social duty that is important enough to overrule a rule of justice. He does not say if two weeks of severe pain is important enough; we infer that it is not.",
        source: "Utilitarianism, ch. 5 (near the end)"
      },
      "aristotle-virtue-ethics": {
        expect: "same",
        base: "not-take",
        variant: "not-take",
        basis: { base: "inferred", variant: "inferred" },
        reason: "Aristotle names theft among the acts that have no mean and are always wrong. Acts done under great pressure can earn pardon, but pardon is not the same as doing rightly. The open question is if this taking is 'theft' in his sense.",
        source: "Nicomachean Ethics II.6; III.1"
      },
      "kant-deontology": {
        expect: "same",
        base: "not-take",
        variant: "not-take",
        basis: { base: "inferred", variant: "inferred" },
        reason: "Necessity does not make a wrong act lawful. Kant's example of the 'right of necessity' is a man who takes another's life to save his own; theft for a wife's life is an extension.",
        source: "Metaphysics of Morals, Doctrine of Right, Appendix to the Introduction (the right of necessity)"
      }
    }
  },
  {
    id: "wallet-owner",
    title: "The found wallet: a rich owner, or a poor one",
    split: "development",
    pivot: "Who the owner is: one of the richest men in town, or a pensioner who lives on very little.",
    base: "I found a wallet in the street with $600 and an identity card. I know the name: the owner is one of the richest men in our town, and $600 is nothing to him. No one saw me. I need money this month. Should I return the wallet with the money?",
    variant: "I found a wallet in the street with $600 and an identity card. I know the name: the owner is a pensioner who lives on very little. No one saw me. I need money this month. Should I return the wallet with the money?",
    control: true,
    options: [
      { id: "return", label: "Return the wallet with the money" },
      { id: "keep", label: "Keep the money" }
    ],
    thinkers: {
      "mencius-confucianism": {
        expect: "same",
        base: "return",
        variant: "return",
        basis: { base: "inferred", variant: "inferred" },
        reason: "To take what is not one's own is against rightness. The owner's wealth does not change whose money it is.",
        source: "Mencius 7A33"
      },
      "hume-sentimentalism": {
        expect: "same",
        base: "return",
        variant: "return",
        basis: { base: "inferred", variant: "inferred" },
        reason: "Hume uses this case: justice requires us to restore property even to a rich miser, or to a person who will use it badly, where benevolence alone would not. The rule is useful only if it is kept in every case, without regard to the merit or need of the owner.",
        source: "Treatise of Human Nature 3.2.2 (the miser and the seditious bigot, 3.2.2.22; a single act of justice may be contrary to public interest, but the whole scheme is necessary)"
      },
      "maimonides-jewish-ethics": {
        expect: "same",
        base: "return",
        variant: "return",
        basis: { base: "inferred", variant: "inferred" },
        reason: "A lost object must be returned to its owner, and an identity card makes the owner known. The texts do not mention the owner's wealth; that it changes nothing is our inference.",
        source: "Mishneh Torah, Hilkhot Gezelah va-Avedah 11:1 (return of lost objects); 11:6 and 13:1 (marks of the owner)"
      },
      "mill-utilitarianism": {
        expect: "same",
        base: "return",
        variant: "return",
        basis: { base: "inferred", variant: "inferred" },
        reason: "It is unjust to keep what belongs to another, and Mill is not a calculator of each act: the rules of justice bind unless a much greater duty, such as the saving of a life, overrules them. The owner's wealth is not such a duty.",
        source: "Utilitarianism, ch. 5"
      },
      "kant-deontology": {
        expect: "same",
        base: "return",
        variant: "return",
        basis: { base: "inferred", variant: "inferred" },
        reason: "A maxim of keeping found property when the owner is rich cannot be a universal law. The owner's wealth changes nothing.",
        source: "Groundwork, Section II"
      },
      "aristotle-virtue-ethics": {
        expect: "same",
        base: "return",
        variant: "return",
        basis: { base: "inferred", variant: "inferred" },
        reason: "To gain from what belongs to another is the mark of the unjust and grasping person, whoever the other is.",
        source: "Nicomachean Ethics V.1-2"
      },
      "confucius-role-ethics": {
        expect: "same",
        base: "return",
        variant: "return",
        basis: { base: "inferred", variant: "inferred" },
        reason: "At the sight of gain, think of what is right. Poverty is not to be escaped by the wrong way.",
        source: "Analects 14.12; 4.5"
      }
    }
  },
  {
    id: "pardon-the-surgeon",
    title: "A pardon for the town's surgeon: guilty, or innocent",
    split: "development",
    pivot: "If the convicted surgeon did the attack: he did, or new evidence proves that he did not.",
    base: "I am the governor of a small state, and I alone can grant a pardon. The only surgeon in our town was convicted of an attack that left a man unable to walk. The evidence is clear, and he admits it. The sentence is five years in prison. He is no danger to anyone now. The nearest other surgeon is 200 kilometres away, so without him some patients will probably die. Most of the town has signed a petition for his pardon. No court can change the sentence; only I can. Should I pardon him?",
    variant: "I am the governor of a small state, and I alone can grant a pardon. The only surgeon in our town was convicted of an attack that left a man unable to walk. New evidence, which I have checked, proves that he did not do it: another man did. The sentence is five years in prison. He is no danger to anyone now. The nearest other surgeon is 200 kilometres away, so without him some patients will probably die. Most of the town has signed a petition for his pardon. No court can change the sentence; only I can. Should I pardon him?",
    options: [
      { id: "pardon", label: "Grant the pardon" },
      { id: "no-pardon", label: "Do not grant the pardon: the sentence stands" }
    ],
    thinkers: {
      "kant-deontology": {
        expect: "flip",
        base: "no-pardon",
        variant: "pardon",
        basis: { base: "recorded", variant: "recorded" },
        reason: "Punishment may never be imposed merely as a means to some other good; it is imposed only because the person committed a crime, and he must first be found guilty and punishable. So the innocent man must go free, and the town's need of a surgeon is no reason to punish or to spare the guilty one. The head of state may use the right to pardon only for crimes against himself, never for crimes of subjects against one another: there, to leave the crime unpunished is the greatest wrong to the subjects.",
        source: "Metaphysics of Morals, Doctrine of Right, §49, General Remark E (the right to punish and the right to grant clemency). Checked in Hastie's translation (1887), where the right to pardon is 'the most delicate of all rights'."
      }
    }
  },
  {
    id: "mourning-leave",
    title: "Time to mourn: a mother, or a colleague",
    split: "development",
    pivot: "Who has died: my mother, or a colleague I worked with for twelve years.",
    base: "My mother died last month. I have taken two weeks off. My employer would allow me three more months of unpaid leave, to stay at home and mourn, and not go back to the office. My team would carry my work, and I would lose income that I can spare only with difficulty. Should I go back to work now, or take the three months to mourn?",
    variant: "A colleague with whom I worked closely for twelve years died last month. I have taken two weeks off. My employer would allow me three more months of unpaid leave, to stay at home and mourn, and not go back to the office. My team would carry my work, and I would lose income that I can spare only with difficulty. Should I go back to work now, or take the three months to mourn?",
    options: [
      { id: "return", label: "Go back to work now" },
      { id: "mourn", label: "Take the three months of unpaid leave to mourn" }
    ],
    thinkers: {
      "confucius-role-ethics": {
        expect: "flip",
        base: "mourn",
        variant: "return",
        basis: { base: "recorded", variant: "inferred" },
        reason: "When Zai Wo says that three years of mourning for parents is too long, Confucius asks if he would be at ease eating fine rice and wearing fine clothes, and calls him without humaneness: a child is not free of its parents' arms until it is three years old. The mourning owed to a parent is not owed to a colleague; care is graded by relationship.",
        source: "Analects 17.21 (Legge numbering; Lau numbering not checked); 1.9 (care over the funeral rites of parents)"
      },
      "mencius-confucianism": {
        expect: "flip",
        base: "mourn",
        variant: "return",
        basis: { base: "recorded", variant: "inferred" },
        reason: "When the heir of Teng asks how to mourn his father, Mencius insists on the full three years, against the objections of the officials, and says that this is the way for parents. No such rite is owed to a colleague.",
        source: "Mencius 3A2"
      },
      "maimonides-jewish-ethics": {
        expect: "same",
        base: "return",
        variant: "return",
        basis: { base: "recorded", variant: "recorded" },
        reason: "The law fixes the measure of mourning: three days for weeping, seven for lament, thirty days for other restrictions, and one must not grieve beyond that measure (though one who does not mourn at all is cruel). Work is forbidden to the mourner in the first seven days. For a parent, some restrictions last twelve months (for example, festive gatherings), but not the ban on work. A month after the death, for a parent or for a colleague, one goes back to work.",
        source: "Mishneh Torah, Hilkhot Avel 13:11-12 (do not mourn beyond the measure); 5:1 and 5:10 (work in the first seven days)"
      },
    }
  },
  {
    id: "anger-at-the-meeting",
    title: "The false charge against my friend",
    split: "development",
    pivot: "Why the colleague made the false charge: by an honest mistake, or on purpose, to humiliate my friend.",
    base: "At a team meeting, a colleague said that my friend, who was not there, takes money from the petty cash. It is false. He believed it: he misread an expense record, and he did not mean to harm my friend. A few people believed him. I will correct him now, in front of everyone, in any case. Should I let my anger show when I do it?",
    variant: "At a team meeting, a colleague said that my friend, who was not there, takes money from the petty cash. It is false. He knew that it was false: he said it on purpose, to humiliate my friend, whom he dislikes. A few people believed him. I will correct him now, in front of everyone, in any case. Should I let my anger show when I do it?",
    options: [
      { id: "anger", label: "Correct him and let your anger show" },
      { id: "calm", label: "Correct him without showing anger" }
    ],
    thinkers: {
      "aristotle-virtue-ethics": {
        expect: "flip",
        base: "calm",
        variant: "anger",
        basis: { base: "inferred", variant: "inferred" },
        reason: "The good-tempered person is angry at the right things, with the right people, and in the right way; he is inclined to make allowances rather than to take revenge. But those who are not angry at the things at which they should be angry are thought foolish, and to put up with insults to one's friends is slavish. An honest mistake calls for allowance; a deliberate false charge against a friend is a fit object of anger. Aristotle does not say that the anger must be shown, and the same chapter blames those who retaliate openly, so the variant is our reading.",
        source: "Nicomachean Ethics IV.5"
      },
      "maimonides-jewish-ethics": {
        expect: "same",
        base: "calm",
        variant: "calm",
        basis: { base: "recorded", variant: "recorded" },
        reason: "Anger is one of the two traits where the middle way is not enough: one must go to the far end and train oneself not to be angry even at something that deserves anger. If a show of anger is needed, as with one's children, one shows it while remaining calm inside. A rebuke is given in private and gently.",
        source: "Mishneh Torah, Hilkhot De'ot 2:3 (anger); 6:7 (how to rebuke)"
      },
    }
  },
  {
    id: "loan-i-cannot-repay",
    title: "The loan I cannot repay",
    split: "development",
    pivot: "What the money is for: a holiday, or an operation without which my child will die.",
    base: "I need $3,000 for a holiday that I have wanted for years. A wealthy acquaintance will lend it only if I promise to repay it within a year. I know that I will not be able to repay it, now or later. If I make the promise, he will lend the money; if I tell him the truth, he will not. No one else will lend to me. Should I make the promise?",
    variant: "I need $3,000 for an operation without which my child will die. A wealthy acquaintance will lend it only if I promise to repay it within a year. I know that I will not be able to repay it, now or later. If I make the promise, he will lend the money; if I tell him the truth, he will not. No one else will lend to me. Should I make the promise?",
    options: [
      { id: "promise", label: "Make the promise and take the loan" },
      { id: "no-promise", label: "Do not make a promise that you know you cannot keep" }
    ],
    thinkers: {
      "kant-deontology": {
        expect: "same",
        base: "no-promise",
        variant: "no-promise",
        basis: { base: "recorded", variant: "inferred" },
        reason: "The base is Kant's own example: a man forced by need to borrow money, who knows that he cannot repay, may not make a false promise. The maxim cannot be a universal law, because promising would then be impossible, and the lender would be used merely as a means. The variant is not in the text, but the size of the need does not make an exception to a perfect duty.",
        source: "Groundwork II (the false promise)"
      },
      "mill-utilitarianism": {
        expect: "flip",
        base: "no-promise",
        variant: "promise",
        basis: { base: "inferred", variant: "inferred" },
        reason: "Trust in what people say is one of the main supports of social well-being, so a false promise for one's own pleasure is wrong. Mill allows exceptions to the secondary rules when they conflict with a greater good: his named exception to veracity is to save a person from great and unmerited evil, and a child's life outweighs a loss of $3,000 to a wealthy lender. This is an extension: the named exception concerns withholding facts from a malefactor, not deceiving an innocent lender.",
        source: "Utilitarianism, ch. 2 (veracity and its exceptions); ch. 5 (justice gives way to a greater duty, such as saving a life)"
      },
      "maimonides-jewish-ethics": {
        expect: "flip",
        base: "no-promise",
        variant: "promise",
        basis: { base: "inferred", variant: "inferred" },
        reason: "A false promise is deception, which is forbidden even in one word, and 'the wicked borrows and does not repay'. But when a life is at stake, every commandment gives way except the three, and deceit is not among them. Applying that rule, which concerns a person forced to transgress, to saving one's child is our inference.",
        source: "Mishneh Torah, Hilkhot De'ot 2:6 (no deception); Hilkhot Malveh ve-Loveh 1:3; Hilkhot Yesodei ha-Torah 5:1-2"
      },
    }
  },
  // ------------------------------------------------------------------ holdout
  {
    id: "deposit-stakes",
    title: "The deposit that no one can trace",
    split: "holdout",
    pivot: "What the keeper needs the money for: nothing, or the life of his child.",
    base: "A man left $20,000 with me for safekeeping, with no paper to record it. He has died. His heirs know nothing of the money. They are rich and hard-hearted, and they waste what they have. I know that they would not help me. I am comfortable and have no special need of the money. No one could ever find out. Should I return the money to the heirs?",
    variant: "A man left $20,000 with me for safekeeping, with no paper to record it. He has died. His heirs know nothing of the money. They are rich and hard-hearted, and they waste what they have. I know that they would not help me. My small child will die within months without a treatment that costs $20,000, and I have no other way to pay for it. No one could ever find out. Should I return the money to the heirs?",
    options: [
      { id: "return", label: "Tell the heirs and return the money" },
      { id: "keep", label: "Do not return it: keep the money and use it" }
    ],
    thinkers: {
      "kant-deontology": {
        expect: "same",
        base: "return",
        variant: "return",
        basis: { base: "recorded", variant: "inferred" },
        reason: "Kant uses this case himself. The keeper of an untraceable deposit sees his wife and children oppressed by want, and the heirs are rich, hard-hearted and wasteful; he must still return it. A child's death is one step beyond Kant's text.",
        source: "'On the Common Saying: That May Be Correct in Theory' (1793), Part I; Critique of Practical Reason, §4, Remark (the deposit)"
      },
      "mill-utilitarianism": {
        expect: "flip",
        base: "return",
        variant: "keep",
        basis: { base: "inferred", variant: "inferred" },
        reason: "It is unjust to withhold what belongs to another, and in the base case nothing outweighs that. But Mill says that to save a life it can be a duty to take what is necessary. His example is food or medicine, not a deposit.",
        source: "Utilitarianism, ch. 5 (the list of unjust acts; the exception to save a life)"
      }
    }
  },
  {
    id: "drunk-on-duty",
    title: "Drunk at home, or drunk on call",
    split: "holdout",
    pivot: "If he was on call for the crew on the night when he was drunk.",
    base: "I chair the committee of our volunteer lifeboat station. One member of the crew got very drunk at home on Saturday night. He was not on call that night, and he was sober and fit for his next duty. No one depends on him at home. Some members say that his drinking shames the station, and they want me to suspend him. Should I suspend him?",
    variant: "I chair the committee of our volunteer lifeboat station. One member of the crew got very drunk at home on Saturday night. He was the helmsman on call that night. No call came, so no harm was done. No one depends on him at home. Some members say that his drinking shames the station, and they want me to suspend him. Should I suspend him?",
    options: [
      { id: "suspend", label: "Suspend him" },
      { id: "no-penalty", label: "Do not suspend him" }
    ],
    thinkers: {
      "mill-utilitarianism": {
        expect: "flip",
        base: "no-penalty",
        variant: "suspend",
        basis: { base: "recorded", variant: "recorded" },
        reason: "Mill's own example: no person ought to be punished simply for being drunk, but a soldier or a policeman should be punished for being drunk on duty. Conduct leaves the province of liberty when it violates a definite duty to others.",
        source: "On Liberty, ch. 4"
      }
    }
  },
  {
    id: "far-travel",
    title: "Three years abroad, with or without a fixed place",
    split: "holdout",
    pivot: "How he would live abroad: on the move with no address, or in one city where his parents can reach him.",
    base: "I am 28. My parents are in their sixties and in good health, and they need no care. My sister lives near them. I want to spend the next three years in Asia, to study the languages and the old temples. I would move from place to place with no fixed route and no address, and for weeks at a time no one could reach me. I will not change this plan: if I go, I go in this way. My parents are sad that I will leave, but they do not forbid it. Should I go?",
    variant: "I am 28. My parents are in their sixties and in good health, and they need no care. My sister lives near them. I want to spend the next three years in Asia, to study the languages and the old temples. I would live the whole time in one city, at a fixed address, and my parents could reach me by telephone on any day. My parents are sad that I will leave, but they do not forbid it. Should I go?",
    options: [
      { id: "go", label: "Go" },
      { id: "stay", label: "Do not go" }
    ],
    thinkers: {
      "confucius-role-ethics": {
        expect: "flip",
        base: "stay",
        variant: "go",
        basis: { base: "recorded", variant: "inferred" },
        reason: "While his parents are alive, a son may not travel far. If he does travel, he must have a fixed place. The first half speaks to the base case. The variant depends on a reading of the second half as a permission, and not every reader takes it so.",
        source: "Analects 4.19"
      },
      "mill-utilitarianism": {
        expect: "same",
        base: "go",
        variant: "go",
        basis: { base: "inferred", variant: "inferred" },
        reason: "The parents need nothing from him, so the choice concerns his own life. A person must choose his own plan of life, and the manner of his travel is his own affair.",
        source: "On Liberty, ch. 3; ch. 4 (conduct that concerns only oneself)"
      }
    }
  },
  {
    id: "lamb-at-the-shrine",
    title: "The lamb at the shrine",
    split: "holdout",
    pivot: "What the change does: it saves money in a rite that is still performed, or it ends the last part of a rite that has lapsed.",
    base: "Each spring our clan's ancestral rite calls for an offering of a whole lamb. By custom we buy it from the old temple farm, which now charges three times what any other farm charges. Nothing in the rite says where the lamb must come from: the custom began when the temple farm was the only farm. The rite is still performed each year, and the elders still attend. The treasurer proposes that we buy the lamb from a cheaper farm. Should I support the change?",
    variant: "Each spring our clan's ancestral rite calls for an offering of a whole lamb. For ten years the elders have not come, and the ceremony is no longer performed. But each spring the lamb is still bought and laid at the shrine. The treasurer proposes that we stop buying it, since the ceremony is no longer held, and save the money. Should I support the change?",
    options: [
      { id: "keep", label: "Keep the old practice" },
      { id: "change", label: "Support the change" }
    ],
    thinkers: {
      "confucius-role-ethics": {
        expect: "flip",
        base: "change",
        variant: "keep",
        basis: { base: "inferred", variant: "recorded" },
        reason: "The variant follows the recorded case: a disciple wants to end the offering of a sheep at the ceremony of the first day of the month, and Confucius answers, 'You love the sheep; I love the rite.' The text gives no reason for the disciple's wish; the traditional commentary says that the ceremony itself had lapsed (not checked). The base case follows the silk cap: a change that is only thrift, and leaves the rite whole, is acceptable.",
        source: "Analects 3.17 (the variant); 9.3 (the base case)"
      }
    }
  },
  {
    id: "favour-asked",
    title: "A favour asked by a benefactor, or by a man who wronged me",
    split: "holdout",
    pivot: "What the colleague did to me years ago: a kindness, or an injury.",
    base: "Years ago a colleague put in a good word for me when I needed a job, and it helped me to get it. We are not close. Now he is moving house, and he asks me to give up my Saturday to help him carry furniture. Other people could help him. Should I give up my Saturday?",
    variant: "Years ago a colleague took a client from me by a lie, and it cost me a year's bonus. He has never apologised. We are not close. Now he is moving house, and he asks me to give up my Saturday to help him carry furniture. Other people could help him. Should I give up my Saturday?",
    options: [
      { id: "help", label: "Help him" },
      { id: "straight", label: "Decline: deal with him fairly, with no revenge and no special favour" }
    ],
    thinkers: {
      "confucius-role-ethics": {
        expect: "flip",
        base: "help",
        variant: "straight",
        basis: { base: "recorded", variant: "recorded" },
        reason: "Asked about repaying injury with kindness, Confucius answers: then with what will you repay kindness? Repay injury with uprightness, and repay kindness with kindness. Readers differ on 'uprightness': some take it as 'respond as is right', which could allow the help.",
        source: "Analects 14.34 (Legge 14.36)"
      }
    }
  },
  {
    id: "friend-who-changed",
    title: "The friend who cheated: ashamed, or proud of it",
    split: "holdout",
    pivot: "How the friend answers when he is confronted: with shame and repair, or with pride and refusal.",
    base: "For twenty years my closest friend and I have been friends because I admired his honesty. Last month I learned that he has been cheating the customers of his business. When I confronted him, he was ashamed. He has stopped, he is paying the customers back, and he has asked me to help him keep to it. Should I keep him as a close friend?",
    variant: "For twenty years my closest friend and I have been friends because I admired his honesty. Last month I learned that he has been cheating the customers of his business. When I confronted him, he laughed. I have raised it three times since. He says that everyone does it, he is proud of what he makes, and he will not stop. Should I keep him as a close friend?",
    options: [
      { id: "stay", label: "Stay his close friend, and try to help him change" },
      { id: "end", label: "End the close friendship" }
    ],
    thinkers: {
      "aristotle-virtue-ethics": {
        expect: "flip",
        base: "stay",
        variant: "end",
        basis: { base: "recorded", variant: "recorded" },
        reason: "Aristotle asks if a friendship must end when a friend who was loved as good becomes bad. If the friend can be reformed, one should come to the aid of his character or his property. If he is incurable in his wickedness, the friendship may end: it was not to a man of this sort that one was a friend. Aristotle presents the ending as nothing strange, which is nearer to a permission than to a duty.",
        source: "Nicomachean Ethics IX.3"
      }
    }
  }
];

/**
 * The passages behind the holdout pairs. Decision of 2026-11-21: keep these passages out of every
 * prompt (and so out of any note on a philosopher), so that the holdout measures what the model
 * concludes and not what the prompt gives it. The model may still know them from its training.
 * variants.test.ts checks every variant's prompts against these patterns. The patterns are narrow on
 * purpose: Analects 13.18 (a stolen sheep, "the upright") and Analects 9.3 (the silk cap) are used by
 * development cases and must stay allowed.
 */
export interface HoldoutPassage {
  pairId: string;
  passage: string;
  patterns: RegExp[];
}

export const HOLDOUT_PASSAGES: HoldoutPassage[] = [
  {
    pairId: "deposit-stakes",
    passage: "Kant's untraceable deposit (Theory and Practice, Part I; Critique of Practical Reason, §4, Remark)",
    patterns: [/\bdeposit/i, /common saying/i, /theory and practice/i]
  },
  {
    pairId: "drunk-on-duty",
    passage: "Mill: drunk on duty (On Liberty, ch. 4)",
    patterns: [/\bdrunk/i, /\bon duty\b/i]
  },
  {
    pairId: "far-travel",
    passage: "Analects 4.19: do not travel far while the parents are alive",
    patterns: [/analects 4\.19\b/i, /\btravel(s|led|ling)? far\b/i, /\bfixed (place|abode|destination|address)/i]
  },
  {
    pairId: "lamb-at-the-shrine",
    passage: "Analects 3.17: 'You love the sheep; I love the rite'",
    patterns: [/analects 3\.17\b/i, /\blove the (rite|ritual|ceremony)/i, /(offering|sacrifice) of (a|the) sheep/i, /first (day )?of the month/i]
  },
  {
    pairId: "favour-asked",
    passage: "Analects 14.34 (Legge 14.36): repay injury with uprightness",
    patterns: [/analects 14\.3[46]\b/i, /\brepay\w* (an? )?(injury|injuries|wrong|resentment)/i, /\b(injury|resentment) with (kindness|virtue|uprightness|straightness)/i]
  },
  {
    pairId: "friend-who-changed",
    passage: "Nicomachean Ethics IX.3: the friend who becomes bad",
    patterns: [/\bIX\.3\b/, /nicomachean ethics (IX|9)\.3\b/i, /\bincurabl/i, /friend\w* (who|that) (becomes|became|turns|turned) (bad|wicked)/i]
  }
];
