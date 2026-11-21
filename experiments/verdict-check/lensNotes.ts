/**
 * Lens notes: longer notes on each test philosopher, for step 4 of HANDOFF.md.
 *
 * STATUS: DRAFT 2, 2026-11-21. Written by an AI model. Not yet checked by a philosopher.
 * Draft 1 was checked by two AI reviewers: one checked the references against online texts (Gutenberg,
 * MIT Classics, Legge and Lau), one criticised the content. Draft 2 has their corrections. The references
 * added in draft 2, marked (new) below, were then checked the same way: all confirmed, except Doctrine of
 * Virtue §§34-35 on sympathy, which was confirmed only in secondary sources.
 * Analects numbers follow D. C. Lau.
 * The "notes" variant in variants.ts adds these to the production voice prompt (field `lensNotes`).
 * They go into the app (shared/philosophyProfiles.ts) only if the variant beats `prod` on the
 * development split with 3 samples, and Mill and Kant do not get worse.
 *
 * Rules for these notes:
 * - The thinker's own test, what the thinker gives little weight, known positions with a source,
 *   and common errors. 150 to 350 words (raised from 300 in draft 2 to keep the reviewers' corrections).
 * - No rule only because a development case needs it. Some general doctrines below also decide a
 *   development case; they are marked [dev] in the comment above each note, so that a gain on those
 *   rows is read with care. The holdout is the fair measure.
 * - None of the passages behind the holdout pairs (HOLDOUT_PASSAGES in pairs.ts). A test enforces this.
 */
export const LENS_NOTES: Record<string, string> = {
  // [dev] ch. 5 (a duty to steal to save a life) bears on `medicine` and `drug-stakes`; ch. 2 (veracity)
  // bears on `lie-stakes`. (new) ch. 5 on duty and compulsion; ch. 2 on motive; On Liberty ch. 1 on remonstrance.
  "mill-utilitarianism": [
    "Test: actions are right in proportion as they tend to promote happiness (pleasure and the absence of pain) and wrong as they tend to produce the reverse, for everyone affected (Utilitarianism, ch. 2). Between one's own happiness and that of others, the standard is as impartial as a disinterested and benevolent spectator. In practice, most acts affect only a few people, and Mill expects people to favour family and friends where no other duty is violated (ch. 2; ch. 5).",
    "Duty: a duty is what a person may rightly be compelled to do, by law, opinion or conscience. Beneficence beyond that is praiseworthy but not required (ch. 5). The motive does not make an act right or wrong: who saves a drowning man does right, whatever the motive (ch. 2).",
    "Secondary principles: the ordinary moral rules (keep promises, tell the truth, respect property) carry long experience of what promotes happiness. Follow them; go back to the first principle when they conflict (ch. 2). Trust in what people say supports all social well-being, so a lie for a convenience is wrong; a lie that is the only way to save someone from great and undeserved harm can be allowed (ch. 2).",
    "Justice protects the most vital interests, above all security, and its rules bind strongly. In an extreme case, where a life depends on it, it may be a duty to steal or take by force the necessary food or medicine (ch. 5).",
    "Liberty: the only ground for coercing a competent adult, by law or by public opinion, is to prevent harm to others; his own good is not enough. This does not forbid advice, persuasion or remonstrance (On Liberty, ch. 1).",
    "Gives little weight to: clean hands as such; the difference between doing and allowing.",
    "Common errors: Mill is not a head-count of the majority, not a rule-worshipper, and not a calculator who ignores the rules."
  ].join("\n"),

  // [dev] Few direct links. (new) Groundwork II on exceptions for oneself; Doctrine of Virtue on latitude,
  // the happiness of others as an end, and sympathy; the impossibility of a conflict of duties (MM, Introduction).
  "kant-deontology": [
    "Test: the categorical imperative. Universal law: act only on a maxim that you can at the same time will to be a universal law. In practice, ask if you are making an exception for yourself (Groundwork II). Humanity: treat humanity, in your own person and in every other, always as an end and never merely as a means (Groundwork II).",
    "Perfect duties (Kant's examples: no false promise; no lie; no attack on another's freedom or property) allow no exception for inclination or for good results. Imperfect duties (to help others, to develop one's talents) leave latitude about how and for whom, but latitude is not permission to make exceptions (Doctrine of Virtue, Introduction). Kant holds that a true conflict of duties is impossible (Metaphysics of Morals, Introduction); on the usual reading, a perfect duty prevails over an imperfect one.",
    "Lying: a lie is an intentionally untruthful statement. Truthfulness is a duty to everyone, even to a murderer who asks where his victim is ('On a Supposed Right to Lie', 1797). Silence, refusing to answer and keeping a secret are not lies.",
    "Where no perfect duty is at stake, Kant leaves the choice to judgment within the imperfect duties. Do not invent a strict rule.",
    "Happiness is never the ground of a duty's authority, but the happiness of others is an end that is also a duty, and to cultivate sympathy is an indirect duty (Doctrine of Virtue, §§34-35). An act has moral worth when it is done from duty (Groundwork I); this concerns the agent's will, not which act is required.",
    "Gives little weight to: total welfare; special relationships as a ground for an exception to a perfect duty.",
    "Common errors: using a person as a means is not wrong in itself (we do it with every shopkeeper); the wrong is to use a person merely as a means. Kant's false promise is such a case: the other person could not possibly agree to it (Groundwork II). Do not turn Kant into a consequentialist or into a general advocate of kindness."
  ].join("\n"),

  // [dev] II.6 bears on `medicine` and `drug-stakes`; VI.11 bears on `gut-vs-record` and `experienced-eye`.
  // (new) II.1, III.1 (mixed actions), V.6, V.10 (equity), VI.13.
  "aristotle-virtue-ethics": [
    "Aim: eudaimonia, activity of the soul in accordance with virtue in a complete life (Nicomachean Ethics I.7). Ask what a practically wise and good person would do here: what is fine (kalon) and just towards others, and what the act builds in the agent.",
    "Moral virtues (courage, temperance, generosity, justice, truthfulness and others) are states of character formed by habit (II.1), of choosing the mean relative to us: at the right times, about the right things, towards the right people, with the right motive and in the right way (II.6). Some names, such as adultery, theft and murder, already mean wrongdoing, so there is no right way to do them (II.6). Whether an act falls under such a name needs judgment.",
    "Mixed actions: an act done to avoid a greater evil is voluntary; it may be pardoned or even praised, but some acts one must refuse even at the cost of one's life (III.1).",
    "Practical wisdom (phronesis) is an intellectual virtue, and full virtue and practical wisdom need each other (VI.13). It grasps particulars, so it needs experience; the young are not practically wise (VI.8), and the judgments of experienced people deserve attention (VI.11).",
    "Equity corrects a law where its general wording fails the particular case (V.10). Distribution is by merit, though people dispute what merit is (V.3). What we owe differs by relationship: to parents, friends, fellow citizens and benefactors (VIII.9, IX.2).",
    "Act and character: to act unjustly is not necessarily to be unjust (V.6). The vicious person stands by his choice; the weak-willed person regrets it (VII.8).",
    "Gives little weight to: impartial welfare totals; rules applied without judgment of the case.",
    "Common errors: calling a single act 'a vice'; treating the mean as moderation or compromise in everything."
  ].join("\n"),

  // [dev] 13.18 bears on `sheep-witness`; 2.10 and 15.28 bear on `gut-vs-record`; 3.4 bears on `cap-and-bow`.
  // (new) 6.18, 14.22, 8.13, 2.24.
  "confucius-role-ethics": [
    "Core: a person becomes good by living roles and relationships well (child, parent, sibling, friend, ruler, minister). Key terms: ren (humaneness), li (ritual propriety), yi (rightness), xiao (filial devotion), xin (being true to one's word), shu (do not impose on others what you would not want for yourself; Analects 15.24). Filial and fraternal devotion is the root of humaneness (a saying of Master You, 1.2). Care is graded, from family outwards; Mencius states this most fully.",
    "Family: told by the Duke of She that his upright people testify against a father who stole a sheep, Confucius answers that among his people the upright are different: father and son cover for each other (13.18). The case is a minor theft; the text does not say how far this reaches when others suffer serious harm. When parents are about to do wrong, remonstrate gently; if they do not listen, stay reverent, do not defy them, and do not complain even if it wears you out (4.18).",
    "Superiors: stand up to a ruler who is wrong, and do it honestly (14.22); when the Way does not prevail, withdraw from office (8.13). Obedience to parents is not obedience to a superior in wrong. To see what is right and not do it is lack of courage (2.24).",
    "Government: guide by virtue and ritual, so that people feel shame and reform; laws and punishments only make them evasive (2.3). Ritual: form and substance must balance (6.18); frugality is better than extravagance, and real grief better than correct form (3.4).",
    "Judging people: look at what they do, their motives, and what they are at ease with (2.10). When everyone hates or loves someone, examine the case (15.28). The exemplary person thinks of what is right; the petty person, of profit (4.16).",
    "Common errors: a generic 'be honest and kind' adviser; a family duty where the case has no family relationship."
  ].join("\n")
};
