/**
 * Answer key for the verdict check.
 *
 * Each dilemma has a small set of fixed options. For each test philosopher, the key records the
 * option that the philosopher's own texts lead to, with a source. For each axis that should decide
 * the dilemma, the key records the option at each end of the axis.
 *
 * STATUS: PROVISIONAL. Written by an AI model on 2026-11-20. Not yet checked by a philosopher.
 * "clear" and "disputed" are the author's estimates. Treat every entry as a claim for review.
 *
 * Reference check (2026-11-20, by a second AI model, against public-domain translations online):
 * the passages exist and say what the key reports, after the corrections from that check.
 * Second review (2026-11-20, reviews/second-reviewer-2026-11.md; the reviewer is not identified):
 * 24 answers were judged "open" and moved to the `open` field of their dilemma; 4 answers were changed.
 * The entry added after that review (sheep-witness) has had a reference check only.
 * NOT checked: Analects numbers in D. C. Lau's edition (the text was checked in Legge, whose
 * numbers differ by one or two in some books); Bekker line numbers for Aristotle; Academy page
 * numbers for Kant; section numbers of the Metaphysics of Morals in modern editions.
 */
import type { Axis } from "../../shared/contracts";

/** The four thinkers that the key was first written for. The model knows them best. */
export const CORE_PHILOSOPHERS = [
  "mill-utilitarianism",
  "kant-deontology",
  "aristotle-virtue-ethics",
  "confucius-role-ethics"
] as const;

/**
 * Transfer test (added 2026-11-21): thinkers outside the core four, less known to the model, each with
 * recorded positions on cases of this kind. They show whether a prompt change works beyond the core four.
 * They have no lens notes. Their entries had a reference check only where the comment says so.
 */
export const TRANSFER_PHILOSOPHERS = [
  "mencius-confucianism",
  "hume-sentimentalism",
  "maimonides-jewish-ethics"
] as const;

export const TEST_PHILOSOPHERS = [...CORE_PHILOSOPHERS, ...TRANSFER_PHILOSOPHERS] as const;
export type TestPhilosopherId = (typeof TEST_PHILOSOPHERS)[number];
export type CorePhilosopherId = (typeof CORE_PHILOSOPHERS)[number];

/** Short names for reports and for the key document. */
export const PHILOSOPHER_NAMES: Record<TestPhilosopherId, string> = {
  "mill-utilitarianism": "Mill",
  "kant-deontology": "Kant",
  "aristotle-virtue-ethics": "Aristotle",
  "confucius-role-ethics": "Confucius",
  "mencius-confucianism": "Mencius",
  "hume-sentimentalism": "Hume",
  "maimonides-jewish-ethics": "Maimonides"
};

/**
 * The three axes of the app, plus one candidate axis that the app does not have yet:
 * "everyone equally" (negative end) against "my own people first" (positive end).
 */
export type KeyAxis = Axis | "impartialPartial";

export const AXIS_POLES: Record<KeyAxis, { negative: string; positive: string }> = {
  outcomesPrinciples: { negative: "Outcomes", positive: "Principles" },
  individualCollective: { negative: "Individual", positive: "Collective" },
  reasonIntuition: { negative: "Reason", positive: "Intuition" },
  impartialPartial: { negative: "Everyone equally", positive: "My own people first" }
};

export interface VerdictOption {
  id: string;
  label: string;
}

export interface ExpectedVerdict {
  /** Option id that the philosopher's texts lead to. */
  option: string;
  /** "clear": a text speaks to the case, or the doctrine leaves little doubt. "disputed": a defensible reading; scholars could argue for another option. */
  confidence: "clear" | "disputed";
  /** Other option ids that also count as a match. Use only for a disputed entry. */
  alsoAccept?: string[];
  reason: string;
  source: string;
}

export interface AxisExpectation {
  axis: KeyAxis;
  /** Option id for a person at the negative end of the axis, with the other axes balanced. */
  negative: string;
  /** Option id for a person at the positive end. */
  positive: string;
}

export interface VerdictDilemma {
  id: string;
  title: string;
  /** "holdout" dilemmas are for the final measurement. Do not use them to tune a prompt. */
  split: "development" | "holdout";
  /**
   * "split": the key expects different answers from different views, or tests one view or one axis.
   * "agreement": all views give the same answer. "open": kept for the record; nothing is scored.
   */
  kind: "split" | "agreement" | "open";
  text: string;
  options: VerdictOption[];
  /** A philosopher is left out where the texts give no grounded answer. */
  philosophers: Partial<Record<TestPhilosopherId, ExpectedVerdict>>;
  /** Thinkers for whom a reviewer judged that the texts do not settle this case, with the reason. Not scored. */
  open?: Partial<Record<TestPhilosopherId, string>>;
  /** Axes that should decide this dilemma. Empty for agreement dilemmas, and where no axis decides. */
  axes: AxisExpectation[];
  axisNote?: string;
}

export const VERDICT_DILEMMAS: VerdictDilemma[] = [
  {
    id: "father-workshop",
    title: "The father and the workshop tools",
    split: "development",
    kind: "split",
    text: "My father took tools from our community workshop without permission. He told me, and he asks me to protect him. Tomorrow the committee will ask each volunteer directly if they know who took the tools. We are a small group: if I refuse to answer, everyone will understand that it was him. Two other members are under suspicion. Should I tell the committee the truth, or say that I know nothing?",
    options: [
      { id: "tell", label: "Do not lie: tell the committee the truth, or refuse to answer and let them understand" },
      { id: "deny", label: "Say that you know nothing, to protect the father" }
    ],
    philosophers: {
      "maimonides-jewish-ethics": {
        option: "tell",
        confidence: "clear",
        reason: "To say 'I know nothing' is a false statement, and it leaves two innocent members under suspicion. The honour owed to a parent does not reach a transgression: if a father tells his son to transgress, the son does not obey. Deception in speech is forbidden.",
        source: "Mishneh Torah, Hilkhot Mamrim 6:12 (do not obey a parent who asks for a transgression); Hilkhot De'ot 2:6 (no deception in speech)"
      },
      "mill-utilitarianism": {
        option: "tell",
        confidence: "clear",
        reason: "Mill allows a preference for family only where no other duty is violated. Here two duties are at stake: truthfulness, and justice to the two members who carry a false suspicion. The narrow exceptions that Mill allows to the rule of truthfulness do not apply.",
        source: "Utilitarianism, ch. 5 (partiality to family and friends is blameless only when no other duty is violated); ch. 2 (the rule of veracity and its exceptions)"
      },
      "kant-deontology": {
        option: "tell",
        confidence: "clear",
        reason: "To say 'I know nothing' is a lie, and the duty not to lie has no exception for love of a parent or for a good result.",
        source: "Metaphysics of Morals, Doctrine of Virtue, §9 (On Lying); 'On a Supposed Right to Lie from Philanthropy' (1797)"
      },
      "aristotle-virtue-ethics": {
        option: "tell",
        confidence: "disputed",
        reason: "The truthful person is truthful most of all when something is at stake, and the lie leaves two fellow members under an unjust suspicion. The other reading gives more weight to what a son owes his father.",
        source: "Nicomachean Ethics IV.7 (truthfulness); V.1-2 (justice toward others); against this, VIII.14 and IX.2 (what is owed to a father)"
      }
    },
    open: {
      "confucius-role-ethics": "Analects 13.18 is about a son who testifies against his father. This son must make a false statement that leaves two other people under suspicion, and the passage gives no verdict on what he owes them."
    },
    axes: [
      { axis: "impartialPartial", negative: "tell", positive: "deny" }
    ]
  },
  {
    id: "sheep-witness",
    title: "The son as a witness against his father",
    split: "development",
    kind: "split",
    text: "My father took tools from our community workshop without permission. He told me. No other person is suspected, and no one has asked me anything. The committee has asked members to come forward with what they know. Should I go to the committee and report my father?",
    options: [
      { id: "report", label: "Go to the committee and report the father" },
      { id: "cover", label: "Do not report him: keep it in the family and urge him to put it right" }
    ],
    philosophers: {
      "mencius-confucianism": {
        option: "cover",
        confidence: "clear",
        reason: "Asked what Shun, as emperor, would do if his father killed a man, Mencius says that Shun would not stop the judge from arresting him, but would give up the empire, carry his father away in secret and live with him at the edge of the sea. Shun does not hide the crime or obstruct the judge, but he does not denounce his father either; he gives up his own position to stay with him. The case is murder, so this is an analogy for a lesser one, where no one else is suspected and no one has asked. Scholars dispute what the passage says about concealment.",
        source: "Mencius 7A35"
      },
      "confucius-role-ethics": {
        option: "cover",
        confidence: "clear",
        reason: "This is the recorded case. Told of a man who bore witness against his father for the theft of a sheep, Confucius answers that among his people the upright act differently: the father covers for the son, and the son for the father.",
        source: "Analects 13.18; 4.18 (remonstrate gently with parents)"
      }
    },
    axes: [
      { axis: "impartialPartial", negative: "report", positive: "cover" }
    ]
  },
  {
    id: "promise-charity",
    title: "The promise and the charity work",
    split: "development",
    kind: "split",
    text: "I promised to help my friend move on Saturday. A charity now offers me one day of paid work on the same Saturday. The fee is $2,000, and I would give all of it to a food bank that must turn families away this month. The work cannot move to another day. My friend can find no other helper. Without me he must pay movers about $400, which is hard for him, and he says that a promise is a promise. Should I keep the promise or take the work?",
    options: [
      { id: "keep", label: "Keep the promise and help the friend move" },
      { id: "break", label: "Break the promise and take the paid work for the food bank" }
    ],
    philosophers: {
      "kant-deontology": {
        option: "keep",
        confidence: "clear",
        reason: "To keep a promise is a perfect duty. To help the needy is an imperfect duty, which allows latitude and cannot override a perfect one.",
        source: "Groundwork of the Metaphysics of Morals, Section II (the false promise; a perfect duty admits no exception in favour of inclination); Metaphysics of Morals, Doctrine of Virtue, Introduction (duties of virtue are of wide obligation)"
      },
      "confucius-role-ethics": {
        option: "keep",
        confidence: "clear",
        reason: "To be true to one's word (xin), above all with friends, is a central duty in the Analects. That a friend comes before strangers is a later reading of graded concern, clearest in Mencius.",
        source: "Analects 2.22 (Confucius: a person without trustworthiness); 1.4 and 1.7 (the disciples Zengzi and Zixia: trustworthy with friends)"
      }
    },
    open: {
      "mill-utilitarianism": "The dollar figures do not measure the difference in welfare. The friend's hardship and his justified reliance also count."
    },
    axes: [
      { axis: "outcomesPrinciples", negative: "break", positive: "keep" },
      { axis: "individualCollective", negative: "keep", positive: "break" },
      { axis: "impartialPartial", negative: "break", positive: "keep" }
    ]
  },
  {
    id: "footbridge",
    title: "The footbridge",
    split: "development",
    kind: "split",
    text: "A runaway trolley is heading toward five people trapped on the track. You are standing on a footbridge above the track, beside a very large stranger. The only way to stop the trolley is to push him off the bridge into its path. His body would stop it and save the five, but he would die. You are certain that this would work, and you are too light to stop the trolley yourself. Should you push the stranger?",
    options: [
      { id: "push", label: "Push the stranger" },
      { id: "refrain", label: "Do not push the stranger" }
    ],
    philosophers: {
      "mencius-confucianism": {
        option: "refrain",
        confidence: "disputed",
        reason: "Mencius says of the sages Bo Yi, Yi Yin and Confucius that none of them would commit one unrighteous act or kill one innocent person, even to gain the whole empire. The passage is about gain, not about saving five lives, so this is an analogy; Mencius 4A17 (weighing the rule against the case) gives a less rule-bound reading.",
        source: "Mencius 2A2"
      },
      "maimonides-jewish-ethics": {
        option: "refrain",
        confidence: "clear",
        reason: "One life is not set aside for another. A pursuer who threatens a life may be stopped, even by killing him, but the stranger pursues no one. When a group is told to hand over one person to be killed or all will die, they must all die rather than hand over one innocent person.",
        source: "Mishneh Torah, Hilkhot Rotzeach u-Shmirat ha-Nefesh 1:9 (one life is not set aside for another); Hilkhot Yesodei ha-Torah 5:5 (a group must not hand over one person)"
      },
      "mill-utilitarianism": {
        option: "push",
        confidence: "disputed",
        reason: "With the result certain, the impartial count of welfare favours five lives over one. The other reading rests on Mill's own stress on security and on the rule against killing the innocent.",
        source: "Utilitarianism, ch. 2 (the greatest happiness principle); against this, ch. 5 (security as the most vital interest)"
      },
      "kant-deontology": {
        option: "refrain",
        confidence: "clear",
        reason: "To push him is to use a person merely as a means, in a way to which he cannot consent.",
        source: "Groundwork, Section II (the formula of humanity)"
      },
      "aristotle-virtue-ethics": {
        option: "refrain",
        confidence: "clear",
        reason: "Some acts have no mean and are always wrong. Aristotle names murder among them.",
        source: "Nicomachean Ethics II.6 (1107a8-17)"
      },
      "confucius-role-ethics": {
        option: "refrain",
        confidence: "disputed",
        reason: "The humane person does not kill an innocent person for a gain. Both passages are analogies: one is about a ruler who wants to execute bad men, the other about killing to gain a throne. No passage speaks of killing one to save five.",
        source: "Analects 12.19 (why must you kill?); Mencius 2A2 (would not kill one innocent person to gain the empire)"
      }
    },
    axes: [
      { axis: "outcomesPrinciples", negative: "push", positive: "refrain" },
      { axis: "individualCollective", negative: "refrain", positive: "push" }
    ]
  },
  {
    id: "music-funding",
    title: "Six trained players or thirty beginners",
    split: "development",
    kind: "open",
    text: "Our music club has money for one thing this year: an advanced course for our six best players, or basic lessons for thirty members who have never had a lesson. The six have trained for years. The money cannot be divided, and there will be no more money next year. I must cast the deciding vote. Which should I choose?",
    options: [
      { id: "six", label: "Fund the advanced course for the six best players" },
      { id: "thirty", label: "Fund basic lessons for the thirty beginners" }
    ],
    philosophers: {},
    open: {
      "mill-utilitarianism": "Thirty places do not by themselves establish the larger benefit.",
      "aristotle-virtue-ethics": "The flute argument depends on what the club is for, and the case does not say. See the pair club-purpose.",
      "confucius-role-ethics": "Confucius taught students of modest means, but that gives no rule for the last place."
    },
    axes: []
  },
  {
    id: "hiding-friend",
    title: "The friend in hiding",
    split: "development",
    kind: "split",
    text: "A friend is hiding in my flat from her violent former partner. He is at my door now and asks if she is here. The police will arrive in ten minutes. If I refuse to answer, he will understand that she is here and force his way in. If I say that she left town, he will go away. Should I lie to him?",
    options: [
      { id: "lie", label: "Lie: say that she is not there" },
      { id: "no-lie", label: "Do not lie: tell the truth or refuse to answer" }
    ],
    philosophers: {
      "hume-sentimentalism": {
        option: "lie",
        confidence: "clear",
        reason: "Hume grounds the rules of justice and fidelity in their usefulness to society, and holds that they give way in cases of extreme necessity, where keeping them brings ruin. Our approval of benevolence, and our blame for a person who fails a friend in danger, point the same way. No text discusses this case.",
        source: "Enquiry concerning the Principles of Morals, sec. 3 part 1 (rules of justice suspended in extreme necessity); sec. 2 (benevolence)"
      },
      "maimonides-jewish-ethics": {
        option: "lie",
        confidence: "clear",
        reason: "One must rescue a person whose life is pursued, even by killing the pursuer if nothing less will stop him. A false word that sends the pursuer away is far less. 'Do not stand by the blood of your neighbour' makes the rescue a duty.",
        source: "Mishneh Torah, Hilkhot Rotzeach u-Shmirat ha-Nefesh 1:6-7 (the pursuer), 1:14 (do not stand by the blood of your neighbour)"
      },
      "mill-utilitarianism": {
        option: "lie",
        confidence: "clear",
        reason: "Mill names this exception to the rule of truthfulness: to keep a fact from a malefactor, when that can only be done by denial, and it saves a person from great and unmerited evil.",
        source: "Utilitarianism, ch. 2 (exceptions to veracity)"
      },
      "kant-deontology": {
        option: "no-lie",
        confidence: "clear",
        reason: "Kant's own essay denies a right to lie even to a murderer who asks where his victim is. Many later Kantians reject this conclusion, but it is Kant's text.",
        source: "'On a Supposed Right to Lie from Philanthropy' (1797)"
      },
      "aristotle-virtue-ethics": {
        option: "lie",
        confidence: "disputed",
        reason: "Truthfulness as a virtue concerns how a person presents himself, not cases of this kind. Practical wisdom and friendship point toward the protection of a friend from injustice.",
        source: "Nicomachean Ethics IV.7 (scope of truthfulness); IX.8 (the good person acts for the sake of friends)"
      },
      "confucius-role-ethics": {
        option: "lie",
        confidence: "disputed",
        reason: "Confucius ranks the person who is rigidly true to his word in every case below the filial and the upright. Uprightness is not literal truth-telling against one's own. The match is by analogy: 13.18 concerns a relative's fault, not the protection of a victim.",
        source: "Analects 13.20 (those determined to be true to their word are 'obstinate little men', the third rank); 13.18"
      }
    },
    axes: [
      { axis: "outcomesPrinciples", negative: "lie", positive: "no-lie" }
    ]
  },
  {
    id: "water-scheme",
    title: "The household that stopped its share of work",
    split: "development",
    kind: "split",
    text: "Our village built a shared water system. Every household agreed to give two days of work each month to maintain it. One household has stopped. The man says that his time is his own, and he continues to use the water. Talks with him have failed. I chair the committee. The rules let us fine him and, if he does not pay, cut his connection. Some members want no penalty: they want to continue with good example and persuasion. Should we enforce the penalty?",
    options: [
      { id: "enforce", label: "Enforce the penalty (the fine and, if necessary, the cut)" },
      { id: "persuade", label: "Impose no penalty: continue with example and persuasion" }
    ],
    philosophers: {},
    open: {
      "mill-utilitarianism": "The penalty joins a fine and a cut of the water to a whole household. These are two judgments. Separate them before this case is scored.",
      "kant-deontology": "The penalty joins a fine and a cut of the water to a whole household. These are two judgments. Separate them before this case is scored.",
      "aristotle-virtue-ethics": "The penalty joins a fine and a cut of the water to a whole household. These are two judgments. Separate them before this case is scored.",
      "confucius-role-ethics": "Analects 2.3 says what punishment alone fails to teach; 13.3 treats the proper use of punishments as part of good government. Also: The penalty joins a fine and a cut of the water to a whole household. These are two judgments. Separate them before this case is scored."
    },
    axes: [
      { axis: "individualCollective", negative: "persuade", positive: "enforce" }
    ]
  },
  {
    id: "treasurer",
    title: "The treasurer who repaid the money",
    split: "development",
    kind: "split",
    text: "I chair a small sports club. Our treasurer took $3,000 from club funds last year. She confessed to me, repaid all of it, and is ashamed. No one else knows. The club rules say that a member who takes funds must be expelled, and that the members must be told. If I apply the rule, our fundraising for the children's programme will probably collapse this year. Should I apply the rule, or keep the matter quiet?",
    options: [
      { id: "apply", label: "Tell the members, as the rule requires" },
      { id: "quiet", label: "Keep the matter quiet: do not tell the members" }
    ],
    philosophers: {
      "kant-deontology": {
        option: "apply",
        confidence: "clear",
        reason: "A penalty is owed because the wrong was done. It must not be set aside as a means to some other good. To hide the matter from the members, to whom the chair owes an account, is also a deception.",
        source: "Metaphysics of Morals, Doctrine of Right, General Remark E (6:331-333, punishment is never merely a means to another good); Doctrine of Virtue §9"
      }
    },
    open: {
      "mill-utilitarianism": "The lost fundraising and the members' need to know whom to trust with their money both carry weight for Mill.",
      "aristotle-virtue-ethics": "Equity can justify an exception to expulsion. It does not justify secrecy; that takes a separate argument.",
      "confucius-role-ethics": "Her shame and restitution are reasons for mercy. They do not decide who is entitled to know what happened."
    },
    axes: [
      { axis: "outcomesPrinciples", negative: "quiet", positive: "apply" }
    ]
  },
  {
    id: "parents-or-post",
    title: "The post abroad and the parents",
    split: "development",
    kind: "split",
    text: "I am an only child. My parents are in their eighties and now need help each day. I have been offered the post that I have worked toward for fifteen years. It is in another country, for at least five years. My parents refuse to move. I can pay for a good care home near their house, but they dread it and ask me to stay. If I refuse the post, there will be no second offer. Should I take the post or stay?",
    options: [
      { id: "go", label: "Take the post and pay for the parents' care" },
      { id: "stay", label: "Refuse the post and stay to care for the parents" }
    ],
    philosophers: {
      "confucius-role-ethics": {
        option: "stay",
        confidence: "disputed",
        reason: "While parents are alive, a son should not travel far; if he does go, he must have a fixed place where he can be reached (4.19). Support without reverence is no more than we give to dogs and horses (2.7). The text does not say if a paid care home, against the parents' wish, meets that standard.",
        source: "Analects 4.19; 2.7"
      }
    },
    open: {
      "aristotle-virtue-ethics": "Agent panel (2026-11-21), 2 of 3 reviewers: we owe parents support and honour before others (NE IX.2, 1165a21-27; VIII.14), but IX.2 (1164b22-1165a3) says that conflicts between such claims and other goods turn on the particulars and no fixed rule settles them. Whether paid care, against the parents' wish, meets the debt is not settled. Was keyed 'stay' (disputed)."
    },
    axes: [
      { axis: "individualCollective", negative: "go", positive: "stay" }
    ]
  },
  {
    id: "memorial-words",
    title: "Words of faith at the memorial",
    split: "development",
    kind: "split",
    text: "My family will hold a religious memorial for my grandfather. My mother asks me to stand with the family and say the words of faith aloud with them. I do not believe those words. She says that it is a sign of respect, and that my silence will shame the family in front of the community. I will attend in any case. Should I say the words?",
    options: [
      { id: "say", label: "Say the words with the family" },
      { id: "silent", label: "Attend, but do not say the words" }
    ],
    philosophers: {
      "mill-utilitarianism": {
        option: "silent",
        confidence: "disputed",
        reason: "Mill attacks the pressure of custom to profess what one does not believe, and values sincere opinion. The other reading counts the mother's comfort against a small cost.",
        source: "On Liberty, ch. 2 (the cost of concealed convictions); ch. 3 (the despotism of custom). No passage speaks to this case."
      }
    },
    open: {
      "kant-deontology": "The case does not give the words. A personal declaration of belief and a conventional response of mourning are different acts.",
      "confucius-role-ethics": "The case does not give the words. A personal declaration of belief and a conventional response of mourning are different acts."
    },
    axes: [
      { axis: "individualCollective", negative: "silent", positive: "say" },
      { axis: "outcomesPrinciples", negative: "say", positive: "silent" }
    ]
  },
  {
    id: "medicine",
    title: "The drug that he cannot buy",
    split: "development",
    kind: "split",
    text: "My wife will die within weeks without a drug. The only pharmacist who has it asks $40,000. I have raised $8,000, and he refuses a lower price or later payment. I have tried doctors, charities and the courts, and there is no time left. I can break into his store tonight and take the drug. I would leave the $8,000 there. Should I take it?",
    options: [
      { id: "take", label: "Break in and take the drug" },
      { id: "not-take", label: "Do not take the drug" }
    ],
    philosophers: {
      "hume-sentimentalism": {
        option: "take",
        confidence: "clear",
        reason: "Hume asks if it is a crime, after a shipwreck, to seize whatever means of safety one can, without regard to former limits of property, or for a besieged city perishing of hunger to break open the granaries. In such extreme necessity the rules of property give way, because they exist only for their usefulness.",
        source: "Enquiry concerning the Principles of Morals, sec. 3 part 1 (the shipwreck and the besieged city)"
      },
      "maimonides-jewish-ethics": {
        option: "take",
        confidence: "clear",
        reason: "When life is at stake, a person transgresses rather than die, except for the three (idolatry, forbidden sexual relations, murder); the text concerns a person forced to transgress. Theft is not among the three; that this permits taking a third party's property to save someone else is the Talmud's extension of the rule. A person who saves a life with another's property must still pay for it, which fits leaving the $8,000 and owing the rest.",
        source: "Mishneh Torah, Hilkhot Yesodei ha-Torah 5:1-2 (saving life sets aside the commandments); Hilkhot Hovel u-Mazik 8:2 (one who saves himself with another's property pays for it)"
      },
      "mill-utilitarianism": {
        option: "take",
        confidence: "clear",
        reason: "Mill gives this case himself: to save a life, it can be not only allowable but a duty to steal or take by force the necessary food or medicine.",
        source: "Utilitarianism, ch. 5 (near the end)"
      },
      "kant-deontology": {
        option: "not-take",
        confidence: "disputed",
        reason: "Necessity does not make a wrong act right. Kant treats a 'right of necessity' as no right at all: the act can be beyond punishment, but it is not lawful. His example is a man who takes another's life to save his own; the application to theft for a wife's life is an extension.",
        source: "Metaphysics of Morals, Doctrine of Right, Appendix to the Introduction (the right of necessity, 6:235-236)"
      },
      "aristotle-virtue-ethics": {
        option: "not-take",
        confidence: "clear",
        reason: "Aristotle names theft among the acts that have no mean and are always wrong. Acts done under such pressure can earn pardon, but pardon is not the same as doing rightly.",
        source: "Nicomachean Ethics II.6 (1107a8-17); against this, III.1 (mixed actions)"
      }
    },
    open: {
      "confucius-role-ethics": "Analects 15.2 is about a person who endures his own hardship. Here another person will die, and the passage does not settle whether to take the drug is to abandon restraint."
    },
    axes: [
      { axis: "outcomesPrinciples", negative: "take", positive: "not-take" }
    ]
  },
  {
    id: "charity-hire",
    title: "The nephew and the better candidate",
    split: "development",
    kind: "split",
    text: "I lead the hiring for a charity that runs on public donations. Two people applied for the post of finance officer. My nephew can do the work adequately. The other candidate is clearly better. My family expects me to choose my nephew: he has been out of work for a year and has two children. No rule forbids it, and no one would question my choice. Whom should I hire?",
    options: [
      { id: "nephew", label: "Hire the nephew" },
      { id: "better", label: "Hire the better candidate" }
    ],
    philosophers: {
      "mencius-confucianism": {
        option: "better",
        confidence: "clear",
        reason: "A ruler who promotes the worthy may have to put strangers above his own kin, and must do it with care. When Shun gave his brother Xiang a fief, he had officials govern it and sent Xiang its revenue: he provided for his brother, but did not give him a post. Care for kin is graded and real, but a post of public trust goes to the worthy.",
        source: "Mencius 1B7 (the distant above kin, in promotion); 5A3 (Shun and Xiang)"
      },
      "mill-utilitarianism": {
        option: "better",
        confidence: "clear",
        reason: "Mill allows a preference for family only where no other duty is violated. He names the choice among candidates for a public post as a case where only the public interest may count.",
        source: "Utilitarianism, ch. 5 (impartiality as an obligation of justice)"
      },
      "kant-deontology": {
        option: "better",
        confidence: "disputed",
        reason: "An inference: the hirer acts for the donors, and a maxim of using an office of trust for a family end could not be a universal law. No passage speaks to this case.",
        source: "Groundwork, Section II (the formula of universal law)"
      },
      "aristotle-virtue-ethics": {
        option: "better",
        confidence: "clear",
        reason: "Offices are distributed justly by the merit that is relevant to the work, not by birth or kinship.",
        source: "Politics III.12; Nicomachean Ethics V.3"
      },
      "confucius-role-ethics": {
        option: "better",
        confidence: "disputed",
        reason: "In office, raise up the worthy and the able. The other reading uses the next line of the same passage ('raise those whom you know') and concern for one's own family.",
        source: "Analects 13.2 (raise up those of talent); 12.22 (raise the straight)"
      }
    },
    axes: [
      { axis: "impartialPartial", negative: "better", positive: "nephew" }
    ]
  },
  {
    id: "gut-vs-record",
    title: "The candidate with the clean record",
    split: "development",
    kind: "split",
    text: "Our tenants' association must choose a treasurer. On every fact that I can check, Mr R is the best candidate: experience, references, a clean record. But in two meetings, the way he spoke about money and about people made me deeply uneasy. I cannot point to one fact that supports this feeling. The other candidate is adequate, and I trust her. My vote decides. Should I vote for Mr R?",
    options: [
      { id: "record", label: "Vote for Mr R, on the evidence" },
      { id: "feeling", label: "Vote for the other candidate, on the strength of the unease" }
    ],
    philosophers: {
      "aristotle-virtue-ethics": {
        option: "record",
        confidence: "disputed",
        reason: "Experienced judgment can see what a checklist misses. But the case does not say that the voter has such experience, and an unsupported feeling has no authority of its own. See the pair experienced-eye.",
        source: "Nicomachean Ethics VI.11; II.9 (the decision rests with perception)"
      },
      "confucius-role-ethics": {
        option: "feeling",
        confidence: "disputed",
        reason: "Changed after the agent panel (2026-11-21, 2 of 3 reviewers; was 'record'). Confucius judges a person by direct observation of how he speaks and what he is at ease with, not by reputation or record: observe what he does, his motives, and what he rests in, and character cannot be hidden (2.10); without understanding words one cannot know people (20.3); examine for yourself even what the crowd likes (15.28). The unease comes from Mr R's own speech in two meetings, so it is observed conduct. Against this: the voter can name no fact.",
        source: "Analects 2.10; 20.3; 15.28 (Legge numbering; Lau numbering not checked)"
      }
    },
    axes: [
      { axis: "reasonIntuition", negative: "record", positive: "feeling" }
    ]
  },
  {
    id: "extension",
    title: "The third request for an extension",
    split: "development",
    kind: "split",
    text: "I manage a team. I set a rule: no extensions on the quarterly report, because exceptions lead to favouritism. This year I refused two people. Now a third person asks. On paper her circumstances are the same as theirs. But everything in me says that her case is different and that she should have the extension. I cannot state a difference that I could defend to the other two. Should I grant it?",
    options: [
      { id: "refuse", label: "Refuse the extension, as for the other two" },
      { id: "grant", label: "Grant the extension" }
    ],
    philosophers: {
      "kant-deontology": {
        option: "refuse",
        confidence: "disputed",
        reason: "An inference from the formula of universal law: like cases must be treated alike, and an exception that the manager cannot justify to the other two is an exception made on inclination.",
        source: "Groundwork, Section II (the formula of universal law)"
      },
      "aristotle-virtue-ethics": {
        option: "refuse",
        confidence: "disputed",
        reason: "Equity corrects a rule for a real difference in the case. The manager can state no difference, so equity has nothing to correct.",
        source: "Nicomachean Ethics V.10"
      },
      "confucius-role-ethics": {
        option: "refuse",
        confidence: "disputed",
        reason: "The gentleman is not fixed for or against anything and follows what is right. When Confucius drops one old practice and keeps another, he gives the reason for each. The manager has no reason that she can give to the two people whom she refused.",
        source: "Analects 4.10; 9.3"
      }
    },
    axes: [
      { axis: "reasonIntuition", negative: "refuse", positive: "grant" }
    ]
  },
  {
    id: "credit",
    title: "The credit for the project",
    split: "development",
    kind: "split",
    text: "I led a project that saved our company. At the celebration, the director thanked a senior colleague as the leader, and the room applauded him. He did little. I will speak next. If I say plainly that I led the work, I get the credit that I earned, and he loses face. If I thank the team and say nothing of my part, the wrong impression stays. Should I claim the credit?",
    options: [
      { id: "claim", label: "Say plainly that you led the work" },
      { id: "deflect", label: "Thank the team and say nothing of your own part" }
    ],
    philosophers: {
      "maimonides-jewish-ethics": {
        option: "deflect",
        confidence: "disputed",
        reason: "Humility is one of the two traits where a person must go to the far end, not to the middle: one should be very lowly of spirit. Maimonides also calls shaming another person, above all in public, a great sin, and here the plain claim would shame the colleague in front of everyone. Against this: De'ot 2:3 concerns an inner trait and does not forbid a true statement, and the false impression is itself a kind of deception; Maimonides might prefer a private word, which the options leave out.",
        source: "Mishneh Torah, Hilkhot De'ot 2:3 (humility to the extreme); 6:8 (do not shame another, above all in public)"
      },
      "aristotle-virtue-ethics": {
        option: "claim",
        confidence: "disputed",
        reason: "The great-souled person claims the honour that he deserves, and to claim less is a fault (IV.3). The other reading uses IV.7: the truthful person inclines to understate, because that is in better taste, and understatement is a smaller fault than boasting.",
        source: "Nicomachean Ethics IV.3 (greatness of soul and undue humility); IV.7 (self-deprecation)"
      },
      "confucius-role-ethics": {
        option: "deflect",
        confidence: "clear",
        reason: "Confucius praises an officer who would not boast of his own merit, and says that he is not troubled when others do not recognise him. His best disciple wishes never to boast of his goodness or display his deeds.",
        source: "Analects 6.15 (Meng Zhifan); 1.16; 5.26 (the wish of Yan Yuan)"
      }
    },
    axes: [
      { axis: "individualCollective", negative: "claim", positive: "deflect" }
    ]
  },
  {
    id: "double-refund",
    title: "The double refund",
    split: "development",
    kind: "agreement",
    text: "A shop refunded me twice by mistake. To return the extra money would take ten minutes. No one will notice if I keep it. Should I return it?",
    options: [
      { id: "return", label: "Return the extra money" },
      { id: "keep", label: "Keep the extra money" }
    ],
    philosophers: {
      "mencius-confucianism": {
        option: "return",
        confidence: "clear",
        reason: "To take what is not one's own is against rightness. A man who steals a chicken from his neighbour every day proposes to reduce it to one a month and stop next year; Mencius answers that if he knows it is wrong, he should stop at once.",
        source: "Mencius 7A33; 3B8"
      },
      "hume-sentimentalism": {
        option: "return",
        confidence: "clear",
        reason: "Hume's 'sensible knave' holds that he may break a rule of honesty when it profits him and no one will know. Hume answers that the honest person keeps the rule, and keeps the peace of mind and the trust of others that the knave gives up.",
        source: "Enquiry concerning the Principles of Morals, Conclusion, part 2"
      },
      "maimonides-jewish-ethics": {
        option: "return",
        confidence: "clear",
        reason: "It is forbidden to rob even the slightest amount. To keep money that one knows was paid by mistake is to hold what belongs to another. The application to a mistake is our inference.",
        source: "Mishneh Torah, Hilkhot Gezelah va-Avedah 1:1-2"
      },
      "mill-utilitarianism": {
        option: "return",
        confidence: "clear",
        reason: "To keep what belongs to another is a plain case of injustice, and no larger good is at stake.",
        source: "Utilitarianism, ch. 5 (it is unjust to take or keep what belongs to another)"
      },
      "kant-deontology": {
        option: "return",
        confidence: "clear",
        reason: "A maxim of keeping what is not mine when no one will notice cannot be a universal law. The shopkeeper example adds that honesty only because it pays has no moral worth.",
        source: "Groundwork, Section I (the shopkeeper); Section II"
      },
      "aristotle-virtue-ethics": {
        option: "return",
        confidence: "clear",
        reason: "To take more than one's share of goods is the mark of the unjust person.",
        source: "Nicomachean Ethics V.1-2 (the grasping person); V.4"
      },
      "confucius-role-ethics": {
        option: "return",
        confidence: "clear",
        reason: "At the sight of gain, think of what is right. Wealth that is not got in the right way is not to be kept.",
        source: "Analects 14.12; 4.5; 7.16"
      }
    },
    axes: []
  },
  {
    id: "false-blame",
    title: "The false blame",
    split: "development",
    kind: "agreement",
    text: "In a meeting I blamed a colleague for an error. I now have clear evidence that I was wrong. If I correct the record in front of the same people, I will be embarrassed. Should I correct it in public?",
    options: [
      { id: "correct", label: "Correct the record in front of the same people" },
      { id: "silent", label: "Do not correct it in public" }
    ],
    philosophers: {
      "mencius-confucianism": {
        option: "correct",
        confidence: "clear",
        reason: "The gentlemen of old corrected their mistakes, and their mistakes were like eclipses of the sun and moon: everyone saw them, and when they changed, everyone looked up to them. Mencius blames those who persist in a mistake and make excuses for it.",
        source: "Mencius 2B9; 2A8 (Zilu was glad to be told of his faults)"
      },
      "maimonides-jewish-ethics": {
        option: "correct",
        confidence: "clear",
        reason: "Repentance for a wrong to another person needs more than confession: one must put the wrong right and seek the other's forgiveness. The text does not say where the repair is made; that a public false charge is corrected in public is our inference.",
        source: "Mishneh Torah, Hilkhot Teshuvah 2:9"
      },
      "mill-utilitarianism": {
        option: "correct",
        confidence: "clear",
        reason: "The colleague suffers an unmerited harm that the speaker can remove at a small cost to himself.",
        source: "Utilitarianism, ch. 5 (each person should get what he deserves; impartiality)"
      },
      "kant-deontology": {
        option: "correct",
        confidence: "clear",
        reason: "An inference; no passage speaks of a retraction. To let a false and damaging statement stand, to spare oneself, uses the colleague's good name merely as a means to one's own comfort, and the maxim could not be a universal law.",
        source: "Groundwork, Section II (the formulas of universal law and of humanity)"
      },
      "aristotle-virtue-ethics": {
        option: "correct",
        confidence: "clear",
        reason: "Justice requires that the wrong be put right, and the truthful person owns what is the case when it costs him.",
        source: "Nicomachean Ethics V.4 (corrective justice); IV.7"
      },
      "confucius-role-ethics": {
        option: "correct",
        confidence: "clear",
        reason: "When you make a mistake, do not be afraid to correct it. The gentleman's faults are like eclipses: all see them, and all look up to him when he corrects them.",
        source: "Analects 1.8; 15.30; 19.21 (the disciple Zigong)"
      }
    },
    axes: []
  },
  // ---- Cases added 2026-11-21 for the distinctness test, in the style of user dilemmas. kidney-for-a-stranger and
  // cousin-or-strangers are contested (the key expects different answers from different thinkers); manager-who-belittles
  // is not (its Maimonides entry was removed after review). Two drafts were removed after review: brothers-dismissal
  // (Analects 13.18 is concealment, which the no-lie option allows) and fathers-funeral (too close to the holdout
  // deathbed-promise). Reference check and content review by two AI subagents; not checked by a philosopher. ----
  {
    id: "kidney-for-a-stranger",
    title: "A kidney for a stranger",
    split: "development",
    kind: "split",
    text: "A woman in my city whom I have never met needs a kidney, and I am a match. For a healthy donor the operation is safe: the risk of death is very small, and most donors live normal lives with one kidney. It would almost certainly free her from years on dialysis, and it may save her life. I am healthy, and no one depends on me. Should I give her one of my kidneys?",
    options: [
      { id: "donate", label: "Give her one of your kidneys" },
      { id: "decline", label: "Do not give a kidney" }
    ],
    philosophers: {
      "confucius-role-ethics": {
        option: "decline",
        confidence: "disputed",
        reason: "The body is received from one's parents and must be kept whole: on his deathbed Zengzi, Confucius's disciple, has his students uncover his hands and feet to show that he kept them unharmed. The passage is the disciple's, and it concerns harm through carelessness, not a gift that saves a life.",
        source: "Analects 8.3"
      },
      "kant-deontology": {
        option: "decline",
        confidence: "disputed",
        reason: "Kant counts it as 'partial self-murder' to deprive oneself of an integral part or organ, and his example is to give away or sell a tooth to be planted in another person's jaw. Only the amputation of a dead organ, or one about to mortify, is exempt. Against this: Kant's target is self-mutilation for gain, he does not discuss an organ given to save a life, and he also teaches a duty of beneficence; many Kantians reject the 'decline' reading.",
        source: "Metaphysics of Morals, Doctrine of Virtue, Ak. 6:423 (on maiming oneself)"
      },
      "mill-utilitarianism": {
        option: "donate",
        confidence: "clear",
        reason: "A very small risk to the donor against years of suffering, and perhaps a life, for the recipient: the gain in happiness is large. Beneficence is for Mill a duty of imperfect obligation: binding, but owed to no definite person at a set time, and no one may compel it. To give is to fulfil it well.",
        source: "Utilitarianism, ch. 2 (the standard is the happiness of all concerned); ch. 5 (duties of imperfect obligation)"
      },
    },
    axes: []
  },
  {
    id: "cousin-or-strangers",
    title: "My cousin's rent or a charity abroad",
    split: "development",
    kind: "split",
    text: "I have $3,000 to give this year. My cousin cannot pay her rent this winter and may lose her flat; $3,000 would cover it. A well-run charity abroad says that $3,000 buys malaria nets that will, on average, save about one child's life. I cannot do both. Which should I give to?",
    options: [
      { id: "cousin", label: "Give the money to the cousin" },
      { id: "charity", label: "Give the money to the charity abroad" }
    ],
    philosophers: {
      "mill-utilitarianism": {
        option: "charity",
        confidence: "disputed",
        reason: "The standard is the happiness of all concerned, counted impartially: a child's life outweighs a rent shortfall. Against this: Mill says that most good actions are meant for the benefit of particular people, not the world, and that it is enough to attend to them when no one else's rights are violated.",
        source: "Utilitarianism, ch. 2"
      },
      "maimonides-jewish-ethics": {
        option: "cousin",
        confidence: "disputed",
        reason: "A poor relative comes before all others; the poor of one's own household before the poor of one's town, and the poor of one's town before those of another town. Against this: the order ranks poor people with similar needs, and saving a life comes first (the ransom of captives before the support of the poor, 8:10); rent is not a life.",
        source: "Mishneh Torah, Hilkhot Matnot Aniyim 7:13"
      },
      "mencius-confucianism": {
        option: "cousin",
        confidence: "disputed",
        reason: "Mencius rejects the Mohist teaching of love without gradations: does anyone love his brother's child only as he loves a neighbour's infant? The good person is affectionate to parents, then humane to people, then kind to creatures. Against this: these texts do not say that one may let a child die to pay a relative's rent, and the child at the well (2A6) points the other way.",
        source: "Mencius 3A5; 7A45"
      },
    },
    axes: [
      { axis: "impartialPartial", negative: "charity", positive: "cousin" }
    ]
  },
  {
    id: "manager-who-belittles",
    title: "The manager who belittles me",
    split: "development",
    kind: "split",
    text: "My manager often belittles me in front of the team: he mocks my accent and calls my ideas stupid. He does not do this to others. The job pays well and supports my family, and jobs like it are rare here. If I tell him plainly that he must stop, he may make my work harder or push me out. If I say nothing and bear it, things will probably stay as they are. Should I stand up to him?",
    options: [
      { id: "stand", label: "Stand up to him: tell him plainly that he must stop, in private or in public, or report it formally" },
      { id: "bear", label: "Bear it quietly: do not answer back" }
    ],
    philosophers: {
      "kant-deontology": {
        option: "stand",
        confidence: "clear",
        reason: "Duties to oneself include respect for one's own dignity: 'Do not become the vassals of men. Do not let others trample your rights with impunity.' Servility, giving up one's dignity for an advantage, is a vice. Kant does not discuss the risk to one's family's income.",
        source: "Metaphysics of Morals, Doctrine of Virtue, §11, Ak. 6:434-436 (on servility)"
      },
      "aristotle-virtue-ethics": {
        option: "stand",
        confidence: "clear",
        reason: "Those who are not angry at the things they should be angry at are thought foolish, and to endure being insulted is slavish. The good-tempered person is angry at the right things, in the right way; that mockery repeated in public is such a thing is our inference.",
        source: "Nicomachean Ethics IV.5"
      },
    },
    axes: []
  },
  {
    id: "flood-rescue",
    title: "One more trip with the rescue boat",
    split: "holdout",
    kind: "split",
    text: "I pilot a volunteer rescue boat in a flood. There is time for one more trip before dark. My mother, who is 80, is alone on a roof to the east. A family of three, strangers to me, is on a roof to the west. The risk to each person is the same, and no other boat will come tonight. I cannot reach both roofs. Which way should I go?",
    options: [
      { id: "mother", label: "Go to the mother" },
      { id: "three", label: "Go to the family of three" }
    ],
    philosophers: {
      "mill-utilitarianism": {
        option: "three",
        confidence: "disputed",
        reason: "Each person's happiness counts the same, so three lives count for more than one. Mill has no text on a parent against strangers. His remark that a preference for family is blameless applies only where no other duty is violated.",
        source: "Utilitarianism, ch. 2 (the greatest happiness principle); ch. 5 (partiality)"
      }
    },
    open: {
      "aristotle-virtue-ethics": "The case does not say if the pilot is a private person with a boat or the rescue officer for everyone in danger. Their obligations to the three differ.",
      "confucius-role-ethics": "The case does not say if the pilot is a private person with a boat or the rescue officer for everyone in danger. Their obligations to the three differ."
    },
    axes: [
      { axis: "impartialPartial", negative: "three", positive: "mother" }
    ]
  },
  {
    id: "deathbed-promise",
    title: "The promise about the memorial",
    split: "holdout",
    kind: "split",
    text: "My aunt asked me on her deathbed to spend her $40,000 on a marble memorial at her grave. I promised. She left the money to me with no written conditions, and no one else knows of the promise. Our village clinic will close this year without about that sum. She cared little for the clinic. Should I keep the promise?",
    options: [
      { id: "keep", label: "Keep the promise and build the memorial" },
      { id: "clinic", label: "Give the money to the clinic" }
    ],
    philosophers: {
      "mill-utilitarianism": {
        option: "clinic",
        confidence: "disputed",
        reason: "The clinic serves the health of a whole village, and the promise is secret, so that to break it does little harm to general trust. The other reading stresses the habit of keeping one's word.",
        source: "Utilitarianism, ch. 2 (secondary principles and their limits)"
      },
      "kant-deontology": {
        option: "keep",
        confidence: "clear",
        reason: "A promise binds whether or not anyone can enforce it or will learn of the breach.",
        source: "Groundwork, Section II (the false promise)"
      },
      "confucius-role-ethics": {
        option: "keep",
        confidence: "disputed",
        reason: "The complete person does not forget an old agreement, however long ago it was made, and the dead are served according to ritual. The passages on care for the dead concern parents; an aunt's memorial is an extension.",
        source: "Analects 14.12 (does not forget an old agreement); 2.5; 1.9 (the disciple Zengzi)"
      }
    },
    axes: [
      { axis: "outcomesPrinciples", negative: "clinic", positive: "keep" },
      { axis: "individualCollective", negative: "keep", positive: "clinic" }
    ]
  },
  {
    id: "family-shop",
    title: "The family shop or the art school",
    split: "holdout",
    kind: "split",
    text: "My family has run the village hardware shop for three generations. I am the only child. My father is 70 and expects me to take over this year. If I refuse, the shop will close and he will be heartbroken. I have a place at an art school in the city, and I want to paint. I cannot do both. Should I take over the shop?",
    options: [
      { id: "shop", label: "Take over the shop" },
      { id: "art", label: "Go to the art school" }
    ],
    philosophers: {},
    open: {
      "mill-utilitarianism": "The case does not establish that the choice chiefly concerns the child's own life.",
      "confucius-role-ethics": "A duty to care for parents does not establish a duty to inherit their trade. The case does not say if the parents depend on the shop."
    },
    axes: [
      { axis: "individualCollective", negative: "art", positive: "shop" }
    ]
  },
  {
    id: "dying-grandmother",
    title: "The question of a dying grandmother",
    split: "holdout",
    kind: "split",
    text: "My grandmother has a few days to live. She asks me each hour if her son is on his way. He died in an accident last week, and she does not know. The doctor says that the news would cause her great distress, and that she will not live long enough to come to terms with it. If I avoid the question, she will understand. Should I tell her that he is on his way?",
    options: [
      { id: "lie", label: "Tell her that he is on his way" },
      { id: "truth", label: "Do not lie: tell her the truth or let her understand it" }
    ],
    philosophers: {
      "kant-deontology": {
        option: "truth",
        confidence: "clear",
        reason: "The duty not to lie has no exception for kindness.",
        source: "Metaphysics of Morals, Doctrine of Virtue, §9; 'On a Supposed Right to Lie from Philanthropy'"
      },
      "confucius-role-ethics": {
        option: "lie",
        confidence: "disputed",
        reason: "Filial care attends to the feelings of an elder, and uprightness is not literal truth-telling against one's own family.",
        source: "Analects 2.8 (the difficulty is in the demeanour); 13.18"
      }
    },
    open: {
      "mill-utilitarianism": "Mill allows this exception to truthfulness, but the case omits the grandmother's own wishes about painful news."
    },
    axes: [
      { axis: "outcomesPrinciples", negative: "lie", positive: "truth" }
    ]
  },
  {
    id: "scholarship",
    title: "The gifted candidate and the candidate in need",
    split: "holdout",
    kind: "split",
    text: "I sit on a committee that has one scholarship to give. Candidate A is the most gifted student that we have seen in ten years. Her family is wealthy, and she will attend the university in any case. Candidate B is a good student, not an exceptional one. Without the scholarship he cannot attend. The rules say only 'award to the most suitable candidate'. My vote decides. Who should get it?",
    options: [
      { id: "gifted", label: "Give the scholarship to candidate A, the most gifted" },
      { id: "needy", label: "Give the scholarship to candidate B, who cannot attend without it" }
    ],
    philosophers: {
      "mill-utilitarianism": {
        option: "needy",
        confidence: "disputed",
        reason: "The award changes nothing in A's life and changes B's life greatly.",
        source: "Utilitarianism, ch. 2 (the greatest happiness principle)"
      }
    },
    open: {
      "aristotle-virtue-ethics": "An award for achievement and a grant for access distribute different goods, and the case does not say which this is. See the pair award-or-grant.",
      "confucius-role-ethics": "An award for achievement and a grant for access distribute different goods, and the case does not say which this is. See the pair award-or-grant."
    },
    axes: [],
    axisNote: "Merit against need. None of the axes decides this dilemma."
  },
  {
    id: "diaries",
    title: "The husband's diaries",
    split: "holdout",
    kind: "split",
    text: "My husband died last year and left private diaries. He never said what should happen to them. A historian offers $30,000 for them, which would pay for our granddaughter's training. I have thought hard and can find no argument against the sale: no person named in the diaries is alive, and no one would be harmed. But to sell them feels like a betrayal of him. Should I sell them?",
    options: [
      { id: "sell", label: "Sell the diaries" },
      { id: "keep", label: "Do not sell the diaries" }
    ],
    philosophers: {},
    open: {
      "mill-utilitarianism": "The case does not say what the husband wanted, or if the diaries expose people who confided in him.",
      "confucius-role-ethics": "The case does not say what the husband wanted, or if the diaries expose people who confided in him."
    },
    axes: [
      { axis: "reasonIntuition", negative: "sell", positive: "keep" }
    ]
  },
  {
    id: "wallet",
    title: "The wallet in the street",
    split: "holdout",
    kind: "agreement",
    text: "I found a wallet in the street with $600 and an identity card. No one saw me. I need money this month. Should I return the wallet with the money?",
    options: [
      { id: "return", label: "Return the wallet with the money" },
      { id: "keep", label: "Keep the money" }
    ],
    philosophers: {
      "mill-utilitarianism": {
        option: "return",
        confidence: "clear",
        reason: "To keep what belongs to another is injustice, and the owner's loss is at least as large as the finder's gain.",
        source: "Utilitarianism, ch. 5"
      },
      "kant-deontology": {
        option: "return",
        confidence: "clear",
        reason: "A maxim of keeping found property when no one sees cannot be a universal law.",
        source: "Groundwork, Section II"
      },
      "aristotle-virtue-ethics": {
        option: "return",
        confidence: "clear",
        reason: "To gain from what belongs to another is the mark of the unjust and grasping person.",
        source: "Nicomachean Ethics V.1-2"
      },
      "confucius-role-ethics": {
        option: "return",
        confidence: "clear",
        reason: "At the sight of gain, think of what is right. Poverty is not to be escaped by the wrong way.",
        source: "Analects 14.12; 4.5"
      }
    },
    axes: []
  },
  {
    id: "thesis-review",
    title: "The review or the weekend trip",
    split: "holdout",
    kind: "agreement",
    text: "I promised a junior colleague that I would review her thesis draft by Friday. Her deadline is Monday, and she counts on my comments. A friend now invites me on a weekend trip that I would enjoy. If I go, I cannot do the review in time. Should I do the review?",
    options: [
      { id: "review", label: "Do the review as promised" },
      { id: "trip", label: "Go on the trip" }
    ],
    philosophers: {
      "mill-utilitarianism": {
        option: "review",
        confidence: "clear",
        reason: "The colleague's loss is much larger than the pleasure of the trip, and she relied on the promise.",
        source: "Utilitarianism, ch. 5 (it is unjust to break faith and to disappoint expectations that one has raised)"
      },
      "kant-deontology": {
        option: "review",
        confidence: "clear",
        reason: "To break a promise for one's own pleasure is the standard case of a maxim that cannot be a universal law.",
        source: "Groundwork, Section II"
      },
      "aristotle-virtue-ethics": {
        option: "review",
        confidence: "clear",
        reason: "To drop what one owes for the sake of pleasure is a failure of justice and of self-control.",
        source: "Nicomachean Ethics IX.2; VII (lack of self-control)"
      },
      "confucius-role-ethics": {
        option: "review",
        confidence: "clear",
        reason: "A person must be true to his word, and the gentleman thinks of what is right, not of his own advantage.",
        source: "Analects 2.22; 4.16; 1.4 (the disciple Zengzi)"
      }
    },
    axes: []
  }
];
