# Roguelike Brainstorm

> Binding of Isaac room-based combat + Hades meta-progression + browser-native

---

## Theme Directions

### 1. "GLITCH" — Digital / Corrupted Desktop
- You're a cursor/avatar trapped inside a corrupted OS. Each "floor" is a different app gone wrong (spreadsheet dungeon, email inbox swamp, corrupted photo gallery).
- Enemies are malware, pop-ups, trojans, worms. Bosses are rogue processes (TaskManager is the final boss).
- Rooms look like broken Windows/Mac UI — dialog boxes, error messages, desktop icons as obstacles.
- **Why it's unique**: The aesthetic writes itself for a web game. You can use actual CSS/HTML elements as part of the game world (real buttons, fake file explorers, glitched text). No other roguelike owns this space.
- **Tone**: Dark-funny. Creepy-cute. Think "Pony Island" meets "Undertale" meets vaporwave.
- **Meta-progression (Hades-style)**: You're slowly "debugging" the system. Each run unlocks permanent fixes to the OS — a restored app becomes your hub (like the House of Hades). NPCs are recovered programs (Notepad is your shopkeeper, Calculator gives stat upgrades, Paint lets you customize your character).

### 2. "PETIT MORT" — Cutesy Afterlife
- You're a tiny ghost who just died and is trying to earn their way into the afterlife through procedural trials.
- Floors are themed afterlife biomes: candy clouds, bone gardens, ink ocean, crystal caverns.
- Enemies are other spirits, forgotten memories, regrets manifested as creatures. Bosses are the Seven Deadly Sins reimagined as cute-creepy characters.
- **Why it's unique**: The "cute but unsettling" tone (Hollow Knight, Cult of the Lamb) is proven to resonate. Death is thematically baked in — dying in a roguelike about death creates natural humor and meta-narrative.
- **Tone**: Cutesy-dark. Pastel palette with creepy undertones.
- **Meta-progression**: Each run, you bring back "memories" that permanently upgrade your ghost and build out your personal afterlife hub (decorate your grave, befriend NPCs, unlock lore).

### 3. "CHANNEL SURF" — 90s/2000s TV Static
- You're trapped channel-surfing through cursed TV shows. Each floor is a different "channel" / genre (cooking show, nature documentary, infomercial, horror movie, kids cartoon).
- Enemies and mechanics shift per channel. Cooking show = ingredient-based attacks. Nature doc = animal enemies. Horror channel = darkness/fear mechanics.
- **Why it's unique**: Every floor feels like a completely different game. Massive variety. Perfect for web — each "channel" can have its own visual style, even its own mini-UI.
- **Tone**: Nostalgic, weird, funny. Adult Swim energy.
- **Meta-progression**: You're building a "TV Guide" — unlocking channels, upgrading your remote control (abilities), and slowly piecing together why you're trapped.

### 4. "DREAMWEAVER" — Lucid Dream / Subconscious
- You're navigating your own subconscious. Floors are dream layers that get increasingly surreal (childhood bedroom, impossible library, mirror maze, void).
- Enemies are anxieties, fears, intrusive thoughts. Bosses are repressed memories.
- Mechanics shift based on dream logic — gravity flips, rooms loop, enemies duplicate, items transform.
- **Why it's unique**: Dream logic justifies any weird mechanic. The narrative is deeply personal and resonant.
- **Tone**: Surreal. Beautiful and unsettling. Can go light or dark.
- **Meta-progression**: A therapist NPC at your hub helps you "process" what you found. Unlocks are framed as emotional breakthroughs.

---

## Core Mechanic Ideas (Isaac-style room combat)

### Combat Differentiation
Since this is browser-based (no twin-stick), the combat needs to be simple but deep:

1. **Click-to-cast spell system**: You have a hand of 3-4 spell cards. Click to aim and cast. Spells have cooldowns. Rooms are top-down arenas. Movement is WASD or click-to-move. Simple enough for browser, deep enough for builds.

2. **Auto-battler hybrid**: Your character auto-attacks. You manage positioning and ability timing. Think Vampire Survivors meets Isaac room structure. Low input, high strategy.

3. **Rhythm-based**: Attacks land on beat (Crypt of the NecroDancer style). Each room is a short combat encounter synced to music. Browser-friendly, unique feel.

4. **Chain/combo system**: You don't directly attack — you place traps, projectiles, and modifiers in the room, then trigger a chain reaction. Think "setup and execute." Each room is a puzzle-combat hybrid.

5. **Word-combat evolution** (if building on Lexicon Quest): Keep the word-spelling core but add Isaac-style room exploration between combats. Spell words to attack, but now you're also navigating a 2D map, dodging projectiles, and finding secrets.

---

## Hades-Style Meta-Progression Ideas

The key insight from Hades: **every run should advance something**, even failed ones.

### Currencies & Unlocks
- **Run currency** (like Darkness): Earned every run, spent on permanent stat upgrades
- **Rare currency** (like Titan Blood): Earned from bosses, spent on unlocking/upgrading weapons or ability trees
- **Relationship currency** (like Nectar/Ambrosia): Given to hub NPCs to unlock dialogue, lore, and gameplay bonuses
- **Cosmetic currency**: Earned from achievements, spent on hub decoration and character skins

### The Hub
- A persistent space between runs that grows and changes
- NPCs with dialogue trees that progress over dozens of runs
- Visual progression — the hub starts broken/empty and becomes lively
- Practice rooms, lore archives, achievement displays

### Story Integration
- Main plot unfolds over 20-50 runs (like Hades)
- Each boss has unique dialogue that changes as you fight them repeatedly
- True ending requires completing specific objectives across multiple runs
- Side stories with each NPC that take many runs to complete

### The "Mirror" (Permanent Upgrades)
- Stat upgrades (HP, damage, speed, crit, etc.) with multiple ranks
- Each upgrade has a "reversed" version (like Hades' mirror) for different playstyles
- Example: "+10% damage" vs "+5% damage but attacks chain to nearby enemies"

---

## What Would Work Best for Your Portal

Given that this is a **web game portal** with existing games:

### Recommendation: "GLITCH" theme + Click-to-cast combat

**Why**:
1. **Fits the platform**: A game about being inside a computer, played inside a browser — it's inherently meta and clever
2. **Visual identity is free**: Fake OS elements, CSS glitch effects, pixel corruption — all achievable with web tech and immediately distinctive
3. **Scales with your stack**: You're already in Next.js/React. The "apps within the OS" structure maps perfectly to components. Each floor could literally be a different React component with its own visual style
4. **Cross-promotion**: NPCs or easter eggs could reference your other games on the portal (a corrupted "Hexle" program, a glitched "Cluster" app)
5. **Low art overhead**: Pixel/glitch aesthetic is achievable without a large art team
6. **Memeable**: Screenshots of fake error messages, corrupted UI, and desktop-horror moments are inherently shareable

### MVP Scope
- 1 act (5 floors + boss)
- 3 starter "programs" (weapon types)
- 10 items/relics
- 5 enemy types + 1 boss
- Basic hub with 2 NPCs
- 3 permanent upgrades

---

## Wild Card Ideas

- **Daily seeded runs** with leaderboards (you already do daily games — natural fit)
- **"Corrupted" modifier system**: Each run has random global mutators (like Isaac's challenges or Hades' Pact of Punishment)
- **Community challenge runs**: Weekly curated seeds with specific modifiers
- **Cross-game unlocks**: Achievements in your other portal games unlock cosmetics or items in the roguelike
- **Spectate mode**: Watch top leaderboard runs as replays
- **Modular difficulty**: Pact of Punishment-style system where players add handicaps for better rewards
