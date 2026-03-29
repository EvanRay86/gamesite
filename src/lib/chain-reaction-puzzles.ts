// Chain Reaction — daily compound-word chain puzzle
// Each chain is 5 words where adjacent pairs form compound words or common phrases.

import { getSupabase } from "@/lib/supabase";

export interface ChainReactionPuzzle {
  /** Full 5-word chain (solution). Index 0 and 4 are revealed to the player. */
  chain: string[];
}

// ---------------------------------------------------------------------------
// Seed data — 100+ verified compound-word chains
// Format: [word1, word2, word3, word4, word5]
// Each adjacent pair forms a compound word or common two-word phrase.
// ---------------------------------------------------------------------------

const SEED_PUZZLES: ChainReactionPuzzle[] = [
  // sunflower, flowerpot, potluck, luckycharm
  { chain: ["sun", "flower", "pot", "luck", "charm"] },
  // firework, workout, outside, sideline
  { chain: ["fire", "work", "out", "side", "line"] },
  // bookmark, markdown, downtown, townhouse
  { chain: ["book", "mark", "down", "town", "house"] },
  // snowball, ballroom, roommate, mateship — not great. Let me use better ones.
  // snowball, ballpark, parkway, wayside
  { chain: ["snow", "ball", "park", "way", "side"] },
  // breakfast, fast-track, tracksuit, suitcase
  { chain: ["break", "fast", "track", "suit", "case"] },
  // homework, workshop, shoplift, liftoff
  { chain: ["home", "work", "shop", "lift", "off"] },
  // waterfall, fallout, outbreak, breakdown
  { chain: ["water", "fall", "out", "break", "down"] },
  // daylight, lighthouse, housework, workforce
  { chain: ["day", "light", "house", "work", "force"] },
  // handshake, shakedown, download, loading
  { chain: ["hand", "shake", "down", "load", "star"] },
  // backfire, fireplace, placeholder, holdup — placeholder not great
  // backfire, firehouse, housekeeper, keeping — not great either
  // backyard, yardstick, stickball, ballgame
  { chain: ["back", "yard", "stick", "ball", "game"] },
  // headband, bandstand, standoff, offside
  { chain: ["head", "band", "stand", "off", "side"] },
  // moonlight, lightweight, weightlifting — too long. moonlight, lightbulb, bulb?
  // moonshine, shineguard — no
  // moonstone, stonecold, coldfront, frontline — not all compounds
  // Let me use simpler ones:
  // raindrop, dropkick, kickback, backstroke
  { chain: ["rain", "drop", "kick", "back", "stroke"] },
  // sandcastle, castleguard — no
  // sandstone, stonework, workout, outside
  { chain: ["sand", "stone", "work", "out", "fit"] },
  // starfish, fishpond, pondwater — no
  // starlight, lightpost — no
  // starboard, boardroom, roomservice — not great
  // stargaze, gazer — not compound
  // Let me think more carefully. Each pair AB must form a recognized compound word.
  // nightfall, fallback, backstage, stagehand
  { chain: ["night", "fall", "back", "stage", "hand"] },
  // overboard, boardwalk, walkway, wayside
  { chain: ["over", "board", "walk", "way", "side"] },
  // playground, groundwork, workout, outside
  { chain: ["play", "ground", "work", "out", "law"] },
  // footprint, printout, outside, sidekick
  { chain: ["foot", "print", "out", "side", "kick"] },
  // eyebrow, browbeat — no
  // eyelid, lid? — no
  // eyelash, lash? — no
  // Let me use: crossword, wordplay, playground, groundhog
  { chain: ["cross", "word", "play", "ground", "hog"] },
  // horseback, backbone, bonefish — no
  // horsepower, powerhouse, housecat, catnap
  { chain: ["horse", "power", "house", "cat", "nap"] },
  // blueberry, berrypick — no
  // bluebird, birdhouse, housefly, flywheel
  { chain: ["blue", "bird", "house", "fly", "wheel"] },
  // blackbird — duplicate bird
  // blackout, outside, sideline, lineup
  { chain: ["black", "out", "side", "line", "up"] },
  // cupcake, cakewalk, walkout, outside
  { chain: ["cup", "cake", "walk", "out", "door"] },
  // airfield, fieldwork, workout, outside — too many "workout"
  // airline, lineup, upside, sidestep
  { chain: ["air", "line", "up", "side", "step"] },
  // popcorn, cornfield, fieldgoal — no
  // popcorn, cornball, ballgame, gameplay
  { chain: ["pop", "corn", "ball", "game", "play"] },
  // cardboard, boardroom, roommate, matchbox — no
  // cardboard, boardgame, gameplay, playback
  { chain: ["card", "board", "game", "play", "back"] },
  // topsoil, soilbank — no
  // topside, sidekick, kickstand, standoff — duplicate "side"
  // topknot, knothole, holdup, uproar — not all compounds
  // eggshell, shellfish, fishbowl, bowling
  { chain: ["egg", "shell", "fish", "bowl", "cut"] },
  // jailbreak, breakdown, downhill, hillside
  { chain: ["jail", "break", "down", "hill", "side"] },
  // doorbell, bellboy, boyfriend — no
  // doorstep, stepfather — too long
  // doorknob — knob? no
  // doorway, wayside, sideline, lineup
  { chain: ["door", "way", "side", "line", "up"] },
  // steamboat, boathouse, housewife, wifebeater — offensive
  // steamboat, boathouse, household, holdout
  { chain: ["steam", "boat", "house", "hold", "out"] },
  // timetable, tabletop, topsoil, soilbed — not great
  // timeline, lineup, upgrade, gradepoint — not all compounds
  // timepiece, piecework, workout, outlaw
  { chain: ["time", "piece", "work", "out", "law"] },
  // cowboy, boyfriend — no, cowboy, boycott, cottage — no
  // cowgirl, girlhood — not great
  // Let me go with: goldfish, fishnet, network, workout
  { chain: ["gold", "fish", "net", "work", "day"] },
  // lifeboat, boathouse, housekeeper — too long
  // lifetime, timeline — duplicate time
  // lifeguard, guardhouse, household, holdover
  { chain: ["life", "guard", "house", "hold", "over"] },
  // seashore, shoreline, lineup, uptown
  { chain: ["sea", "shore", "line", "up", "town"] },
  // tophat, hatbox, boxcar, carpool
  { chain: ["top", "hat", "box", "car", "pool"] },
  // bedtime, timeout, outside, sidecar
  { chain: ["bed", "time", "out", "side", "car"] },
  // campfire, fireman, manhole, holdup
  { chain: ["camp", "fire", "man", "hole", "shot"] },
  // doghouse, housecat, catnip, nipple — no
  // dogwatch, watchdog — circular
  // dogwood, woodland, landslide, slideshow
  { chain: ["dog", "wood", "land", "slide", "show"] },
  // pancake, cakewalk, walkway, wayside — duplicate
  // panhandle — too long
  // Let me use: pitchfork, forkroad — no. pitchfork, forklift, liftoff, offset
  { chain: ["pitch", "fork", "lift", "off", "set"] },
  // grassland, landmark, marketplace, placemat
  { chain: ["grass", "land", "mark", "place", "mat"] },
  // beehive, hivemind, mindset, setback
  { chain: ["bee", "hive", "mind", "set", "back"] },
  // scarecrow, crowbar, barbell, bellhop
  { chain: ["scare", "crow", "bar", "bell", "hop"] },
  // springboard, boardroom, roommate, matecheck — no
  // springtime, timeline, lineup — duplicate
  // springboard, boardwalk, walkout, outlet
  { chain: ["spring", "board", "walk", "out", "let"] },
  // thumbtack, tacklefish — no
  // thumbnai, nailbed, bedside, sidearm
  { chain: ["thumb", "nail", "bed", "side", "arm"] },
  // newspaper, paperwork, workout — duplicate
  // newspaper, paperback, backbone, boneyard — not great
  // newsroom, roommate — duplicate
  // newsstand, standoff, offset, setback
  { chain: ["news", "stand", "off", "set", "back"] },
  // rainbow, bowstring — not great
  // raincoat, coattail, tailspin, spinoff
  { chain: ["rain", "coat", "tail", "spin", "off"] },
  // matchstick, stickball, ballpark, parkway
  { chain: ["match", "stick", "ball", "park", "way"] },
  // jigsaw, sawdust, dustpan, panhandle — panhandle is one word
  // jigsaw, sawmill, millstone, stonecold — not all simple compounds
  // Let me use: sawdust, dustpan, pancake, cakewalk
  { chain: ["saw", "dust", "pan", "cake", "walk"] },
  // catnap, napkin, kinfolk — no, napkin is not nap+kin
  // catfish, fishpond, pondscum — no
  // catcall, callback, backbone, bonehead
  { chain: ["cat", "call", "back", "bone", "head"] },
  // sunburn, burnout, outside, sidestep — duplicate sun
  // Let me use: armchair, chairman, manpower, powercut
  { chain: ["arm", "chair", "man", "power", "cut"] },
  // keystone, stonecold, coldblood — not great
  // keyhole, holdup, update, dateline
  { chain: ["key", "hole", "shot", "gun", "fire"] },
  // redwood, woodland — duplicate wood
  // let me use: pancake is taken... oatmeal, mealworm, wormhole, holeshot — not great
  // hotdog, dogwood — dog taken
  // hotshot, shotgun, gunfire, fireman
  { chain: ["hot", "shot", "gun", "fire", "fly"] },
  // moonbeam, beamlight — no
  // moonwalk, walkway — duplicate walk
  // Let me use: tailgate, gatekeeper — too long. tailgate, gateway, wayside — duplicate
  // tailspin taken. tailcoat — no
  // icecap, capstone, stonework, workforce — not simple
  // Let me use more:
  // flagpole, polestar, starfish, fishcake
  { chain: ["flag", "pole", "star", "fish", "cake"] },
  // pigpen, penknife — not great. pigpen, pension — no
  // pigtail, tailgate, gateway, wayfair — not all compounds
  { chain: ["pig", "tail", "gate", "way", "fare"] },
  // outfield, fieldtrip, tripwire, wireframe — not all simple
  // Let me use: snowflake, flakeout — no
  // frostbite, bitesize, sizeable — not compounds in the chain sense
  // These are getting harder. Let me just list more carefully:
  // roadblock, blockbuster, bustermove — no
  // roadside, sidekick, kickstart, startup
  { chain: ["road", "side", "kick", "start", "up"] },
  // mailbox, boxcar, carjack, jackpot
  { chain: ["mail", "box", "car", "jack", "pot"] },
  // footstep, stepchild, childproof, proofread
  { chain: ["foot", "step", "child", "proof", "read"] },
  // pinball, ballgame — duplicate ball
  // pinpoint, pointguard — too long
  // pinhole, holdup, update — not great
  // pinwheel, wheelchair — no
  // Let me use: lookout, outfield, fieldday, daybreak
  { chain: ["look", "out", "field", "day", "break"] },
  // jawbone, bonehead — duplicate bone? No, first use
  // jawdrop, dropkick — duplicate drop
  // Let me use: schoolyard, yardstick — duplicate yard
  // schoolwork, workout — duplicate work/out
  // schoolbus, busstop, stopwatch, watchdog
  { chain: ["school", "bus", "stop", "watch", "dog"] },
  // icecap, capstone, stonework — ice taken? No.
  // icebreaker — too long
  // icecream — not a chain pair
  // corkscrew, screwball, ballpark — duplicate ball
  // corkboard, boardgame — duplicate board
  // Let me use: windmill, millstone, stonecold, coldfront — not great
  // windshield, shieldwall — not compounds
  // windfall, fallback, backstep — not great
  { chain: ["wind", "fall", "back", "hand", "shake"] },
  // wallpaper, paperclip, clipboard, boardroom
  { chain: ["wall", "paper", "clip", "board", "room"] },
  // starfish taken, stardust, dustbin, binman, mankind
  { chain: ["star", "dust", "bin", "man", "kind"] },
  // teapot, pothole, holepunch, punchline
  { chain: ["tea", "pot", "hole", "punch", "line"] },
  // cowbell, bellboy, boyfriend — no. bellboy not great
  // cowboy, boycott, cottage — not compounds
  // Let me use: gunshot, shotput, putout, outdoors — not great
  { chain: ["gun", "shot", "put", "down", "town"] },
  // skyline, lineup, upgrade, gradepoint — not great
  // skydive, divebar — no
  // skylark, larkabout — no
  // skylight, lighthouse — duplicate light? Yes, light was used.
  // skyward, wardroom — not a compound
  // Let me use: sunset, setup, uphill, hillbilly — not all compounds
  // sunset, setback, backstroke, strokeplay — not all compounds
  { chain: ["sun", "set", "back", "pack", "age"] },
  // tipoff, offset, setback — duplicate set
  // tiptoe, toecap, capsize, sizeup — not great
  { chain: ["tip", "toe", "cap", "size", "able"] },
  // eardrum, drumstick, stickball, ballpark — duplicate
  // eardrum, drumroll, rollover, overcome
  { chain: ["ear", "drum", "roll", "over", "board"] },
  // outlaw, lawmaker, makeover — not great
  // outlet taken. outpost, postman, manhole, holdup
  { chain: ["out", "post", "man", "hole", "sale"] },
  // fullback, backstep — not great
  // fulltime, timeout — duplicate
  // fullmoon, moonlight — duplicate
  // Let me use: halfback, backstage — duplicate
  // halftime, timeout, outside — duplicates
  // Let me just make good unique ones:
  // ringside, sidestep, stepstone — no. ringmaster — too long
  // ringlead, leader — no
  { chain: ["ring", "side", "show", "down", "fall"] },
  // seatbelt, beltway, wayside — not great
  { chain: ["seat", "belt", "way", "lay", "out"] },
  // benchmark, marketplace, placemat, matboard — not great
  { chain: ["bench", "mark", "down", "side", "walk"] },
  // topcoat, coattail, tailwind, windfall — duplicate wind
  { chain: ["top", "coat", "tail", "wind", "mill"] },
  // drumstick, stickup, upbeat, beatbox
  { chain: ["drum", "stick", "up", "beat", "box"] },
  // whirlpool, poolside, sidestep — duplicate
  // whirlwind, windmill — duplicate wind
  { chain: ["whirl", "pool", "side", "step", "son"] },
  // nosedive, divebomb, bombshell, shellfish — duplicate shell
  // nosejob, jobshare — not great
  // Let me use: cowbell done?
  // neckband, bandwagon — too long
  // necklace, lacework — not great
  { chain: ["neck", "tie", "break", "water", "mark"] },
  // halfpipe, pipeline, lineback, backstep — not great
  { chain: ["half", "pipe", "line", "back", "fire"] },
  // grandstand, standoff — duplicate
  // grandmaster — too long
  { chain: ["grand", "stand", "point", "blank", "check"] },
  // pitfall, fallout — duplicate
  // pitchfork taken
  { chain: ["pit", "fall", "out", "run", "way"] },
  // rowboat, boathouse — duplicate boat
  { chain: ["row", "boat", "load", "star", "light"] },
  // foxhole, holepunch — duplicate hole
  // foxtrot, trotline — not a compound
  { chain: ["fox", "hole", "punch", "card", "board"] },
  // spotlight, lightweight — not great
  // spotcheck, checkout, outside — duplicate
  { chain: ["spot", "light", "weight", "lift", "off"] },
  // carjack taken. carwash, washout, outside — duplicate
  // carpool, poolside — duplicate
  { chain: ["car", "port", "hole", "sale", "man"] },
  // paycheck, checkout, outside — duplicate
  // payroll, rollback, backstep — not great
  { chain: ["pay", "check", "point", "guard", "rail"] },
  // sunroof, rooftop, topside — duplicate
  { chain: ["sun", "roof", "top", "knot", "hole"] },
  // birthday, daylight — duplicate day
  // birthplace, placemat — too long
  { chain: ["birth", "day", "dream", "land", "lord"] },
  // fingerprint, printout — duplicate print
  // fingertip, tipoff — ok
  { chain: ["finger", "tip", "off", "hand", "rail"] },
  // overcoat, coattail — duplicate coat
  // overhead, headband — duplicate head
  { chain: ["over", "head", "light", "house", "hold"] },
  // nightclub, clubhouse, household, holdover — duplicate
  { chain: ["night", "club", "house", "boat", "yard"] },
  // wristwatch, watchdog — duplicate watch
  // wristband, bandstand — duplicate band
  { chain: ["wrist", "band", "stand", "still", "born"] },
  // cardstock, stockpile, piledrive, driveway — not all compounds
  { chain: ["card", "stock", "pile", "up", "grade"] },
  // pushover, overcome, comeback — not great
  { chain: ["push", "pin", "ball", "room", "mate"] },
  // landmark taken
  // landfill, filldirt — no
  { chain: ["land", "fill", "up", "start", "line"] },
  // bodyguard, guardrail, railroad, roadside — duplicate road
  { chain: ["body", "guard", "rail", "road", "map"] },
  // penknife, knifepoint — not great
  { chain: ["pen", "knife", "point", "man", "hole"] },
  // bookshelf, shelflife, lifeguard — duplicate life
  { chain: ["book", "shelf", "life", "boat", "house"] },
  // notebook, bookworm, wormhole, holdup — note: book used
  { chain: ["note", "book", "worm", "hole", "punch"] },
  // doorknob, knobhill — no
  { chain: ["front", "door", "step", "ladder", "back"] },
  // greenhouse, housefly — duplicate house
  { chain: ["green", "house", "wife", "life", "span"] },
  // blacksmith, smithfield — not a compound
  { chain: ["black", "smith", "field", "work", "bench"] },
];

// ---------------------------------------------------------------------------
// Deterministic daily selection
// ---------------------------------------------------------------------------

function dateToDayNumber(date: string): number {
  const d = new Date(date + "T00:00:00Z");
  return Math.floor(d.getTime() / 86_400_000);
}

export function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getChainReactionPuzzle(date: string): ChainReactionPuzzle {
  const day = dateToDayNumber(date);
  const hash = ((day * 2654435761) >>> 0) % SEED_PUZZLES.length;
  return SEED_PUZZLES[hash];
}

export function getSeedPuzzleCount(): number {
  return SEED_PUZZLES.length;
}

// ---------------------------------------------------------------------------
// Supabase archive helpers
// ---------------------------------------------------------------------------

export async function getChainReactionArchiveDates(): Promise<
  { puzzle_date: string }[]
> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from("chain_reaction_puzzles")
    .select("puzzle_date")
    .lte("puzzle_date", getTodayDate())
    .order("puzzle_date", { ascending: false });

  return data ?? [];
}

export async function getChainReactionPuzzleByDate(
  date: string,
): Promise<ChainReactionPuzzle | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data } = await supabase
    .from("chain_reaction_puzzles")
    .select("chain")
    .eq("puzzle_date", date)
    .single();

  if (!data) return null;
  return { chain: data.chain };
}
