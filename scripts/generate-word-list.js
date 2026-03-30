// generate-word-list.js — Generates src/data/word-list.ts from an-array-of-english-words
// Run: node scripts/generate-word-list.js

const words = require("an-array-of-english-words");
const fs = require("fs");
const path = require("path");

// Existing words from hexle-words.ts (uppercase → lowercase) and word-ladder-puzzles.ts
// to guarantee backward compatibility
const EXISTING_HEXLE_GUESSES = [
  "screen","player","points","energy","health","shield","online","mobile","button","search",
  "design","system","action","change","before","school","should","people","really","things",
  "around","family","little","friend","always","number","called","better","almost","enough",
  "though","second","others","during","market","simple","across","within","making","strong",
  "follow","return","ground","likely","begins","mother","father","broken","garden","stream",
  "wonder","bridge","dinner","planet","flower","winter","summer","mirror","silver","golden",
  "rabbit","driver","played","twenty","thanks","single","travel","trying","happen","moving",
  "toward","animal","indeed","figure","choice","remain","accept","minute","chance","finger",
  "bottle","future","appear","method","result","effort","member","beyond","rather","safety",
  "entire","record","belong","coffee","heaven","notice","answer","couple","leader","street",
  "native","forest","desert","island","weight","height","length","breath","growth","danger",
  "speech","silent","gentle","hidden","sacred","fierce","clever","bitter","narrow","hollow",
  "famous","honest","gather","decide","invite","enable","manage","expect","reveal","ignore",
  "demand","supply","create","desire","global","remove","permit","oppose","affect","belief",
  "strike","defend","attach","divide","obtain","insist","assume","intend","resist","derive",
  "impose","absorb","refuse","emerge","pursue","exceed","expand","occupy","submit","relate",
  "tennis","soccer","boxing","sports","jumble","puzzle","zombie","scores","medals","preach",
  "pickle","fridge","pencil","eraser","marker","crayon","sketch","canvas","thirst","hunger",
  "joyful","clumsy","grumpy","dragon","sniper","damage","turret","potion","hunter","scroll",
  "attack","cannon","armour","shadow","undead","swords","ambush","dagger","combat","bounty",
  "patrol","flight","sprint","racing","battle","sentry","gunner","blades","mortar","avatar",
  "meteor","plague","ritual","charge","breach","vortex","bandit","wraith","goblin","vandal",
  "slayer","ransom","famine","arcane","brawls","vaults","rubble","pounce","brutal","stoker",
  "rancid","pledge","orphan","magnet","thorny","glider","salute","cradle","barren","quench",
  "fidget","splice","abrupt","flimsy","chunky","gloomy","tricky","wobbly","sneaky","sloppy",
  "crispy","frosty","fluffy","witchy","stormy","cloudy","sleepy","trendy",
  // answer words
  "forest","garden","flower","breeze","stream","island","desert","winter","summer","spring",
  "planet","sunset","canyon","lagoon","meadow","jungle","valley","nature","branch","pebble",
  "falcon","rabbit","wolves","parrot","turtle","spider","kitten","donkey","coffee","dinner",
  "butter","cheese","pepper","banana","cookie","pickle","muffin","noodle","pastry","waffle",
  "ginger","celery","cherry","nectar","brunch","oyster","family","friend","mother","father",
  "couple","people","leader","artist","singer","author","knight","pirate","doctor","player",
  "dancer","genius","hermit","nephew","castle","bridge","street","temple","market","museum",
  "school","church","palace","throne","mirror","candle","ribbon","basket","quartz","silver",
  "golden","bronze","bottle","pencil","pillow","hammer","socket","puzzle","ticket","travel",
  "wonder","launch","rescue","create","escape","gather","search","return","invite","freeze",
  "thrive","tumble","hustle","giggle","snooze","wander","drench","fumble","joyful","gentle",
  "clever","fierce","honest","humble","bright","frozen","silent","broken","hidden","famous",
  "simple","sacred","bitter","lively","trophy","arcade","record","comedy","rhythm","legend",
  "spirit","canvas","design","sketch","motion","poetry","voyage","trivia","safari","riddle",
  "cipher","enigma","memoir","novice","energy","system","signal","screen","mobile","optics",
  "hybrid","atomic","matrix","neural","fusion","launch","rocket","toggle","widget","glitch",
  "reboot","zenith","zephyr","velvet","harbor","beacon","primal","nimble","rustic","gilded",
  "molten","mystic","fervor","thwart","grotto","clutch","frenzy","mingle","portal","bubble",
  "cobalt","quiver","tangle","breech","dazzle","frolic","shield","muffle","clumsy",
];

const EXISTING_WORD_LADDER = [
  "aahs","abbe","abed","abet","able","ably","abut","abys","aces","ache",
  "acid","acme","acne","acre","acts","adds","ados","adze","aeon","afar",
  "aged","ages","agog","ague","ahem","aide","aids","aims","airs","airy",
  "ajar","akin","alas","alee","alga","ally","alms","aloe","also","alto",
  "ambo","amen","amid","ammo","amok","amps","anew","ankh","anna","ante",
  "anti","ants","apes","apse","aqua","arch","arcs","area","aria","arid",
  "arks","arms","army","arts","arty","ashy","asks","asps","atom","atop",
  "aunt","auto","avid","avow","away","awed","awes","awry","axed","axes",
  "axis","axle","baas","babe","back","bade","bags","bail","bait","bake",
  "bald","bale","balk","ball","balm","band","bane","bang","bank","bans",
  "barb","bard","bare","bark","barn","bars","base","bash","bask","bass",
  "bast","bate","bath","bats","bawd","bawl","bays","bead","beak","beam",
  "bean","bear","beat","beau","beck","beds","beef","been","beer","bees",
  "beet","bell","belt","bend","bent","berg","berm","best","bets","bevy",
  "bias","bibs","bide","bids","bier","bike","bile","bill","bind","bins",
  "bird","bite","bits","blab","blah","bled","blew","blip","blob","bloc",
  "blog","blot","blow","blue","blur","boar","boat","bobs","bock","bode",
  "bods","body","bogs","boil","bold","bole","boll","bolt","bomb","bond",
  "bone","bong","bonk","book","boom","boon","boor","boot","bops","bore",
  "born","bosh","boss","both","bout","bowl","bows","boys","brae","bran",
  "brat","bray","bred","brew","brig","brim","brio","brit","brow","brut",
  "buds","buff","bugs","bulb","bulk","bull","bump","bums","bung","bunk",
  "buns","buoy","burg","burl","burn","burp","burr","bury","bush","bust",
  "busy","butt","buys","buzz","byre","byte","cabs","cads","cafe","cage",
  "cake","calf","call","calm","came","camp","cams","cane","cans","cape",
  "caps","carb","card","care","carp","cars","cart","case","cash","cask",
  "cast","cats","cave","cede","cell","chad","chap","char","chat","chef",
  "chew","chic","chin","chip","chop","chub","chug","cite","city","clad",
  "clam","clan","clap","claw","clay","clef","clip","clod","clog","clop",
  "clot","club","clue","coal","coat","coax","cobs","cock","code","cods",
  "cogs","coif","coil","coin","coke","cold","cole","cols","colt","comb",
  "come","comp","cone","conk","cook","cool","coop","cope","cops","copy",
  "cord","core","cork","corn","cost","cote","coup","cove","cowl","cozy",
  "crab","craw","crew","crib","crop","crow","crud","cube","cubs","cuds",
  "cues","cuff","cult","cups","curb","curd","cure","curl","curt","cusp",
  "cute","cuts","cyan","czar","dabs","dace","dads","daft","dale","dame",
  "damp","dams","dane","dare","dark","darn","dart","dash","data","date",
  "dawn","days","daze","dead","deaf","deal","dean","dear","debt","deck",
  "deed","deem","deep","deer","deft","deli","demo","dens","dent","deny",
  "desk","dewy","dial","dice","died","dies","diet","digs","dime","dims",
  "dine","ding","dint","dips","dire","dirt","disc","dish","disk","dock",
  "docs","dodo","doer","does","doge","dogs","dole","dolt","dome","done",
  "dong","dons","doom","door","dope","dork","dorm","dory","dose","doss",
  "dote","dots","dour","dove","down","doze","drab","drag","dram","drat",
  "draw","dray","dree","drew","drib","drip","drop","drug","drum","drys",
  "dual","dubs","duck","duct","dude","duel","dues","duet","duff","duke",
  "dull","duly","dumb","dump","dune","dung","dunk","dupe","dusk","dust",
  "duty","dyed","dyer","dyes","dyne","each","earl","earn","ears","ease",
  "east","easy","eats","eave","ebbs","ebon","echo","ecru","eddy","edge",
  "edgy","edit","eels","eggs","egos","eked","elks","elms","else","emit",
  "ends","envy","epee","epic","eras","ergo","errs","etch","euro","even",
  "ever","eves","evil","ewer","ewes","exam","exec","exit","expo","eyed",
  "eyes","fabs","face","fact","fade","fads","fail","fain","fair","fake",
  "fall","fame","fang","fans","fare","farm","fart","fast","fate","fats",
  "fave","fawn","faze","fear","feat","feds","feed","feel","fees","feet",
  "fell","felt","fend","fern","fest","feud","fiat","fibs","fief","figs",
  "file","fill","film","find","fine","fins","fire","firm","fish","fist",
  "fits","five","fizz","flab","flag","flan","flap","flat","flaw","flax",
  "flay","flea","fled","flee","flew","flex","flip","flit","flog","flop",
  "flow","flub","flue","flux","foam","fobs","foci","foes","fogs","foil",
  "fold","folk","fond","font","food","fool","foot","ford","fore","fork",
  "form","fort","foul","four","fowl","foxy","fray","free","fret","frog",
  "from","fuel","full","fume","fund","funk","funs","furl","fury","fuse",
  "fuss","fuzz","gabs","gads","gaff","gags","gain","gait","gale","gall",
  "gals","game","gams","gang","gape","gaps","garb","gash","gasp","gate",
  "gave","gawk","gaze","gear","geld","gems","gene","gent","germ","gets",
  "ghat","gibe","gift","gigs","gild","gill","gilt","gimp","gins","gird",
  "girt","gist","give","glad","glam","glee","glen","glib","glob","glop",
  "glow","glue","glum","glut","gnar","gnaw","goad","goat","gobs","gods",
  "goer","goes","gold","golf","gone","gong","good","goof","gore","gory",
  "gosh","gout","gown","grab","gram","gran","gray","grew","grid","grim",
  "grin","grip","grit","grog","grot","grow","grub","guar","guff","gulf",
  "gull","gulp","gums","gunk","guns","guru","gush","gust","guts","guys",
  "gybe","gyms","gyre","hack","hade","haft","hags","hail","hair","hake",
  "hale","half","hall","halo","halt","hame","hams","hand","hang","hank",
  "haps","hare","hark","harm","harp","hash","hasp","hate","haul","have",
  "hawk","haws","hays","haze","hazy","head","heal","heap","hear","heat",
  "heck","heed","heel","heft","heir","held","hell","helm","help","hemp",
  "hems","hens","herb","herd","here","hero","hers","hewn","hews","hick",
  "hide","hied","high","hike","hill","hilt","hind","hint","hips","hire",
  "hiss","hits","hive","hoar","hoax","hobo","hobs","hock","hods","hoed",
  "hoes","hogs","hoke","hold","hole","holy","home","hone","honk","hood",
  "hoof","hook","hoop","hoot","hope","hops","horn","hose","host","hour",
  "howl","hubs","hued","hues","huff","huge","hugs","hulk","hull","hump",
  "hums","hung","hunk","hunt","hurl","hurt","hush","huts","hymn","hype",
  "ibex","iced","ices","icky","icon","idea","idle","idly","iffy","ills",
  "imam","imps","inch","info","inks","inky","inns","into","ions","iota",
  "iris","irks","iron","isle","itch","item","jabs","jack","jade","jags",
  "jail","jamb","jams","jape","jars","java","jaws","jays","jazz","jean",
  "jeer","jell","jerk","jest","jets","jibe","jibs","jigs","jilt","jinx",
  "jive","jobs","jock","joey","jogs","join","joke","jolt","josh","joss",
  "jots","jowl","joys","judo","jugs","jump","june","junk","jury","just",
  "jute","juts","kale","keen","keep","kegs","kelp","kemp","kepi","kept",
  "kern","keys","kick","kids","kill","kiln","kilo","kilt","kind","king",
  "kink","kins","kips","kiss","kite","kits","knee","knew","knit","knob",
  "knot","know","knur","labs","lace","lack","lacs","lacy","lads","laid",
  "lain","lair","lake","lamb","lame","lamp","lams","land","lane","lank",
  "laps","lard","lark","lase","lash","lass","last","late","lath","lats",
  "laud","lava","lave","lawn","laws","lays","lazy","lead","leaf","leak",
  "lean","leap","leas","lech","leer","lees","left","leis","lend","lens",
  "lent","less","lest","lets","levy","liar","lice","lick","lids","lied",
  "lien","lies","lieu","life","lift","like","lilt","limb","lime","limo",
  "limp","limy","line","ling","link","lino","lint","lion","lips","lira",
  "lire","list","live","load","loaf","loam","loan","lobe","lobs","loch",
  "lock","lode","loft","loge","logo","logs","loin","loll","lone","long",
  "look","loom","loon","loop","loot","lops","lord","lore","lorn","lose",
  "loss","lost","loth","lots","loud","lour","lout","love","lows","lube",
  "luce","luck","ludo","luge","lull","lump","lune","lung","lure","lurk",
  "lush","lust","lute","lynx","lyre","mace","mach","macs","made","mads",
  "maid","mail","maim","main","make","male","mall","malt","mams","mane",
  "maps","mare","mark","mars","mash","mask","mass","mast","mate","math",
  "mats","maul","maws","maze","mead","meal","mean","meat","meek","meet",
  "meld","melt","memo","mend","menu","mere","mesh","mess","mete","mica",
  "mice","mien","miff","mike","mild","mile","milk","mill","mils","milt",
  "mime","mind","mine","mini","mink","mint","minx","mire","mirk","miss",
  "mist","mite","mitt","moan","moat","mobs","mock","mode","mods","moil",
  "mojo","mold","mole","molt","moms","monk","mood","moon","moor","moot",
  "mope","mops","more","morn","moss","most","moth","moue","move","much",
  "muck","muds","muff","mugs","mule","mull","mumm","mums","mung","murk",
  "muse","mush","musk","must","mute","mutt","myth","naan","nabs","nags",
  "naif","nail","name","nape","naps","narc","nave","navy","near","neat",
  "neck","need","neem","neon","nerd","nest","nets","news","newt","next",
  "nibs","nice","nick","nine","nips","nits","nobs","nock","node","nods",
  "noel","none","nook","noon","norm","nose","note","noun","nova","nubs",
  "nude","null","numb","nuns","nuts","oafs","oaks","oars","oath","oats",
  "obey","oboe","odds","odor","offs","ogle","ogre","oils","oily","oink",
  "okay","okra","olds","oleo","omen","omit","once","ones","only","onto",
  "oops","ooze","opal","open","opts","opus","oral","orbs","orca","ores",
  "ouch","ours","oust","outs","oval","oven","over","owed","owes","owls",
  "owns","oxen","oxes","pace","pack","pact","pads","page","paid","pail",
  "pain","pair","pale","pall","palm","pals","pane","pang","pans","pard",
  "pare","park","pars","part","pass","past","path","pats","pave","pawl",
  "pawn","paws","pays","peak","peal","pear","peas","peat","peck","pecs",
  "peel","peer","pegs","pelt","pend","pens","peon","peps","perk","perm",
  "pert","peso","pest","pets","pews","phat","phew","pick","pied","pier",
  "pigs","pike","pile","pill","pimp","pine","pink","pins","pint","pion",
  "pipe","pips","pith","pits","pity","plan","plat","play","plea","plod",
  "plop","plot","plow","ploy","plug","plum","plus","pods","poem","poet",
  "poke","pole","poll","polo","pomp","pond","pone","pony","pool","poop",
  "poor","pope","pops","pore","pork","port","pose","posh","post","posy",
  "pots","pour","pout","pray","prep","prey","prig","prim","proa","prod",
  "prom","prop","pros","prow","pubs","puce","puck","puds","puff","pugs",
  "pull","pulp","puma","pump","punk","puns","punt","pups","pure","purr",
  "push","puts","putt","quad","quag","quay","quid","quip","quit","quiz",
  "race","rack","racy","rads","raft","rage","rags","raid","rail","rain",
  "rake","ramp","rams","rang","rank","rant","raps","rare","rash","rasp",
  "rate","rats","rave","rays","raze","read","real","ream","reap","rear",
  "rebs","redo","reds","reed","reef","reek","reel","refs","rein","rely",
  "rend","rent","rest","ribs","rice","rich","rick","ride","rids","rife",
  "rift","rigs","rile","rill","rime","rims","rind","ring","rink","riot",
  "ripe","rips","rise","risk","rite","road","roam","roan","roar","robe",
  "robs","rock","rode","rods","roes","roil","role","roll","romp","roof",
  "rook","room","root","rope","rose","rosy","rote","rots","roue","rout",
  "rove","rows","rubs","ruby","ruck","rude","rued","rues","ruff","rugs",
  "ruin","rule","rump","rune","rung","runs","runt","ruse","rush","rust",
  "ruts","ryes","sack","sacs","safe","saga","sage","sago","sags","said",
  "sail","sake","sale","salt","same","sand","sane","sang","sank","saps",
  "sari","sash","sass","save","saws","says","scab","scad","scam","scan",
  "scar","seal","seam","sear","seas","seat","sect","seed","seek","seem",
  "seen","seep","seer","self","sell","semi","send","sent","sept","sera",
  "serf","sets","sewn","shag","sham","shed","shim","shin","ship","shiv",
  "shod","shoe","shoo","shop","shot","show","shul","shun","shut","sick",
  "side","sift","sigh","sign","silk","sill","silo","silt","sine","sing",
  "sink","sips","sire","site","sits","size","skag","skid","skim","skin",
  "skip","skit","slab","slag","slam","slap","slat","slaw","slay","sled",
  "slew","slid","slim","slit","slob","sloe","slog","slop","slot","slow",
  "slub","slue","slug","slum","slur","smog","snag","snap","snip","snit",
  "snob","snot","snow","snub","snug","soak","soap","soar","sobs","sock",
  "soda","sods","sofa","soft","soil","sold","sole","soma","some","song",
  "sons","soon","soot","sops","sore","sort","soul","soup","sour","span",
  "spar","spas","spat","spec","sped","spew","spin","spit","spot","spry",
  "spud","spun","spur","stab","stag","star","stay","stem","step","stew",
  "stir","stop","stow","stub","stud","stun","subs","such","suck","suds",
  "suit","sulk","sums","sung","sunk","suns","sups","sure","surf","swan",
  "swap","sway","swim","swum","sync","tabs","tack","taco","tact","tads",
  "tags","tail","take","tale","talk","tall","tame","tamp","tang","tank",
  "tans","tape","taps","tarn","taro","tarp","tars","tart","task","taxa",
  "taxi","teak","teal","team","tear","teas","teen","tell","temp","tend",
  "tens","tent","term","tern","test","text","than","that","thaw","them",
  "then","they","thin","this","thud","thug","thus","tick","tide","tidy",
  "tied","tier","ties","tile","till","tilt","time","tine","ting","tins",
  "tiny","tips","tire","toad","toed","toes","tofu","toga","togs","toil",
  "told","tole","toll","tomb","tome","tone","tong","tons","took","tool",
  "tops","tore","torn","tort","tosh","toss","tote","tour","tout","town",
  "toys","tram","trap","tray","tree","trek","trim","trio","trip","trod",
  "trot","true","tsar","tube","tubs","tuck","tuft","tugs","tuna","tune",
  "turd","turf","turn","tusk","twin","twit","type","typo","ugly","undo",
  "unit","unto","upon","urge","urns","used","user","uses","vain","vale",
  "vamp","vane","vans","vary","vase","vast","vats","veal","veer","veil",
  "vein","vend","vent","verb","very","vest","veto","vets","vial","vibe",
  "vice","vied","vies","view","vile","vine","visa","vise","void","volt",
  "vote","vows","wade","wadi","wads","waft","wage","wags","wail","wait",
  "wake","wale","walk","wall","wand","wane","want","ward","ware","warm",
  "warn","warp","wars","wart","wary","wash","wasp","watt","wave","wavy",
  "waxy","ways","weak","weal","wean","wear","webs","weds","weed","week",
  "weft","weld","well","welt","wend","went","were","west","wets","what",
  "when","whet","whey","whim","whip","whir","whit","whom","wick","wide",
  "wife","wigs","wild","wile","will","wilt","wily","wimp","wind","wine",
  "wing","wink","wins","wipe","wire","wise","wish","wisp","with","wits",
  "woes","woke","woks","wolf","womb","wont","wood","woof","wool","word",
  "wore","work","worm","worn","wort","wove","wrap","wren","writ","wuss",
  "yack","yaks","yams","yank","yaps","yard","yarn","yawn","yawp","year",
  "yell","yelp","yens","yews","yoga","yogi","yoke","yolk","yore","your",
  "yowl","yurt","zany","zaps","zeal","zeds","zees","zero","zest","zinc",
  "zing","zips","zone","zonk","zoom","zoos",
];

// Filter: only a-z, exact length
function isAlpha(w) {
  return /^[a-z]+$/.test(w);
}

const byLength = { 3: new Set(), 4: new Set(), 5: new Set(), 6: new Set() };

// Add from npm package
for (const w of words) {
  const lower = w.toLowerCase();
  if (lower.length >= 3 && lower.length <= 6 && isAlpha(lower)) {
    byLength[lower.length].add(lower);
  }
}

// Merge existing game words
for (const w of EXISTING_HEXLE_GUESSES) {
  const lower = w.toLowerCase();
  if (lower.length >= 3 && lower.length <= 6 && isAlpha(lower)) {
    byLength[lower.length].add(lower);
  }
}
for (const w of EXISTING_WORD_LADDER) {
  const lower = w.toLowerCase();
  if (lower.length >= 3 && lower.length <= 6 && isAlpha(lower)) {
    byLength[lower.length].add(lower);
  }
}

// Sort each group
const sorted = {};
for (const len of [3, 4, 5, 6]) {
  sorted[len] = [...byLength[len]].sort();
}

// Format as TypeScript
function formatArray(name, arr) {
  const lines = [];
  lines.push(`export const ${name}: string[] = [`);
  // 10 words per line
  for (let i = 0; i < arr.length; i += 10) {
    const chunk = arr.slice(i, i + 10).map(w => `"${w}"`).join(",");
    lines.push(`  ${chunk},`);
  }
  lines.push("];");
  return lines.join("\n");
}

const output = [
  "// AUTO-GENERATED — do not edit manually.",
  "// Regenerate with: node scripts/generate-word-list.js",
  `// Generated: ${new Date().toISOString().slice(0, 10)}`,
  `// Source: an-array-of-english-words + existing game words`,
  `// 3-letter: ${sorted[3].length} | 4-letter: ${sorted[4].length} | 5-letter: ${sorted[5].length} | 6-letter: ${sorted[6].length}`,
  "",
  formatArray("WORDS_3", sorted[3]),
  "",
  formatArray("WORDS_4", sorted[4]),
  "",
  formatArray("WORDS_5", sorted[5]),
  "",
  formatArray("WORDS_6", sorted[6]),
  "",
].join("\n");

const outPath = path.join(__dirname, "..", "src", "data", "word-list.ts");
fs.writeFileSync(outPath, output, "utf-8");

console.log("Word list generated at:", outPath);
console.log(`  3-letter: ${sorted[3].length}`);
console.log(`  4-letter: ${sorted[4].length}`);
console.log(`  5-letter: ${sorted[5].length}`);
console.log(`  6-letter: ${sorted[6].length}`);
console.log(`  Total: ${sorted[3].length + sorted[4].length + sorted[5].length + sorted[6].length}`);
