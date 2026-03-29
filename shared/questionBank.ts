import type { Question } from "./contracts";

export const questionBank: Question[] = [
  {
    id: "op-1",
    axis: "outcomesPrinciples",
    prompt: "If telling a painful lie would clearly prevent serious harm, how justified would it feel?",
    lowLabel: "Judge by outcomes",
    highLabel: "Judge by principle",
    polarity: 1
  },
  {
    id: "op-2",
    axis: "outcomesPrinciples",
    prompt: "When a rule has one disastrous exception, how strongly should that exception override the rule?",
    lowLabel: "Exceptions matter most",
    highLabel: "Rules still govern",
    polarity: 1
  },
  {
    id: "op-3",
    axis: "outcomesPrinciples",
    prompt: "How much should a person break a promise if that is the best way to reduce overall suffering?",
    lowLabel: "Reduce suffering first",
    highLabel: "Keep promises first",
    polarity: 1
  },
  {
    id: "op-4",
    axis: "outcomesPrinciples",
    prompt: "How persuasive is the thought that moral rules exist mainly because they usually lead to better consequences?",
    lowLabel: "Very persuasive",
    highLabel: "Not very persuasive",
    polarity: 1
  },
  {
    id: "op-5",
    axis: "outcomesPrinciples",
    prompt: "If an action feels dirty but prevents many people from being harmed, how much should that result dominate the decision?",
    lowLabel: "Result should dominate",
    highLabel: "Certain acts stay wrong",
    polarity: 1
  },
  {
    id: "op-6",
    axis: "outcomesPrinciples",
    prompt: "How strongly should morality protect lines that should not be crossed even for a better result?",
    lowLabel: "Not very strongly",
    highLabel: "Very strongly",
    polarity: -1
  },
  {
    id: "op-7",
    axis: "outcomesPrinciples",
    prompt: "Suppose a policy violates a cherished norm but measurably improves lives. Which matters more?",
    lowLabel: "Improved lives",
    highLabel: "Honoring the norm",
    polarity: 1
  },
  {
    id: "op-8",
    axis: "outcomesPrinciples",
    prompt: "How important is it that a decision-maker keeps their hands clean even if the final outcome is worse?",
    lowLabel: "Not very important",
    highLabel: "Extremely important",
    polarity: -1
  },
  {
    id: "op-9",
    axis: "outcomesPrinciples",
    prompt: "When duties clash with likely consequences, what should usually break the tie?",
    lowLabel: "Consequences",
    highLabel: "Duties",
    polarity: 1
  },
  {
    id: "op-10",
    axis: "outcomesPrinciples",
    prompt: "How much should moral judgment focus on what an action produces rather than what kind of act it is?",
    lowLabel: "Focus on what it produces",
    highLabel: "Focus on the act itself",
    polarity: 1
  },
  {
    id: "ic-1",
    axis: "individualCollective",
    prompt: "When personal freedom clashes with what benefits a community, which side should usually prevail?",
    lowLabel: "Personal freedom",
    highLabel: "Shared good",
    polarity: 1
  },
  {
    id: "ic-2",
    axis: "individualCollective",
    prompt: "How much should someone sacrifice their own legitimate interests for the sake of group welfare?",
    lowLabel: "Only a little",
    highLabel: "Quite a lot",
    polarity: 1
  },
  {
    id: "ic-3",
    axis: "individualCollective",
    prompt: "How persuasive is the idea that moral life starts with duties to particular people and communities rather than isolated individuals?",
    lowLabel: "Not persuasive",
    highLabel: "Very persuasive",
    polarity: 1
  },
  {
    id: "ic-4",
    axis: "individualCollective",
    prompt: "If a workplace policy helps the team but places an unfair burden on one person, how much weight should the team benefit carry?",
    lowLabel: "Very little",
    highLabel: "A great deal",
    polarity: 1
  },
  {
    id: "ic-5",
    axis: "individualCollective",
    prompt: "How central is respecting each person’s own project or life plan when making moral decisions?",
    lowLabel: "Not central",
    highLabel: "Very central",
    polarity: -1
  },
  {
    id: "ic-6",
    axis: "individualCollective",
    prompt: "When resources are limited, how much should moral reasoning prioritize the stability of the whole group over one person’s preference?",
    lowLabel: "Prioritize the person",
    highLabel: "Prioritize the group",
    polarity: 1
  },
  {
    id: "ic-7",
    axis: "individualCollective",
    prompt: "How strongly should belonging, relationships, and mutual dependence shape an ethical judgment?",
    lowLabel: "Only slightly",
    highLabel: "Very strongly",
    polarity: 1
  },
  {
    id: "ic-8",
    axis: "individualCollective",
    prompt: "Suppose a decision protects social trust but limits one person’s freedom. Which concern matters more?",
    lowLabel: "The individual freedom",
    highLabel: "The social trust",
    polarity: 1
  },
  {
    id: "ic-9",
    axis: "individualCollective",
    prompt: "How cautious should we be about asking individuals to carry costs for a larger cause?",
    lowLabel: "Very cautious",
    highLabel: "Less cautious if the cause is worthy",
    polarity: 1
  },
  {
    id: "ic-10",
    axis: "individualCollective",
    prompt: "How morally important is it that each person chooses for themselves even when that weakens group coordination?",
    lowLabel: "Extremely important",
    highLabel: "Less important than coordination",
    polarity: -1
  },
  {
    id: "ri-1",
    axis: "reasonIntuition",
    prompt: "When a moral choice feels torn, how much should careful argument outrank your initial moral gut reaction?",
    lowLabel: "Careful argument",
    highLabel: "Moral intuition",
    polarity: 1
  },
  {
    id: "ri-2",
    axis: "reasonIntuition",
    prompt: "How suspicious are you of ethical conclusions that sound elegant in theory but feel humanly wrong?",
    lowLabel: "Not very suspicious",
    highLabel: "Very suspicious",
    polarity: 1
  },
  {
    id: "ri-3",
    axis: "reasonIntuition",
    prompt: "How much should consistency across cases matter when it conflicts with a strong immediate sense of what is right here?",
    lowLabel: "Consistency should matter more",
    highLabel: "The immediate sense should matter more",
    polarity: 1
  },
  {
    id: "ri-4",
    axis: "reasonIntuition",
    prompt: "If someone cannot explain their judgment but it rings morally true, how much respect should that carry?",
    lowLabel: "Not much",
    highLabel: "A lot",
    polarity: 1
  },
  {
    id: "ri-5",
    axis: "reasonIntuition",
    prompt: "How much should ethical reflection try to correct instinctive reactions rather than trust them?",
    lowLabel: "Correct them",
    highLabel: "Trust them",
    polarity: 1
  },
  {
    id: "ri-6",
    axis: "reasonIntuition",
    prompt: "When a moral problem is emotionally charged, what should you lean on most?",
    lowLabel: "Disciplined reasoning",
    highLabel: "Deep moral feeling",
    polarity: 1
  },
  {
    id: "ri-7",
    axis: "reasonIntuition",
    prompt: "How much should an ethical framework be judged by whether it can be defended step by step in public reasons?",
    lowLabel: "A great deal",
    highLabel: "Only somewhat",
    polarity: -1
  },
  {
    id: "ri-8",
    axis: "reasonIntuition",
    prompt: "How often do your best moral judgments arrive before you can fully justify them?",
    lowLabel: "Rarely",
    highLabel: "Very often",
    polarity: 1
  },
  {
    id: "ri-9",
    axis: "reasonIntuition",
    prompt: "How much should ethical maturity involve refining one’s intuitions instead of replacing them with abstract theory?",
    lowLabel: "Very little",
    highLabel: "A great deal",
    polarity: 1
  },
  {
    id: "ri-10",
    axis: "reasonIntuition",
    prompt: "When two values collide, how much confidence do you place in explicit reasoning to sort them out well?",
    lowLabel: "High confidence",
    highLabel: "Low confidence",
    polarity: -1
  }
];
