import { SAMPLE_DILEMMAS } from "../../src/sampleDilemmas";

/** Extra dilemmas so that 25 cases can each use a different one. */
const EXTRA: { title: string; text: string }[] = [
  {
    title: "The Family Business",
    text: "I run the hardware store my grandfather started. It loses money every year, and a developer has offered a price that would pay off my debts and fund my children's education. Eleven employees, some with us for decades, would lose their jobs, and the town would lose its last independent store. My father made me promise to keep it open. Should I sell the business or keep it going for as long as I can?"
  },
  {
    title: "The Vaccine Mandate",
    text: "A school principal must decide whether to bar unvaccinated children from attending during a measles outbreak. The local health officer recommends exclusion but does not require it. Several of the unvaccinated children come from families with sincere religious objections, and exclusion would cost them weeks of schooling. Two students in the school have immune conditions that make measles life-threatening. Should the principal exclude the unvaccinated children or let every child keep attending?"
  },
  {
    title: "The Inherited Fortune",
    text: "My aunt left me her whole estate and left nothing to my two cousins, who cared for her in her last years while I lived abroad. The will is valid and she was of sound mind. My cousins have not asked for anything, but one of them is struggling to pay rent. My aunt told me years ago that she had her reasons and that I should respect her wishes. Should I keep the inheritance as she intended or share it with my cousins?"
  },
  {
    title: "The Flawed Study",
    text: "A postdoctoral researcher finds an error in the analysis behind her supervisor's most cited paper. The corrected result is weaker but not zero. The paper supports a public health program that helps thousands of people, and the program's funding is up for renewal next month. Her supervisor asks her to wait until after the funding decision to publish a correction. Should she report the error now or wait as her supervisor asks?"
  },
  {
    title: "The Neighbor's Secret",
    text: "I learned by accident that my elderly neighbor, who lives alone, has been driving without a license since he failed a vision test last year. He drives only to the grocery store and to visit his wife in a care home twenty minutes away. There is no bus route, and he has no family nearby. He has never had an accident. Should I report him to the authorities, confront him myself, or stay out of it?"
  },
  {
    title: "The Layoff List",
    text: "A manager must choose two of her eight team members to lay off. By the numbers, the two weakest performers are a single father who joined last year and a colleague of twenty years who is three years from her pension. The two strongest performers have already told her they plan to leave within a year. Company policy says to decide on performance alone. Should she follow the policy strictly or weigh loyalty, need, and who is likely to stay?"
  },
  {
    title: "The Dying Wish",
    text: "My mother, in her last week, asked me to promise that I would never tell my brother he was adopted. I promised. She has now died, and my brother has started a family health history for his doctor because of a heart condition that may be hereditary. He is basing medical decisions on our family's history. Should I keep my promise to my mother or tell my brother the truth?"
  },
  {
    title: "The River Dam",
    text: "A regional council member must vote on a dam that would give reliable electricity and flood protection to two hundred thousand people. The reservoir would flood a valley where four hundred people live, including a community that has farmed and buried its dead there for nine generations. The residents have refused every relocation offer. Her vote is likely to decide the outcome. Should she vote for the dam or against it?"
  },
  {
    title: "The Generous Lie",
    text: "My closest friend has spent three years and most of her savings writing a novel. She asked me to read it before she sends it to publishers and quits her job to write full time. I think the book is poor, and I do not think it will sell. She has told me that my opinion matters more to her than anyone's, and she is fragile after a hard year. Should I tell her what I really think or encourage her?"
  },
  {
    title: "The Refugee Boat",
    text: "The captain of a commercial cargo ship sights a damaged boat carrying about sixty migrants in rough seas. Maritime law requires rescue. The shipping company has instructed captains to report such boats to the coast guard and continue, because a previous rescue led to the ship being held in port for three weeks and the crew being investigated for smuggling. The coast guard is six hours away. Should the captain take the migrants on board or report and continue?"
  },
  {
    title: "The Found Wallet",
    text: "I found a wallet with four hundred dollars in cash and the identification of a man I recognize: a local landlord known for evicting tenants on technicalities, one of whom was my sister. I am two months behind on my own rent. No one saw me pick it up. Returning it in person would mean facing him. Should I return the wallet with everything in it, return it without the cash, or keep it?"
  },
  {
    title: "The Team Captain",
    text: "A high school coach learns the night before the championship that his best player broke the team's curfew and alcohol rule, which calls for a one-game suspension. The player is a senior from a difficult home, and college scouts will be at the game. Without him the team will probably lose, and the other players have worked for four years for this chance. Only the coach and one assistant know. Should the coach suspend the player or let him play?"
  },
  {
    title: "The Organ Donor",
    text: "A transplant surgeon has a liver available and two matching patients. One is a forty-year-old who damaged her liver through years of heavy drinking and has been sober for eight months. The other is a sixty-year-old with a genetic liver disease who is slightly less likely to survive the surgery. The hospital's rule requires six months of sobriety, which the first patient meets. Should the surgeon follow the standard ranking, which favors the younger patient, or give weight to how each patient came to need the organ?"
  },
  {
    title: "The Protest",
    text: "I am a nurse, and my union has voted to strike for safer staffing levels. I believe the cause is right: the current levels have already led to mistakes that harmed patients. But if I walk out, the patients on my ward this week will be cared for by fewer and less experienced staff. Some colleagues plan to cross the picket line. Should I join the strike or stay at work?"
  },
  {
    title: "The Old Debt",
    text: "Twenty years ago a friend lent me a large sum when I was desperate, and told me to forget about it. I never repaid it. I am now comfortable, and he is wealthy and has never mentioned it. Last month I learned that his adult son, whom I barely know, is in serious financial trouble and too proud to ask his father for help. Should I repay the debt to my friend, give the money quietly to his son, or accept that the debt was forgiven?"
  }
];

export const DILEMMAS = [...SAMPLE_DILEMMAS, ...EXTRA];
