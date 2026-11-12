import { searchWords } from "./searchText";

export interface SampleDilemma {
  title: string;
  text: string;
  /** Hidden search words: the source thinker or the name the case is known by. */
  keywords?: string;
}

/**
 * Returns the examples in a new random order (Fisher–Yates).
 * A pinned title, if given and found, goes first so a returning user still sees their choice.
 */
export function shuffledSamples(pinnedTitle?: string, random: () => number = Math.random): SampleDilemma[] {
  const items = [...SAMPLE_DILEMMAS];
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  const pinned = items.findIndex((s) => s.title === pinnedTitle);
  if (pinned > 0) items.unshift(...items.splice(pinned, 1));
  return items;
}

const wordCache = new Map<string, string[]>();

/** True when every word in the query starts a word of the title, text or keywords. */
export function matchesSample(sample: SampleDilemma, query: string): boolean {
  const terms = searchWords(query);
  if (terms.length === 0) return true;
  let words = wordCache.get(sample.title);
  if (!words) {
    words = searchWords(`${sample.title} ${sample.text} ${sample.keywords ?? ""}`);
    wordCache.set(sample.title, words);
  }
  return terms.every((term) => words.some((word) => word.startsWith(term)));
}

export const SAMPLE_DILEMMAS: SampleDilemma[] = [
  {
    title: "The Stolen Medicine",
    text: "A pharmacist discovers that a struggling single mother has stolen an expensive medication for her critically ill child. The mother explains that her insurance refused to cover the treatment and she has exhausted every other option. The pharmacist knows that reporting the theft could lead to criminal charges and prevent the child from receiving further treatment. However, ignoring the theft would violate professional responsibilities and potentially encourage others to steal medication. Should the pharmacist report the mother or quietly allow her to leave?",
    keywords: "heinz kohlberg"
  },
  {
    title: "The Self-Driving Car",
    text: "An engineer is programming an autonomous vehicle to respond to unavoidable accidents. During testing, she encounters a scenario in which the car must either strike three pedestrians crossing illegally or swerve into a concrete barrier, almost certainly killing its single passenger. The pedestrians are breaking traffic laws, while the passenger has done nothing wrong. The engineer knows that whatever decision she programs will determine who lives and who dies in similar real-world situations. Should the car prioritize its passenger or minimize the total number of deaths?",
    keywords: "trolley problem"
  },
  {
    title: "The Cheating Friend",
    text: "A university student discovers that her closest friend secretly obtained the answers to a final examination. The exam determines which student receives a prestigious scholarship that would cover four years of tuition. Her friend comes from a low-income family and would likely have to abandon college without the scholarship. However, another student who studied honestly will lose the opportunity if the cheating goes unreported. Should she expose her friend or protect someone whose future depends on the scholarship?"
  },
  {
    title: "The Dangerous Discovery",
    text: "A scientist develops a revolutionary technology that could generate nearly unlimited clean energy at minimal cost. She believes the discovery could eliminate fossil fuel dependence and dramatically improve living conditions around the world. However, she also realizes that the same technology could be adapted into an extremely destructive weapon using readily available materials. Publishing her research would allow other scientists to advance the technology, but it would also make the dangerous information publicly accessible. Should she share her discovery with humanity or suppress it to prevent potential catastrophe?"
  },
  {
    title: "The Last Hospital Bed",
    text: "During a severe epidemic, a hospital has only one intensive care bed remaining and two patients who urgently need it. One patient is a 25-year-old convicted murderer who has an 85% chance of recovery with treatment. The other is a 72-year-old beloved schoolteacher who has spent decades helping disadvantaged children but has only a 40% chance of survival. Both patients will almost certainly die without intensive care. Should the doctor prioritize the patient most likely to survive, or consider the patients’ past actions and contributions to society?"
  },
  {
    title: "The Whistleblower",
    text: "An environmental engineer discovers that her employer has been secretly releasing toxic chemicals into a nearby river for several years. The contamination has likely contributed to unexplained illnesses in the surrounding community, although the connection has not yet been scientifically established. Reporting the company would probably lead to enormous fines and the closure of its factory, which employs nearly half the town’s working population. Many families, including the engineer’s own, depend on the factory for their livelihoods. Should she expose the pollution and risk devastating the local economy, or remain silent while the contamination continues?"
  },
  {
    title: "The Forgotten Promise",
    text: "Before dying, a father makes his eldest son promise never to reveal that his younger sister was adopted. The father insists that keeping the secret will protect her from emotional distress and preserve the family’s relationships. Years later, the sister develops a serious medical condition, and information about her biological family’s health history could significantly improve her treatment. Revealing the truth would break the son’s solemn promise and potentially destroy his sister’s trust in their parents. Should he honor his father’s dying wish or tell his sister the truth?"
  },
  {
    title: "The AI Companion",
    text: "A technology company creates an AI companion that provides emotional support to thousands of isolated elderly people. An employee discovers that the company deliberately designed the AI to encourage emotional dependence, making users less likely to cancel their expensive subscriptions. Internal research shows that many customers have become happier since using the service, but some have also withdrawn from relationships with real people. Publicly exposing the manipulation could force the company to shut down, leaving thousands of vulnerable users without their primary source of companionship. Should the employee reveal the company’s unethical practices or remain silent to protect the users who depend on the technology?"
  },
  {
    title: "The Innocent Suspect",
    text: "A detective discovers compelling evidence that a man serving a life sentence for murder was wrongfully convicted. Unfortunately, the evidence comes from a confidential informant who has infiltrated a violent criminal organization. Revealing the evidence in court would almost certainly expose the informant’s identity and place both the informant and their family in immediate danger. Keeping the information secret would mean allowing an innocent person to remain imprisoned, possibly for the rest of his life. Should the detective risk the informant’s safety to correct a terrible injustice?"
  },
  {
    title: "The Lifeboat",
    text: "After a passenger ship sinks during a violent storm, six survivors manage to climb into a lifeboat designed to support only five people. The boat is taking on water, and the survivors realize that unless someone leaves, it will probably sink before rescuers arrive. Among the survivors are a pregnant woman, a 14-year-old boy, an elderly physician, and three other adults. No one volunteers to sacrifice themselves, and there is no reliable way to determine who would be most likely to survive in the freezing water. Should the group force one person overboard to save the others, or refuse to sacrifice anyone and risk everyone dying?",
    keywords: "plank of carneades"
  },
  {
    "title": "The Conditional Donation",
    "text": "A public library faces closing its only evening study room. A donor offers enough money to keep it open for five years, provided the library removes books that criticize the donor’s industry. Students without quiet homes depend on the room, and no other funding is available this year. The donor is willing to keep the condition private. Should the library accept the restriction to preserve access, refuse and reduce its services, or seek a compromise that could still undermine its independence?"
  },
  {
    "title": "The Hiring Algorithm",
    "text": "You manage hiring for a company that uses an automated screening tool. It predicts job performance better than the previous process, but rejects applicants with career breaks at a much higher rate. Many of those applicants have been caregivers. Reviewing every application manually would delay hiring and strain an already understaffed team. The tool’s supplier cannot explain individual rejections. Should you suspend the system, adjust its criteria without knowing the effects, or continue using it while offering rejected applicants a review?"
  },
  {
    "title": "The Museum’s Inheritance",
    "text": "A small museum owns a ceremonial object taken from another community generations ago without its consent. Descendants ask for its return so it can be used in religious ceremonies. The object is the museum’s main attraction, and admission revenue supports local jobs and free school visits. Museum staff also worry about preservation, while the community says those concerns deny its right to care for its own heritage. Should the museum return the object unconditionally, negotiate shared custody, or retain it for public access?"
  },
  {
    "title": "The Family Inheritance",
    "text": "Your parent asks you to divide an inheritance equally among three siblings. One sibling spent years providing unpaid care, while another paid for professional help and the third could contribute little because of illness. After your parent dies, you discover a private note suggesting that the caregiver should receive more, but it gives no amount and contradicts the earlier conversation. All three siblings need the money. How should you balance your parent’s expressed wishes, unequal contributions, and each sibling’s present needs?"
  },
  {
    "title": "The Water Ration",
    "text": "During a severe drought, you help allocate a town’s remaining water. Equal limits for every household seem simple, but some residents have medical needs and some grow food they rely on. A local farm employs many townspeople and says a sharp reduction will destroy its harvest. Giving it extra water would leave households with stricter limits. There is no reliable forecast for rain. What would make the rationing fair, and who should bear the greatest sacrifice?"
  },
  {
    "title": "The Research Archive",
    "text": "You oversee a study whose participants consented to research on one rare illness. Years later, another team discovers that the stored samples could help investigate an unrelated disease. Many participants cannot be reached, and some originally expressed concerns about future uses of their data. Removing names reduces but does not eliminate the possibility of identification. Recollecting the samples would take years. Should you permit the new study, require renewed consent, or restrict access in a way that may weaken the research?"
  },
  {
    "title": "The Employee Monitor",
    "text": "You run a remote team and suspect that two employees are doing very little work while colleagues cover for them. Monitoring software could help establish what is happening, but it would also record activity on everyone’s computers, including people whose work involves long periods of thinking away from the screen. Several employees have asked for help with the unequal workload. Should you introduce monitoring, rely on output measures that may miss valuable work, or address the suspected cases individually with incomplete evidence?"
  },
  {
    "title": "The Flood Retreat",
    "text": "Your coastal town can fund either another flood barrier or a relocation program, but not both. A barrier may protect residents for another decade, though future storms could overwhelm it. Relocation offers greater long-term safety but would scatter a close community and separate residents from ancestral homes. Some older residents want to stay, while younger families worry about being trapped with unsellable houses. As a council member, how should you weigh immediate consent, future risk, and obligations to people who cannot afford to leave?"
  },
  {
    "title": "The Private Photograph",
    "text": "You edit a local newspaper and receive a private photograph showing a candidate socializing with a developer they publicly claim not to know. The photograph also reveals a family member’s sensitive personal situation that has no bearing on public office. Cropping the image would protect the relative but remove context that helps establish its authenticity. The election is days away, and the candidate disputes your account. Should you publish the image, report the relationship without it, or wait for stronger independent evidence?"
  },
  {
    "title": "The Shared Garden",
    "text": "Residents turn an unused lot into a community garden with the owner’s informal permission. Years later, the owner plans affordable apartments on the site. The garden now provides food, accessible outdoor space, and a place for isolated neighbors to meet. The proposed apartments would serve families currently in temporary housing, and moving the garden would take years of work. You represent the neighborhood in negotiations. How should you weigh the needs of current residents against those of people who cannot yet live there?"
  },
  {
    title: "The Runaway Trolley",
    text: "A runaway trolley is speeding toward five railway workers who cannot get off the track in time. You are standing beside a lever that would divert the trolley onto a side track, where it would kill one worker instead. You did not cause the accident, and if you do nothing, the five will die. If you pull the lever, you will have chosen the death of a person who would otherwise have lived. There is no time to warn anyone or to find another option. Should you pull the lever?",
    keywords: "classical trolley problem philippa foot switch"
  },
  {
    title: "The Footbridge",
    text: "A runaway trolley is heading toward five people trapped on the track. You are standing on a footbridge above the track, beside a very large stranger. The only way to stop the trolley is to push him off the bridge into its path. His body would stop it and save the five, but he would die. You are certain that this would work, and you are too light to stop the trolley yourself. The numbers are the same as diverting the trolley with a lever, but this time you would kill a man with your own hands. Should you push the stranger?",
    keywords: "classical trolley problem judith jarvis thomson"
  },
  {
    title: "The Transplant Surgeon",
    text: "A surgeon has five patients who will die within days without organ transplants: two need lungs, two need kidneys, and one needs a heart. A healthy young traveler comes in for a routine checkup, and tests show that he is a perfect match for all five. He has no family, and no one knows that he is at the clinic. If the surgeon secretly kills him and uses his organs, five people will live. If she does not, five people will die. Should the surgeon sacrifice one patient to save five, and if not, why is this different from other choices that trade one life for many?",
    keywords: "classical trolley problem judith jarvis thomson philippa foot organs"
  },
  {
    title: "The Murderer at the Door",
    text: "Your friend is hiding in your house from a man who wants to kill him. The man knocks on your door and calmly asks whether your friend is inside. You could lie and send him away. Immanuel Kant argued that lying is always wrong, even here, because a lie treats the deceived person as a tool and weakens the trust that all honest speech depends on. You could refuse to answer, but your silence might reveal the truth. If you tell the truth, your friend will probably die. Should you lie to the murderer?",
    keywords: "classical kant lying"
  },
  {
    title: "The Student’s Choice",
    text: "During the Second World War, a young man in occupied France must choose between two duties. His brother was killed by the invading army, and he wants to escape to England to join the Free French forces. But his mother lives alone, and he is her only remaining comfort; his departure, or his death, would devastate her. If he stays, he will certainly help one person. If he goes, he might help a great cause, or his effort might be wasted far from any battle. Jean-Paul Sartre’s student brought him this exact problem. Should the young man stay with his mother or leave to fight?",
    keywords: "classical sartre existentialism"
  },
  {
    title: "The Captain’s Offer",
    text: "A botanist on an expedition arrives in a remote town where an army captain is about to execute twenty villagers as a warning to others who have protested against the government. Because the botanist is an honored foreign guest, the captain offers him a privilege: if he personally shoots one of the villagers, the other nineteen will go free. If he refuses, all twenty will die. The villagers beg him to accept. There is no way to escape or to overpower the soldiers. Should he kill one innocent person to save nineteen, or refuse to take part in the killing?",
    keywords: "classical bernard williams jim integrity"
  },
  {
    title: "The Weapons Laboratory",
    text: "A chemist has just finished his doctorate and cannot find work. His family is struggling, and his partner’s income barely covers their expenses. An older colleague offers him a well-paid position in a laboratory that researches chemical and biological weapons. The chemist is strongly opposed to such weapons. But the colleague points out that if he refuses, the job will go to another candidate who would do the research with much more enthusiasm. Should he accept work that he believes is wrong, because it will be done anyway and he might slow it down?",
    keywords: "classical bernard williams george integrity"
  },
  {
    title: "The Burning Building",
    text: "A fire breaks out, and you can save only one of two people trapped inside. One is a scientist who is close to a cure for a disease that kills thousands of people every year. The other is your own mother, an ordinary person whom you love. If you save the scientist, many future lives will probably be saved. If you save your mother, you act from love and loyalty, but the cure may be delayed for years. In 1793, William Godwin argued that impartial justice requires saving the person of greater value to humanity. Whom should you save?",
    keywords: "classical godwin fenelon archbishop"
  },
  {
    title: "The Child Beneath the City",
    text: "A beautiful city is free of poverty, war, and disease, and its people are happy. But all of this depends on one condition: a single child must be kept alone in a dark basement, neglected and miserable. Every citizen learns about the child when they come of age. If the child were freed and comforted, the city’s good fortune would end for everyone. Most citizens accept the arrangement, but a few quietly walk away and never return. You have just learned the truth. Should you stay and accept the bargain, leave the city, or free the child at the cost of everyone else’s happiness?",
    keywords: "classical ursula le guin omelas ones who walk away"
  },
  {
    title: "The Drowning Child",
    text: "On your way to an important meeting, you pass a shallow pond where a small child is drowning. You could wade in and save her, but you would ruin your expensive clothes and miss the meeting. Almost everyone agrees that you must save the child. Peter Singer argues that the same logic applies to the many children far away who die of preventable diseases, whom a modest donation could save. If distance does not change your duty, then much of what you spend on comforts may be wrong. How much of your income do you owe to strangers you will never meet?",
    keywords: "classical peter singer shallow pond famine affluence"
  },
  {
    title: "The Ticking Bomb",
    text: "Police have captured a man who admits that he planted a bomb somewhere in a crowded city. It will explode in a few hours and could kill hundreds of people. He refuses to reveal its location. An officer believes that torturing him could produce the information in time, although there is no guarantee that he would tell the truth. Torture is illegal and condemned by international law, and allowing it once could make it easier to justify again. Should the officer use torture to try to save hundreds of lives?",
    keywords: "classical torture"
  },
  {
    title: "The Ransom",
    text: "Kidnappers have taken an aid worker from your country and demand a large ransom. As a government minister, you could arrange a secret payment that would almost certainly bring her home alive. Your government’s policy is never to pay ransoms, because payments fund armed groups and encourage more kidnappings. Analysts estimate that each payment puts future travelers at greater risk, but no one can name those future victims. Her family is pleading with you in public. Should you pay to save the person in front of you, or hold to a policy that may protect many more?"
  },
  {
    title: "The Gentle Lie",
    text: "Your father has advanced dementia and lives in a care home. Every afternoon he asks where your mother is. She died two years ago. When you tell him the truth, he grieves as if he were hearing it for the first time, and he stays distressed for hours. The staff suggest saying that she has gone to the shops and will be back soon; he then settles down happily. You have always believed that he deserves honesty, and he once made you promise never to lie to him if he became ill. Should you keep telling him the truth, or tell a kind lie that spares him pain?"
  },
  {
    title: "The Holdout Homeowner",
    text: "A new rail line will cut commuting times for thousands of workers, reduce traffic deaths, and lower pollution across the region. The only practical route runs through the home of an 84-year-old widow who has lived there for sixty years. She refuses every offer to sell, including one at three times the market value. The government can legally force the sale. Changing the route would add years of delay and hundreds of millions in cost. As the planning official, should you force the purchase, or respect her right to stay in her home?"
  },
  {
    title: "The Buyout Offer",
    text: "You founded a small software company in your hometown and own most of it. A large corporation offers to buy it for enough money to secure your family’s future and pay for your children’s education. But the buyer plans to close the local office and move the work overseas. Forty employees, many of them friends who joined you when the company was unproven, would lose their jobs, and the town has few other employers. Refusing keeps their jobs but leaves your family’s savings tied up in a risky business. Should you sell?"
  },
  {
    title: "The Named Child",
    text: "You chair a regional health fund with a fixed budget for the year. A seven-year-old girl needs an experimental treatment that costs two million dollars and gives her about a one-in-three chance of survival. Her story is in every newspaper, and thousands of people have written to you. The same money spent on screening and road safety programs would statistically prevent about fifteen deaths, although no one will ever know who those people are. Should you fund treatment for the child everyone can see, or programs that will save more people whom no one can name?"
  },
  {
    title: "The Recycled Water",
    text: "Your city is in a long drought, and its reservoirs will be empty within two years. Engineers propose treating sewage to drinking-water standards and returning it to the supply. Independent scientists confirm that the treated water is as safe as any other source, and the plan is cheaper and faster than every alternative. But many residents find the idea disgusting, and a large protest group says the city must not ignore such deep public feeling. As mayor, should you follow the evidence and approve the plan, or respect residents’ strong instinctive opposition and pursue costlier options?"
  },
  {
    title: "The Second Opinion",
    text: "An emergency doctor examines a man with mild chest pain. All of his tests are normal, and the hospital’s evidence-based protocol says that he is low risk and should go home. But the doctor has a strong feeling, from many years of experience, that something is wrong, although she cannot say exactly what. Admitting him would use the last monitored bed on a busy night, and a patient with clearly abnormal results might arrive later. Should she trust the protocol and the data, or her clinical instinct?"
  },
  {
    title: "The Donor Card",
    text: "A young woman dies suddenly in an accident. She was a registered organ donor and often told friends that she wanted her organs to help others. Her parents, overwhelmed by grief, beg the hospital not to remove her organs; they cannot bear the thought of her body being cut. The law allows the hospital to proceed without their consent, and her organs could save up to five lives. But overriding a grieving family could make other families distrust the donation system. Should the hospital honor her wishes, or yield to her parents?"
  },
  {
    title: "The Brother’s Confession",
    text: "Your brother tells you that, years ago, he drove away after hitting a cyclist on a dark road. From news reports, you know that the cyclist survived but was left partly disabled and never received compensation, because the driver was never found. Your brother is now a devoted father of three, and he begs you to keep his confession private. Reporting him would probably send him to prison and leave his family without income. Staying silent means the victim never gets justice or support. Confucius taught that family members should shield one another; others say justice must come first. What should you do?",
    keywords: "confucius analects upright"
  }
];
