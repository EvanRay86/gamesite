import { VocabVaultPuzzle, VocabWord } from "@/types/vocab-vault";
import { getSupabase } from "@/lib/supabase";

const SEED_PUZZLES: VocabWord[][] = [
  // Puzzle 0
  [
    { word: "EPHEMERAL", definition: "Lasting for a very short time", example: "The beauty of the cherry blossoms is EPHEMERAL, fading within a week." },
    { word: "UBIQUITOUS", definition: "Present, appearing, or found everywhere", example: "Smartphones have become UBIQUITOUS in modern society." },
    { word: "PRAGMATIC", definition: "Dealing with things sensibly and realistically", example: "She took a PRAGMATIC approach to solving the budget crisis." },
    { word: "ELOQUENT", definition: "Fluent or persuasive in speaking or writing", example: "The senator delivered an ELOQUENT speech that moved the audience to tears." },
    { word: "RESILIENT", definition: "Able to recover quickly from difficulties", example: "The RESILIENT community rebuilt after the hurricane destroyed their homes." },
  ],
  // Puzzle 1
  [
    { word: "SYCOPHANT", definition: "A person who acts obsequiously to gain advantage", example: "The king surrounded himself with every SYCOPHANT who would flatter him." },
    { word: "PERFUNCTORY", definition: "Carried out with minimal effort or reflection", example: "He gave the report a PERFUNCTORY glance before signing it." },
    { word: "CACOPHONY", definition: "A harsh, discordant mixture of sounds", example: "The CACOPHONY of car horns and jackhammers made conversation impossible." },
    { word: "AMBIVALENT", definition: "Having mixed feelings or contradictory ideas about something", example: "She felt AMBIVALENT about accepting the job offer in another city." },
    { word: "TENACIOUS", definition: "Holding firmly to something; persistent", example: "The TENACIOUS reporter spent months investigating the corruption scandal." },
  ],
  // Puzzle 2
  [
    { word: "BENEVOLENT", definition: "Well-meaning and kindly", example: "The BENEVOLENT donor funded scholarships for underprivileged students." },
    { word: "CAPRICIOUS", definition: "Given to sudden and unaccountable changes of mood or behavior", example: "The CAPRICIOUS weather shifted from sunshine to hailstorms within an hour." },
    { word: "DILIGENT", definition: "Having or showing care and conscientiousness in one's work", example: "The DILIGENT student reviewed every chapter before the final exam." },
    { word: "ESOTERIC", definition: "Intended for or understood by only a small number of people", example: "The professor's lecture on ESOTERIC philosophy confused most of the class." },
    { word: "FACETIOUS", definition: "Treating serious issues with deliberately inappropriate humor", example: "His FACETIOUS remark during the meeting offended several colleagues." },
  ],
  // Puzzle 3
  [
    { word: "GREGARIOUS", definition: "Fond of company; sociable", example: "The GREGARIOUS host made sure every guest felt welcome at the party." },
    { word: "HARBINGER", definition: "A person or thing that announces the approach of something", example: "The robin is often considered a HARBINGER of spring." },
    { word: "INEFFABLE", definition: "Too great or extreme to be expressed in words", example: "She felt an INEFFABLE joy when she held her newborn for the first time." },
    { word: "JUXTAPOSE", definition: "To place close together for contrasting effect", example: "The artist chose to JUXTAPOSE dark and light imagery in the painting." },
    { word: "KINETIC", definition: "Relating to or resulting from motion", example: "The sculpture used KINETIC elements that moved with the wind." },
  ],
  // Puzzle 4
  [
    { word: "LETHARGIC", definition: "Affected by a lack of energy or enthusiasm", example: "The heat made everyone feel LETHARGIC and unwilling to move." },
    { word: "METICULOUS", definition: "Showing great attention to detail", example: "The METICULOUS architect reviewed every measurement twice before construction began." },
    { word: "NEFARIOUS", definition: "Wicked or criminal", example: "The detective uncovered the NEFARIOUS scheme to defraud investors." },
    { word: "OBSTINATE", definition: "Stubbornly refusing to change one's opinion or course of action", example: "The OBSTINATE child refused to eat vegetables no matter what." },
    { word: "PENCHANT", definition: "A strong or habitual liking for something", example: "She has a PENCHANT for collecting vintage postcards from flea markets." },
  ],
  // Puzzle 5
  [
    { word: "QUIXOTIC", definition: "Exceedingly idealistic; unrealistic and impractical", example: "His QUIXOTIC plan to end all poverty overnight impressed no one." },
    { word: "RECALCITRANT", definition: "Having an obstinately uncooperative attitude", example: "The RECALCITRANT witness refused to answer questions during the trial." },
    { word: "SAGACIOUS", definition: "Having or showing keen mental discernment and good judgment", example: "The SAGACIOUS investor predicted the market downturn months in advance." },
    { word: "TACITURN", definition: "Reserved or uncommunicative in speech; saying little", example: "The TACITURN farmer rarely spoke more than a few words at a time." },
    { word: "UNCTUOUS", definition: "Excessively flattering or ingratiating", example: "The salesman's UNCTUOUS manner made the customers suspicious." },
  ],
  // Puzzle 6
  [
    { word: "VINDICTIVE", definition: "Having or showing a strong desire for revenge", example: "The VINDICTIVE former employee leaked confidential files to the press." },
    { word: "WISTFUL", definition: "Having or showing a feeling of vague or regretful longing", example: "She gazed out the window with a WISTFUL expression, remembering her childhood home." },
    { word: "ZEALOUS", definition: "Having or showing great energy or enthusiasm for a cause", example: "The ZEALOUS volunteers worked through the night to prepare the event." },
    { word: "ABERRANT", definition: "Departing from an accepted standard", example: "The scientist investigated the ABERRANT data that contradicted the hypothesis." },
    { word: "BELLIGERENT", definition: "Hostile and aggressive", example: "The BELLIGERENT customer shouted at the cashier over a minor price difference." },
  ],
  // Puzzle 7
  [
    { word: "COGENT", definition: "Clear, logical, and convincing", example: "The lawyer presented a COGENT argument that swayed the jury." },
    { word: "DEARTH", definition: "A scarcity or lack of something", example: "There is a DEARTH of affordable housing in the city center." },
    { word: "EBULLIENT", definition: "Cheerful and full of energy", example: "Her EBULLIENT personality lit up every room she entered." },
    { word: "FASTIDIOUS", definition: "Very attentive to accuracy and detail", example: "The FASTIDIOUS editor caught every grammatical error in the manuscript." },
    { word: "GARRULOUS", definition: "Excessively talkative, especially on trivial matters", example: "The GARRULOUS neighbor spent an hour discussing the weather." },
  ],
  // Puzzle 8
  [
    { word: "HACKNEYED", definition: "Lacking significance through overuse; unoriginal", example: "The movie relied on HACKNEYED plot twists that surprised no one." },
    { word: "ICONOCLAST", definition: "A person who attacks cherished beliefs or institutions", example: "The ICONOCLAST challenged every tradition the organization held dear." },
    { word: "JUDICIOUS", definition: "Having or showing good judgment", example: "A JUDICIOUS use of resources allowed the project to finish under budget." },
    { word: "LANGUID", definition: "Displaying or having a disinclination for physical exertion", example: "The cat stretched in a LANGUID manner across the sunny windowsill." },
    { word: "MAGNANIMOUS", definition: "Generous or forgiving, especially toward a rival", example: "The MAGNANIMOUS winner congratulated her opponent and praised her effort." },
  ],
  // Puzzle 9
  [
    { word: "NEBULOUS", definition: "Vague or ill-defined", example: "The company's strategy remained NEBULOUS despite hours of meetings." },
    { word: "OBSEQUIOUS", definition: "Obedient or attentive to an excessive degree", example: "The OBSEQUIOUS assistant agreed with every word the boss said." },
    { word: "PARSIMONIOUS", definition: "Excessively unwilling to spend money; stingy", example: "The PARSIMONIOUS landlord refused to repair the broken heater." },
    { word: "QUINTESSENTIAL", definition: "Representing the most perfect example of a quality", example: "The small cafe was the QUINTESSENTIAL Parisian dining experience." },
    { word: "RETICENT", definition: "Not revealing one's thoughts or feelings readily", example: "He remained RETICENT about his plans until the deal was finalized." },
  ],
  // Puzzle 10
  [
    { word: "SANGUINE", definition: "Optimistic or positive, especially in a difficult situation", example: "Despite the setbacks, she remained SANGUINE about the project's success." },
    { word: "TRUCULENT", definition: "Eager or quick to argue or fight", example: "The TRUCULENT debater challenged every point with fierce intensity." },
    { word: "USURP", definition: "To take a position of power illegally or by force", example: "The general attempted to USURP the throne through a military coup." },
    { word: "VENERATE", definition: "To regard with great respect", example: "Many cultures VENERATE their elders as sources of wisdom." },
    { word: "AMELIORATE", definition: "To make something bad or unsatisfactory better", example: "The new policy was designed to AMELIORATE working conditions in factories." },
  ],
  // Puzzle 11
  [
    { word: "BOMBASTIC", definition: "High-sounding but with little meaning; inflated", example: "The politician's BOMBASTIC speech impressed few who listened carefully." },
    { word: "COMPENDIOUS", definition: "Containing or presenting the essential facts in a comprehensive but concise way", example: "The COMPENDIOUS guide covered everything a traveler needed to know." },
    { word: "DELETERIOUS", definition: "Causing harm or damage", example: "Smoking has DELETERIOUS effects on both the lungs and heart." },
    { word: "ENERVATE", definition: "To cause someone to feel drained of energy", example: "The oppressive humidity seemed to ENERVATE everyone at the outdoor event." },
    { word: "FRIVOLOUS", definition: "Not having any serious purpose or value", example: "The judge dismissed the FRIVOLOUS lawsuit immediately." },
  ],
  // Puzzle 12
  [
    { word: "GRATUITOUS", definition: "Uncalled for; lacking good reason", example: "The film was criticized for its GRATUITOUS violence that added nothing to the story." },
    { word: "HEGEMONY", definition: "Leadership or dominance of one group over others", example: "The empire maintained its HEGEMONY over the region for centuries." },
    { word: "IMPERVIOUS", definition: "Unable to be affected or disturbed by", example: "She seemed IMPERVIOUS to the criticism directed at her work." },
    { word: "JURISPRUDENCE", definition: "The theory or philosophy of law", example: "The professor specialized in constitutional JURISPRUDENCE and civil liberties." },
    { word: "KOWTOW", definition: "To act in an excessively subservient manner", example: "He refused to KOWTOW to the demands of the unreasonable client." },
  ],
  // Puzzle 13
  [
    { word: "LACONIC", definition: "Using very few words", example: "The LACONIC reply of 'no' ended the entire debate." },
    { word: "MERCURIAL", definition: "Subject to sudden or unpredictable changes of mood", example: "Her MERCURIAL temperament made it hard to predict how she would react." },
    { word: "NONPLUSSED", definition: "Surprised and confused so much that one is unsure how to react", example: "He was completely NONPLUSSED by the unexpected question during the interview." },
    { word: "OPULENT", definition: "Ostentatiously rich and luxurious", example: "The OPULENT ballroom featured crystal chandeliers and gold-leaf ceilings." },
    { word: "PERNICIOUS", definition: "Having a harmful effect, especially in a gradual or subtle way", example: "The PERNICIOUS rumor slowly destroyed her reputation over several months." },
  ],
  // Puzzle 14
  [
    { word: "QUERULOUS", definition: "Complaining in a whiny manner", example: "The QUERULOUS patient complained about everything from the food to the lighting." },
    { word: "RANCOROUS", definition: "Characterized by bitterness or resentment", example: "The RANCOROUS divorce proceedings lasted over two years." },
    { word: "SPURIOUS", definition: "Not being what it purports to be; false or fake", example: "The journalist exposed the SPURIOUS claims made by the company." },
    { word: "TORPID", definition: "Mentally or physically inactive; lethargic", example: "The TORPID snake lay motionless in the cool morning air." },
    { word: "UNPRECEDENTED", definition: "Never done or known before", example: "The company achieved UNPRECEDENTED growth in its first year of operation." },
  ],
  // Puzzle 15
  [
    { word: "VOCIFEROUS", definition: "Vehement or clamorous in expressing feelings", example: "The VOCIFEROUS crowd demanded an encore after the concert ended." },
    { word: "WHIMSICAL", definition: "Playfully quaint or fanciful, especially in an appealing way", example: "The garden was filled with WHIMSICAL sculptures of animals and fairies." },
    { word: "ACRIMONIOUS", definition: "Angry and bitter in tone or manner", example: "The ACRIMONIOUS exchange between the candidates dominated the evening news." },
    { word: "BLITHE", definition: "Showing a casual and cheerful indifference", example: "She showed a BLITHE disregard for the rules that frustrated her colleagues." },
    { word: "CIRCUMSPECT", definition: "Wary and unwilling to take risks", example: "The CIRCUMSPECT investor reviewed every detail before committing funds." },
  ],
  // Puzzle 16
  [
    { word: "DIDACTIC", definition: "Intended to teach or instruct", example: "The novel had a strongly DIDACTIC tone that some readers found preachy." },
    { word: "EMULATE", definition: "To match or surpass by imitation", example: "Young athletes often try to EMULATE the techniques of their sports heroes." },
    { word: "FURTIVE", definition: "Attempting to avoid notice or attention, typically because of guilt", example: "He cast a FURTIVE glance over his shoulder before slipping through the door." },
    { word: "GRANDILOQUENT", definition: "Pompous or extravagant in language or style", example: "The GRANDILOQUENT speech was full of elaborate metaphors but short on substance." },
    { word: "HUBRIS", definition: "Excessive pride or self-confidence", example: "His HUBRIS led him to believe he could never fail, which was his downfall." },
  ],
  // Puzzle 17
  [
    { word: "INSIPID", definition: "Lacking flavor, vigor, or interest", example: "The INSIPID soup tasted like little more than hot water." },
    { word: "JOVIAL", definition: "Cheerful and friendly", example: "The JOVIAL innkeeper greeted every traveler with a warm smile and handshake." },
    { word: "LUCID", definition: "Expressed clearly; easy to understand", example: "The professor gave a LUCID explanation of quantum mechanics that even beginners grasped." },
    { word: "MUNDANE", definition: "Lacking interest or excitement; dull", example: "She longed for adventure to escape the MUNDANE routine of her daily life." },
    { word: "NOTORIOUS", definition: "Famous or well known, typically for something bad", example: "The city was NOTORIOUS for its traffic congestion during rush hour." },
  ],
  // Puzzle 18
  [
    { word: "OSTENTATIOUS", definition: "Characterized by vulgar or pretentious display", example: "The OSTENTATIOUS mansion had a gold-plated front gate and marble lions." },
    { word: "PEDANTIC", definition: "Excessively concerned with minor details or rules", example: "The PEDANTIC grammar teacher marked every misplaced comma as an error." },
    { word: "REPUDIATE", definition: "To refuse to accept or be associated with", example: "The organization moved to REPUDIATE the controversial statements made by its former leader." },
    { word: "STOIC", definition: "Enduring pain and hardship without showing feelings or complaining", example: "The STOIC firefighter calmly directed evacuations despite the danger." },
    { word: "TREPIDATION", definition: "A feeling of fear or agitation about something that may happen", example: "She approached the stage with TREPIDATION before her first public speech." },
  ],
  // Puzzle 19
  [
    { word: "UNEQUIVOCAL", definition: "Leaving no doubt; unambiguous", example: "The CEO gave an UNEQUIVOCAL commitment to reducing carbon emissions." },
    { word: "VACILLATE", definition: "To alternate or waver between different opinions or actions", example: "He continued to VACILLATE between the two job offers for weeks." },
    { word: "ACUMEN", definition: "The ability to make good judgments and quick decisions", example: "Her business ACUMEN helped the startup grow from a garage operation to a public company." },
    { word: "BREVITY", definition: "Concise and exact use of words in writing or speech", example: "The BREVITY of his email, just three words, conveyed the urgency perfectly." },
    { word: "CANDOR", definition: "The quality of being open and honest in expression", example: "We appreciated her CANDOR when she told us the project was behind schedule." },
  ],
  // Puzzle 20
  [
    { word: "DEFERENCE", definition: "Humble submission and respect", example: "The young lawyer spoke with DEFERENCE to the seasoned judge." },
    { word: "EXACERBATE", definition: "To make a problem or situation worse", example: "Skipping meals will only EXACERBATE your headaches." },
    { word: "FALLACIOUS", definition: "Based on a mistaken belief", example: "The FALLACIOUS argument sounded convincing but was based on flawed data." },
    { word: "GALVANIZE", definition: "To shock or excite someone into taking action", example: "The documentary managed to GALVANIZE public support for environmental reform." },
    { word: "HAPLESS", definition: "Unfortunate; having no luck", example: "The HAPLESS traveler missed every connection and arrived a day late." },
  ],
  // Puzzle 21
  [
    { word: "IMMUTABLE", definition: "Unchanging over time or unable to be changed", example: "The laws of physics are considered IMMUTABLE truths of the universe." },
    { word: "JUXTAPOSITION", definition: "The fact of placing two contrasting things close together for comparison", example: "The JUXTAPOSITION of wealth and poverty in the city was striking." },
    { word: "KALEIDOSCOPE", definition: "A constantly changing pattern or sequence of elements", example: "The festival was a KALEIDOSCOPE of colors, sounds, and flavors." },
    { word: "LITIGIOUS", definition: "Tending or inclined to engage in lawsuits", example: "The LITIGIOUS company filed lawsuits against competitors at every opportunity." },
    { word: "MALLEABLE", definition: "Easily influenced; pliable", example: "Young minds are MALLEABLE and absorb information at a remarkable rate." },
  ],
  // Puzzle 22
  [
    { word: "NASCENT", definition: "Just beginning to develop", example: "The NASCENT technology showed promise but needed years of refinement." },
    { word: "ONEROUS", definition: "Involving an amount of effort and difficulty that is oppressively burdensome", example: "The ONEROUS regulations made it nearly impossible for small businesses to comply." },
    { word: "PROLIFERATE", definition: "To increase rapidly in numbers; to multiply", example: "Social media platforms continue to PROLIFERATE across the internet." },
    { word: "REPREHENSIBLE", definition: "Deserving censure or condemnation", example: "The committee found the official's behavior REPREHENSIBLE and called for resignation." },
    { word: "SOLICITOUS", definition: "Characterized by care and concern for someone", example: "The SOLICITOUS nurse checked on the patient every half hour." },
  ],
  // Puzzle 23
  [
    { word: "TEMERITY", definition: "Excessive confidence or boldness; audacity", example: "He had the TEMERITY to question the professor's research in front of the entire class." },
    { word: "UMBRAGE", definition: "Offense or annoyance", example: "She took UMBRAGE at the suggestion that her work was not original." },
    { word: "VERBOSE", definition: "Using or expressed in more words than are needed", example: "The VERBOSE report could have conveyed the same information in half the pages." },
    { word: "ACCOLADE", definition: "An award or privilege granted as a special honor", example: "Winning the national prize was the highest ACCOLADE of her career." },
    { word: "BULWARK", definition: "A defensive wall or a person or thing that acts as a defense", example: "A free press serves as a BULWARK against government corruption." },
  ],
  // Puzzle 24
  [
    { word: "CONUNDRUM", definition: "A confusing and difficult problem or question", example: "The budget deficit presented a CONUNDRUM that no one could easily solve." },
    { word: "DEBILITATE", definition: "To make someone weak and infirm", example: "The chronic illness continued to DEBILITATE him over the course of several years." },
    { word: "EGREGIOUS", definition: "Outstandingly bad; shocking", example: "The EGREGIOUS error in the report cost the company millions of dollars." },
    { word: "FORTUITOUS", definition: "Happening by accident or chance rather than design", example: "A FORTUITOUS meeting at the airport led to a lifelong business partnership." },
    { word: "GALVANIZE", definition: "To shock or excite someone into taking action", example: "The coach's halftime speech helped GALVANIZE the team into a dramatic comeback." },
  ],
  // Puzzle 25
  [
    { word: "HARANGUE", definition: "A lengthy and aggressive speech", example: "The manager launched into a HARANGUE about missed deadlines that lasted twenty minutes." },
    { word: "IDIOSYNCRATIC", definition: "Peculiar or individual in nature", example: "Her IDIOSYNCRATIC painting style blended abstract and realistic elements in unusual ways." },
    { word: "JUXTAPOSE", definition: "To place close together for contrasting effect", example: "The exhibition chose to JUXTAPOSE classical sculptures with modern digital art." },
    { word: "LACKLUSTER", definition: "Lacking in vitality, force, or conviction", example: "The team's LACKLUSTER performance disappointed fans who expected a championship run." },
    { word: "MITIGATE", definition: "To make less severe, serious, or painful", example: "Wearing sunscreen can MITIGATE the harmful effects of ultraviolet radiation." },
  ],
  // Puzzle 26
  [
    { word: "NONCHALANT", definition: "Feeling or appearing casually calm and relaxed", example: "She gave a NONCHALANT shrug when asked about the difficult exam." },
    { word: "OPAQUE", definition: "Not able to be seen through; not transparent", example: "The company's OPAQUE financial statements raised suspicion among auditors." },
    { word: "PLACATE", definition: "To make someone less angry or hostile", example: "The manager offered a discount to PLACATE the frustrated customer." },
    { word: "RECONDITE", definition: "Little known; abstruse", example: "The scholar's work on RECONDITE medieval texts attracted few readers." },
    { word: "SUPERCILIOUS", definition: "Behaving as though one thinks one is superior to others", example: "The SUPERCILIOUS waiter looked down on anyone who mispronounced the menu items." },
  ],
  // Puzzle 27
  [
    { word: "TRANSIENT", definition: "Lasting only for a short time; impermanent", example: "The TRANSIENT nature of fame means today's celebrity may be forgotten tomorrow." },
    { word: "UTILITARIAN", definition: "Designed to be useful or practical rather than attractive", example: "The office furniture was purely UTILITARIAN with no decorative elements." },
    { word: "VICARIOUS", definition: "Experienced in the imagination through the actions of another", example: "She lived VICARIOUS adventures through the travel blogs she read each morning." },
    { word: "ABSTRUSE", definition: "Difficult to understand; obscure", example: "The ABSTRUSE mathematical proof was accessible only to specialists in the field." },
    { word: "BURGEON", definition: "To begin to grow or increase rapidly; flourish", example: "The tech industry continued to BURGEON as new startups emerged daily." },
  ],
  // Puzzle 28
  [
    { word: "CATEGORICAL", definition: "Unambiguously explicit and direct", example: "The witness made a CATEGORICAL denial of any involvement in the crime." },
    { word: "DISPARAGE", definition: "To regard or represent as being of little worth", example: "Critics often DISPARAGE popular fiction without reading it." },
    { word: "EQUANIMITY", definition: "Mental calmness and composure, especially in a difficult situation", example: "She faced the crisis with remarkable EQUANIMITY that inspired her team." },
    { word: "FLAGRANT", definition: "Conspicuously or obviously offensive", example: "The referee penalized the player for a FLAGRANT foul in the final quarter." },
    { word: "GERMANE", definition: "Relevant to a subject under consideration", example: "The lawyer objected that the question was not GERMANE to the case." },
  ],
  // Puzzle 29
  [
    { word: "HEDONISTIC", definition: "Engaged in the pursuit of pleasure", example: "The HEDONISTIC lifestyle of the rock star was well documented in tabloids." },
    { word: "IMPLACABLE", definition: "Unable to be appeased or pacified", example: "The IMPLACABLE critic found fault with every performance she reviewed." },
    { word: "JUDICIOUS", definition: "Having or showing good judgment", example: "A JUDICIOUS choice of words prevented the negotiation from falling apart." },
    { word: "LOQUACIOUS", definition: "Tending to talk a great deal", example: "The LOQUACIOUS tour guide barely paused for breath during the three-hour excursion." },
    { word: "MACHIAVELLIAN", definition: "Cunning, scheming, and unscrupulous in politics", example: "The MACHIAVELLIAN strategist manipulated allies and rivals alike to seize power." },
  ],
  // Puzzle 30
  [
    { word: "NOXIOUS", definition: "Harmful, poisonous, or very unpleasant", example: "The factory released NOXIOUS fumes that irritated the eyes and throat." },
    { word: "OSTRACIZE", definition: "To exclude from a society or group", example: "The community chose to OSTRACIZE anyone who spoke against the leader." },
    { word: "PENURIOUS", definition: "Extremely poor; poverty-stricken", example: "The PENURIOUS artist could barely afford paint and canvas for his work." },
    { word: "RAMPANT", definition: "Flourishing or spreading unchecked", example: "Misinformation was RAMPANT on social media during the election season." },
    { word: "SCRUPULOUS", definition: "Diligent, thorough, and extremely attentive to details", example: "The SCRUPULOUS accountant reviewed every transaction for accuracy." },
  ],
  // Puzzle 31
  [
    { word: "TANTAMOUNT", definition: "Equivalent in seriousness to; virtually the same as", example: "Ignoring the safety warnings was TANTAMOUNT to accepting the risk of injury." },
    { word: "UNTENABLE", definition: "Not able to be maintained or defended against criticism", example: "The company's position became UNTENABLE after the leaked documents surfaced." },
    { word: "VITRIOLIC", definition: "Filled with bitter criticism or malice", example: "The VITRIOLIC review savaged every aspect of the director's new film." },
    { word: "ANOMALOUS", definition: "Deviating from what is standard or expected", example: "The ANOMALOUS test results prompted the lab to run the experiment again." },
    { word: "CLANDESTINE", definition: "Kept secret or done secretively", example: "The spies arranged a CLANDESTINE meeting at the abandoned warehouse." },
  ],
  // Puzzle 32
  [
    { word: "DUBIOUS", definition: "Hesitating or doubting; not to be relied upon", example: "The investors were DUBIOUS about the startup's unrealistic revenue projections." },
    { word: "EXONERATE", definition: "To absolve someone from blame for a fault or wrongdoing", example: "New DNA evidence helped EXONERATE the man who had been wrongfully imprisoned." },
    { word: "FRACTIOUS", definition: "Irritable and quarrelsome", example: "The FRACTIOUS committee could not agree on even the simplest procedural matters." },
    { word: "GUILELESS", definition: "Devoid of guile; innocent and without deception", example: "The GUILELESS child told the truth even when it got her into trouble." },
    { word: "HERMETIC", definition: "Complete and airtight; insulated from outside influences", example: "The artist lived in a HERMETIC world, rarely engaging with critics or the public." },
  ],
  // Puzzle 33
  [
    { word: "INCISIVE", definition: "Intelligently analytical and clear-thinking", example: "Her INCISIVE commentary cut through the noise and identified the real issue." },
    { word: "JINGOISTIC", definition: "Characterized by extreme patriotism in the form of aggressive foreign policy", example: "The JINGOISTIC rhetoric in the speech alarmed diplomats from neighboring countries." },
    { word: "KINDLE", definition: "To arouse or inspire an emotion or feeling", example: "The teacher's passion for literature helped KINDLE a love of reading in her students." },
    { word: "LUMINOUS", definition: "Full of or shedding light; bright or shining", example: "The LUMINOUS full moon illuminated the entire valley below." },
    { word: "MOROSE", definition: "Sullen and ill-tempered", example: "He became MOROSE after losing the championship match he had trained for all year." },
  ],
  // Puzzle 34
  [
    { word: "NUANCE", definition: "A subtle difference in or shade of meaning", example: "Understanding cultural NUANCE is essential for effective international diplomacy." },
    { word: "OBFUSCATE", definition: "To render obscure, unclear, or unintelligible", example: "The politician tried to OBFUSCATE the issue with irrelevant statistics." },
    { word: "PARADIGM", definition: "A typical example or pattern of something", example: "The discovery represented a new PARADIGM in how scientists understood genetics." },
    { word: "RECANT", definition: "To say that one no longer holds an opinion or belief", example: "Under pressure, the witness chose to RECANT his earlier testimony." },
    { word: "SARDONIC", definition: "Grimly mocking or cynical", example: "His SARDONIC wit made people laugh nervously, unsure if he was joking." },
  ],
  // Puzzle 35
  [
    { word: "TEMPERATE", definition: "Showing moderation or self-restraint", example: "She maintained a TEMPERATE response despite the provocative accusations." },
    { word: "USURIOUS", definition: "Relating to or involving unreasonably high rates of interest", example: "The USURIOUS loan terms trapped borrowers in a cycle of debt." },
    { word: "VENERABLE", definition: "Accorded great respect because of age, wisdom, or character", example: "The VENERABLE professor had taught at the university for over forty years." },
    { word: "ASTUTE", definition: "Having an ability to accurately assess situations and turn them to one's advantage", example: "The ASTUTE negotiator recognized the bluff and called it immediately." },
    { word: "BANAL", definition: "So lacking in originality as to be obvious and boring", example: "The BANAL dialogue made the otherwise promising film feel flat and forgettable." },
  ],
  // Puzzle 36
  [
    { word: "CAUSTIC", definition: "Sarcastic in a scathing and bitter way", example: "Her CAUSTIC remarks about the proposal silenced the entire boardroom." },
    { word: "DIFFIDENT", definition: "Modest or shy because of a lack of self-confidence", example: "The DIFFIDENT student hesitated to raise her hand even when she knew the answer." },
    { word: "ERUDITE", definition: "Having or showing great knowledge or learning", example: "The ERUDITE historian could recite dates and facts from memory with ease." },
    { word: "FELICITOUS", definition: "Well chosen or suited to the circumstances", example: "The host made a FELICITOUS toast that perfectly captured the spirit of the occasion." },
    { word: "GUILE", definition: "Sly or cunning intelligence", example: "The fox in the fable used GUILE rather than force to achieve its goals." },
  ],
  // Puzzle 37
  [
    { word: "HISTRIONIC", definition: "Overly theatrical or melodramatic in character", example: "Her HISTRIONIC reaction to a minor inconvenience embarrassed her friends." },
    { word: "IMPECUNIOUS", definition: "Having little or no money", example: "The IMPECUNIOUS writer survived on grants and the generosity of friends." },
    { word: "JAUNDICED", definition: "Affected by bitterness, resentment, or cynicism", example: "Years of disappointment left him with a JAUNDICED view of corporate promises." },
    { word: "LABYRINTHINE", definition: "Extremely complex or tortuous", example: "The LABYRINTHINE bureaucracy made obtaining a simple permit take months." },
    { word: "MAUDLIN", definition: "Self-pityingly or tearfully sentimental", example: "After a few drinks he became MAUDLIN and started reminiscing about lost friendships." },
  ],
  // Puzzle 38
  [
    { word: "NONDESCRIPT", definition: "Lacking distinctive or interesting features or characteristics", example: "The spy operated from a NONDESCRIPT office building that no one would notice." },
    { word: "OBTUSE", definition: "Annoyingly insensitive or slow to understand", example: "He was too OBTUSE to realize his constant interruptions annoyed everyone." },
    { word: "PERSPICACIOUS", definition: "Having a ready insight into and understanding of things", example: "The PERSPICACIOUS detective noticed the one detail everyone else had missed." },
    { word: "REMUNERATION", definition: "Money paid for work or a service", example: "The generous REMUNERATION package attracted top talent from across the industry." },
    { word: "SPECIOUS", definition: "Superficially plausible but actually wrong", example: "The SPECIOUS argument sounded logical at first but fell apart under scrutiny." },
  ],
  // Puzzle 39
  [
    { word: "UBIQUITOUS", definition: "Present, appearing, or found everywhere", example: "Coffee shops have become UBIQUITOUS in urban neighborhoods worldwide." },
    { word: "VITUPERATIVE", definition: "Bitter and abusive in language", example: "The VITUPERATIVE exchange on social media escalated into personal attacks." },
    { word: "ACERBIC", definition: "Sharp and forthright in expression", example: "The critic was known for her ACERBIC reviews that spared no one." },
    { word: "BILIOUS", definition: "Spiteful; bad-tempered", example: "His BILIOUS response to the feedback surprised everyone who thought he was easygoing." },
    { word: "CONTRITE", definition: "Feeling or expressing remorse", example: "The CONTRITE student apologized sincerely for the disruption he caused." },
  ],
  // Puzzle 40
  [
    { word: "DEMURE", definition: "Reserved, modest, and shy", example: "Despite her DEMURE appearance, she was a fierce negotiator in business meetings." },
    { word: "ECLECTIC", definition: "Deriving ideas or style from a broad range of sources", example: "The restaurant featured an ECLECTIC menu with dishes from six different cuisines." },
    { word: "FORLORN", definition: "Pitifully sad and abandoned or lonely", example: "The FORLORN puppy sat by the door waiting for its owner to return." },
    { word: "GLIB", definition: "Fluent and voluble but insincere and shallow", example: "The GLIB salesman had a smooth answer for every objection raised." },
    { word: "HARBINGER", definition: "A person or thing that announces the approach of another", example: "Dark clouds on the horizon were a HARBINGER of the approaching storm." },
  ],
  // Puzzle 41
  [
    { word: "IMPERIOUS", definition: "Assuming power or authority without justification", example: "The IMPERIOUS manager issued orders without consulting the rest of the team." },
    { word: "JETTISON", definition: "To throw or drop something from an aircraft or ship", example: "The company decided to JETTISON the unprofitable division to cut losses." },
    { word: "KOWTOW", definition: "To act in an excessively subservient manner", example: "She refused to KOWTOW to bullies regardless of their seniority." },
    { word: "LUGUBRIOUS", definition: "Looking or sounding sad and dismal", example: "The LUGUBRIOUS music at the memorial service brought tears to many eyes." },
    { word: "MALFEASANCE", definition: "Wrongdoing, especially by a public official", example: "The investigation uncovered MALFEASANCE at the highest levels of the administration." },
  ],
  // Puzzle 42
  [
    { word: "NIHILISTIC", definition: "Rejecting all religious and moral principles in the belief that life is meaningless", example: "The NIHILISTIC philosophy of the character reflected the author's own disillusionment." },
    { word: "ORTHODOX", definition: "Conforming to what is generally accepted as right or true", example: "Her approach was far from ORTHODOX, but it produced remarkable results." },
    { word: "PORTENTOUS", definition: "Of great importance or significance; ominously prophetic", example: "The PORTENTOUS silence before the announcement made everyone uneasy." },
    { word: "REPLETE", definition: "Filled or well-supplied with something", example: "The library was REPLETE with rare first editions and historical manuscripts." },
    { word: "SOLVENT", definition: "Having assets in excess of liabilities; able to pay one's debts", example: "The company remained SOLVENT despite the economic downturn thanks to careful planning." },
  ],
  // Puzzle 43
  [
    { word: "TURBULENT", definition: "Characterized by conflict, disorder, or confusion", example: "The TURBULENT period of political upheaval lasted nearly a decade." },
    { word: "VAPID", definition: "Offering nothing that is stimulating or challenging", example: "The VAPID reality show offered no intellectual content whatsoever." },
    { word: "ALACRITY", definition: "Brisk and cheerful readiness", example: "She accepted the challenging assignment with ALACRITY and began work immediately." },
    { word: "BYZANTINE", definition: "Excessively complicated and difficult to understand", example: "The BYZANTINE tax code confused even experienced accountants." },
    { word: "CHURLISH", definition: "Rude in a mean-spirited and surly way", example: "It would be CHURLISH to refuse such a generous invitation." },
  ],
  // Puzzle 44
  [
    { word: "DEPRECATE", definition: "To express disapproval of; to belittle", example: "She would DEPRECATE her own achievements despite being the top performer." },
    { word: "ENDEMIC", definition: "Native to or restricted to a certain place", example: "Corruption was ENDEMIC in the local government and had been for decades." },
    { word: "FLIPPANT", definition: "Not showing a serious or respectful attitude", example: "His FLIPPANT response to the safety concern alarmed the inspectors." },
    { word: "GAUCHE", definition: "Lacking ease or grace; unsophisticated", example: "His GAUCHE behavior at the formal dinner made his host uncomfortable." },
    { word: "HEGEMONY", definition: "Leadership or dominance, especially of one country over others", example: "The nation sought to establish HEGEMONY over the entire trade region." },
  ],
  // Puzzle 45
  [
    { word: "INSIDIOUS", definition: "Proceeding in a gradual, subtle way but with harmful effects", example: "The INSIDIOUS spread of the disease went unnoticed for months." },
    { word: "JUDICIOUS", definition: "Done with good judgment; sensible", example: "A JUDICIOUS allocation of funds ensured every department had what it needed." },
    { word: "KITSCH", definition: "Art or objects considered to be in poor taste because of excessive garishness", example: "The tourist shop was filled with KITSCH souvenirs like plastic flamingos and snow globes." },
    { word: "LISSOME", definition: "Thin, supple, and graceful", example: "The LISSOME dancer moved across the stage with effortless elegance." },
    { word: "MENDACIOUS", definition: "Not telling the truth; lying", example: "The MENDACIOUS testimony was quickly exposed when the real evidence surfaced." },
  ],
  // Puzzle 46
  [
    { word: "NOISOME", definition: "Having an extremely offensive smell; disagreeable", example: "The NOISOME odor from the landfill reached homes several miles away." },
    { word: "OBDURATE", definition: "Stubbornly refusing to change one's opinion or course of action", example: "The OBDURATE negotiator refused to compromise on any point." },
    { word: "PECUNIARY", definition: "Relating to or consisting of money", example: "The lawsuit sought PECUNIARY damages for the financial losses suffered." },
    { word: "RAPACIOUS", definition: "Aggressively greedy or grasping", example: "The RAPACIOUS developer bought every parcel of land in the neighborhood." },
    { word: "SOPORIFIC", definition: "Tending to induce drowsiness or sleep", example: "The SOPORIFIC lecture caused half the audience to nod off before the midpoint." },
  ],
  // Puzzle 47
  [
    { word: "TRUCULENT", definition: "Eager or quick to argue or fight; aggressively defiant", example: "The TRUCULENT protesters blocked the entrance and refused to move." },
    { word: "VERACITY", definition: "Conformity to facts; accuracy; truthfulness", example: "The journalist was known for the VERACITY of her reporting in conflict zones." },
    { word: "ALTRUISTIC", definition: "Showing a selfless concern for the well-being of others", example: "Her ALTRUISTIC decision to donate her entire bonus impressed her colleagues." },
    { word: "BELABOR", definition: "To argue or elaborate excessively", example: "There is no need to BELABOR the point since everyone already agrees." },
    { word: "CREDULOUS", definition: "Having or showing too great a readiness to believe things", example: "The CREDULOUS audience believed every claim the speaker made without question." },
  ],
  // Puzzle 48
  [
    { word: "DOGMATIC", definition: "Inclined to lay down principles as incontrovertibly true", example: "The DOGMATIC professor dismissed any viewpoint that contradicted his own." },
    { word: "ENDEMIC", definition: "Regularly found among particular people or in a certain area", example: "Poverty remained ENDEMIC in the region despite years of international aid." },
    { word: "FRUGAL", definition: "Sparing or economical with regard to money or resources", example: "Her FRUGAL habits allowed her to save enough for a down payment in just two years." },
    { word: "GRATIFY", definition: "To give someone pleasure or satisfaction", example: "It will GRATIFY the entire team to see their hard work recognized publicly." },
    { word: "HYPERBOLE", definition: "Exaggerated statements not meant to be taken literally", example: "Saying he waited an eternity was HYPERBOLE, though the line was certainly long." },
  ],
  // Puzzle 49
  [
    { word: "INCULCATE", definition: "To instill an attitude or idea by persistent instruction", example: "Good teachers INCULCATE a love of learning that lasts a lifetime." },
    { word: "JUXTAPOSE", definition: "To place close together for contrasting effect", example: "The documentary chose to JUXTAPOSE scenes of luxury with scenes of extreme poverty." },
    { word: "KUDOS", definition: "Praise and honor received for an achievement", example: "She received well-deserved KUDOS for completing the marathon in record time." },
    { word: "LATENT", definition: "Existing but not yet developed or manifest; hidden", example: "The coach believed every player had LATENT talent waiting to be unlocked." },
    { word: "MAVERICK", definition: "An unorthodox or independent-minded person", example: "The MAVERICK senator frequently broke with her party on key votes." },
  ],
  // Puzzle 50
  [
    { word: "NOMINAL", definition: "Existing in name only; very small in amount", example: "The club charged a NOMINAL fee of one dollar for annual membership." },
    { word: "OFFICIOUS", definition: "Asserting authority in a domineering way, especially regarding trivial matters", example: "The OFFICIOUS security guard demanded identification from every employee, including the CEO." },
    { word: "PROLIFIC", definition: "Producing much fruit or many offspring; highly productive", example: "The PROLIFIC author published three novels in a single year." },
    { word: "REDOLENT", definition: "Strongly reminiscent or suggestive of something", example: "The old house was REDOLENT of lavender and cedar from years of careful upkeep." },
    { word: "SPURIOUS", definition: "Not being what it purports to be; false", example: "The SPURIOUS documents were identified as forgeries by handwriting experts." },
  ],
  // Puzzle 51
  [
    { word: "TORPOR", definition: "A state of physical or mental inactivity; lethargy", example: "The afternoon heat induced a TORPOR that made any work impossible." },
    { word: "UXORIOUS", definition: "Having or showing an excessive fondness for one's spouse", example: "The UXORIOUS husband deferred to his wife on every household decision." },
    { word: "VARIEGATED", definition: "Exhibiting different colors, especially as irregular patches", example: "The VARIEGATED leaves of the plant displayed stunning shades of green and gold." },
    { word: "AMBIGUOUS", definition: "Open to more than one interpretation; not having one obvious meaning", example: "The AMBIGUOUS wording of the contract led to a legal dispute." },
    { word: "BOLSTER", definition: "To support or strengthen; to prop up", example: "New evidence helped BOLSTER the defense team's argument for acquittal." },
  ],
  // Puzzle 52
  [
    { word: "CIRCUMVENT", definition: "To find a way around an obstacle", example: "Engineers found a way to CIRCUMVENT the technical limitation with a creative workaround." },
    { word: "DOGMATIC", definition: "Inclined to lay down principles as incontrovertibly true", example: "A DOGMATIC approach to management stifles innovation and creative thinking." },
    { word: "EMPIRICAL", definition: "Based on observation or experience rather than theory", example: "The study provided EMPIRICAL evidence that supported the new hypothesis." },
    { word: "FERVENT", definition: "Having or displaying a passionate intensity", example: "The FERVENT supporters filled the stadium hours before the game began." },
    { word: "GRANDEUR", definition: "Splendor and impressiveness, especially of appearance or style", example: "The GRANDEUR of the mountain range left every hiker speechless." },
  ],
  // Puzzle 53
  [
    { word: "HARROWING", definition: "Acutely distressing", example: "The survivors shared HARROWING accounts of their ordeal at sea." },
    { word: "IMPUDENT", definition: "Not showing due respect for another person; impertinent", example: "The IMPUDENT child talked back to every adult in the room." },
    { word: "JUXTAPOSE", definition: "To place close together for contrasting effect", example: "The photographer liked to JUXTAPOSE old and new architecture in the same frame." },
    { word: "KINSHIP", definition: "A sharing of characteristics or origins", example: "Despite their different backgrounds, they felt an instant KINSHIP over shared values." },
    { word: "LIAISE", definition: "To cooperate on a matter of mutual concern", example: "Her role was to LIAISE between the engineering and marketing departments." },
  ],
  // Puzzle 54
  [
    { word: "MAGNATE", definition: "A wealthy and influential person in business or industry", example: "The media MAGNATE controlled newspapers and television stations across the country." },
    { word: "NEBULOUS", definition: "In the form of a cloud or haze; vague", example: "His NEBULOUS explanation left us with more questions than answers." },
    { word: "OPALESCENT", definition: "Showing varying colors as an opal does", example: "The OPALESCENT surface of the seashell shimmered in the sunlight." },
    { word: "PRECARIOUS", definition: "Not securely held or in position; dangerously likely to fall", example: "The hiker found herself in a PRECARIOUS position on the narrow cliff edge." },
    { word: "RECUMBENT", definition: "Lying down; reclining", example: "The RECUMBENT figure in the painting seemed to float on a bed of clouds." },
  ],
  // Puzzle 55
  [
    { word: "SUCCINCT", definition: "Briefly and clearly expressed", example: "The SUCCINCT summary captured all the key points in just two paragraphs." },
    { word: "TRENCHANT", definition: "Vigorous or incisive in expression or style", example: "The editorial offered a TRENCHANT analysis of the government's economic policy." },
    { word: "UNFETTERED", definition: "Released from restraint or inhibition", example: "The artist enjoyed UNFETTERED creative freedom under the new patron." },
    { word: "VISCERAL", definition: "Relating to deep inward feelings rather than to the intellect", example: "The audience had a VISCERAL reaction to the raw emotion in the performance." },
    { word: "AMELIORATE", definition: "To make something bad better", example: "Community programs aimed to AMELIORATE the effects of poverty on local children." },
  ],
  // Puzzle 56
  [
    { word: "BRUSQUE", definition: "Abrupt or offhand in speech or manner", example: "His BRUSQUE reply made it clear he had no interest in further conversation." },
    { word: "COGITATE", definition: "To think deeply about something; to ponder", example: "She needed time to COGITATE on the offer before making a decision." },
    { word: "DRACONIAN", definition: "Excessively harsh and severe", example: "The DRACONIAN penalties for minor offenses sparked public outrage." },
    { word: "EXTRICATE", definition: "To free someone or something from a constraint or difficulty", example: "The firefighters worked to EXTRICATE the driver from the wrecked vehicle." },
    { word: "FATUOUS", definition: "Silly and pointless", example: "The board ignored his FATUOUS suggestion and moved on to more serious proposals." },
  ],
  // Puzzle 57
  [
    { word: "GAINSAY", definition: "To deny or contradict a fact or statement", example: "No one could GAINSAY the evidence presented by the research team." },
    { word: "HALCYON", definition: "Denoting a period of time that was idyllically happy and peaceful", example: "She often reminisced about the HALCYON days of her childhood summers." },
    { word: "IGNOMINIOUS", definition: "Deserving or causing public disgrace or shame", example: "The team's IGNOMINIOUS defeat in the first round shocked every analyst." },
    { word: "JUXTAPOSE", definition: "To place close together for contrasting effect", example: "The essay helped JUXTAPOSE the ideals of democracy with its real-world shortcomings." },
    { word: "LIMPID", definition: "Completely clear and transparent", example: "The LIMPID waters of the mountain lake revealed every stone on the bottom." },
  ],
  // Puzzle 58
  [
    { word: "MUNIFICENT", definition: "Larger or more generous than is usual or necessary", example: "The MUNIFICENT donation funded the construction of an entirely new wing." },
    { word: "NASCENT", definition: "Just beginning to develop", example: "The NASCENT democracy faced many challenges in its first decade." },
    { word: "OBLIVIOUS", definition: "Not aware of or not concerned about what is happening around one", example: "She was completely OBLIVIOUS to the chaos erupting around her in the market." },
    { word: "PROFLIGATE", definition: "Recklessly extravagant or wasteful in the use of resources", example: "The PROFLIGATE spending of the previous administration left the treasury empty." },
    { word: "RAVENOUS", definition: "Extremely hungry", example: "After the twelve-hour hike, the group was RAVENOUS and devoured every dish served." },
  ],
  // Puzzle 59
  [
    { word: "SALIENT", definition: "Most noticeable or important", example: "The report highlighted the most SALIENT findings for the executive summary." },
    { word: "TENUOUS", definition: "Very weak or slight", example: "The connection between the two events was TENUOUS at best." },
    { word: "UNASSAILABLE", definition: "Unable to be attacked, questioned, or defeated", example: "Her UNASSAILABLE logic left no room for counterargument." },
    { word: "VOLUBLE", definition: "Speaking or spoken incessantly and fluently", example: "The VOLUBLE salesperson kept talking long after the customer had made a decision." },
    { word: "WANTON", definition: "Deliberate and unprovoked; growing profusely", example: "The WANTON destruction of the historic building outraged the entire community." },
  ],
];

export function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function getVocabVaultPuzzleByDate(
  date: string
): Promise<VocabVaultPuzzle | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("vocab_vault_puzzles")
      .select("*")
      .eq("puzzle_date", date)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      puzzle_date: data.puzzle_date,
      words: typeof data.words === "string" ? JSON.parse(data.words) : data.words,
    };
  } catch {
    return null;
  }
}

export function getFallbackVocabVaultPuzzle(date: string): VocabVaultPuzzle {
  const epoch = new Date("2024-01-01").getTime();
  const target = new Date(date).getTime();
  const daysSinceEpoch = Math.floor((target - epoch) / (1000 * 60 * 60 * 24));
  const index = Math.abs(daysSinceEpoch) % SEED_PUZZLES.length;

  return {
    id: `fallback-${date}`,
    puzzle_date: date,
    words: SEED_PUZZLES[index],
  };
}

export async function getVocabVaultArchiveDates(): Promise<
  { puzzle_date: string }[]
> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("vocab_vault_puzzles")
      .select("puzzle_date")
      .order("puzzle_date", { ascending: false });

    if (error || !data) return [];

    return data as { puzzle_date: string }[];
  } catch {
    return [];
  }
}
