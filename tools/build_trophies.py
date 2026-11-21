#!/usr/bin/env python3
"""Build app/data/trophies.json for the Leonida Ledger.

The official name, description, grade and id of every trophy are read from the
kit's list already in app/data/trophies.json and carried over verbatim; this
script only adds the entry's own guide text, sources and roadmap metadata.
Run from anywhere:  python3 tools/build_trophies.py
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "app" / "data" / "trophies.json"

SOURCES = {
    "powerpyx": {"name": "PowerPyx", "url": "https://www.powerpyx.com/gta-6-trophy-guide-roadmap/"},
    "psnprofiles": {"name": "PSNProfiles", "url": "https://psnprofiles.com/trophies/32234-grand-theft-auto-vi"},
    "truetrophies": {"name": "TrueTrophies", "url": "https://www.truetrophies.com/game/Grand-Theft-Auto-VI/trophies"},
    "exophase": {"name": "Exophase", "url": "https://www.exophase.com/game/grand-theft-auto-vi-ps5/trophies/"},
    "fieldguide": {"name": "GTA 6 Field Guide", "url": "https://gta6fieldguide.com/guides/gta-6-trophies-and-achievements"},
}

ROADMAP = [
    {"stage": 1, "title": "Chapters 1–2 · Warm-up",
     "intro": "Play the opening mission and the first two chapters. Start the passive counters now: drive new vehicle models, spend at shops, sample each activity type once."},
    {"stage": 2, "title": "Chapters 3–4 · Story missions",
     "intro": "Advance the chapters and clear every named story mission as it appears. Hold off on the final mission until the missable window below is clear."},
    {"stage": 3, "title": "Before the finale · Missable window",
     "intro": "Partner-dependent trophies and one-time story scenes. Clear these while the story still stages them, keep a manual save, then complete the final mission."},
    {"stage": 4, "title": "Contacts & strangers",
     "intro": "Finish the five contact strands (Andy, Kenton, Billy, Randy, Tyrone), Bret's hunt and eight stranger strands. All remain available in post-game free roam."},
    {"stage": 5, "title": "Collectibles & exploration",
     "intro": "Map sweeps: card sets, WAiNK spots, meditation spots, vehicle discovery, area exploration, garage properties and Scooter Bros registrations."},
    {"stage": 6, "title": "Activities, heists & 100%",
     "intro": "The grind stage: shooting range, races, stunts, challenges, robberies and the money counters — then the 100% gold and the platinum."},
]

# Play order within each roadmap stage; build() turns this into order 1..55.
STAGE_SEQUENCE = {
    1: [2, 3, 4],
    2: [5, 6, 8, 9, 10, 11, 12, 13, 48],
    3: [33, 34, 37, 44, 45, 47, 49, 50, 7],
    4: [22, 23, 24, 26, 27, 25, 29],
    5: [28, 30, 31, 35, 42, 54, 55],
    6: [16, 21, 46, 20, 18, 19, 17, 15, 32, 36, 38, 51, 39, 41, 40, 43, 52, 53, 14, 1],
}

# kind, missable, chapter, stage, order, target, tips, missable reason, source keys, guide
T = {}

T[1] = dict(kind="story", missable=False, chapter=None, stage=6, order=55, target=None,
    tips="Earn the other 54; keep a pre-finale save and export your tracker progress.",
    sources=["powerpyx", "psnprofiles"],
    guide="The platinum is the receipt for the whole list: every other 54 trophies must be earned on this save, and nothing here is an online trophy, so the entire run is solo and offline. Work the roadmap in stage order rather than chasing trophies at random: story first, the story-window missables before the final mission, then contacts, collectibles and the activity grind. Keep a manual save before the finale and export your tracker progress as you go. PowerPyx's roadmap and the PSNProfiles list agree on the full set; use them to cross-check your remaining gaps.")

T[2] = dict(kind="story", missable=False, chapter=None, stage=1, order=1, target=None,
    tips="Unmissable prologue trophy; learn the fishing rhythm here for Cal's challenges later.",
    sources=["powerpyx", "truetrophies"],
    guide="Gone Fishing is the mission that opens the game, so this bronze lands during the prologue and cannot be missed: simply keep playing until the mission's end trigger fires. Treat it as your tutorial — the fishing mechanics it introduces return later in Cal's fishing challenges, so pay attention to the cast-and-reel rhythm here rather than mashing through. No cleanup, no collectibles and no choices affect it. If the trophy does not pop the moment the mission completes, finish the next beat of story; delayed pops are a PlayStation quirk, not a miss. See PowerPyx's roadmap for the opening sequence.")

T[3] = dict(kind="story", missable=False, chapter="Chapter 1", stage=1, order=2, target=None,
    tips="Unmissable chapter break; start vehicles, spending and activity samples now.",
    sources=["powerpyx", "psnprofiles"],
    guide="Chapter 1 closes out the game's first act, and this bronze pops on the chapter-end transition, so it is unmissable as long as you keep finishing story missions. Use this stretch to build habits the later grind depends on: drive new vehicle models whenever traffic offers them, spend cash at shops instead of hoarding, and poke into side activities as they unlock, since Master of None wants every activity type sampled. Nothing in Chapter 1 is flagged as a one-time opportunity by the guide sites, but starting the passive counters now saves hours later. PowerPyx's roadmap covers the chapter order.")

T[4] = dict(kind="story", missable=False, chapter="Chapter 2", stage=1, order=3, target=None,
    tips="The asterisks are official; unmissable chapter break.",
    sources=["powerpyx", "psnprofiles"],
    guide="The asterisks are PlayStation's own censorship — the name is published exactly like this, so do not go looking for a different trophy. It pops when Chapter 2's closing mission completes, making it unmissable story progress. Chapter 2 is still early game: keep sampling each newly unlocked activity type once, keep discovering vehicles, and start noting where collectible clusters appear on your map so the later sweep is shorter. The guide sites list no missable one-time events this early, but it costs nothing to rob a shop or two with your partner whenever the story pairs you up. See PowerPyx and PSNProfiles for the chapter list.")

T[5] = dict(kind="story", missable=False, chapter="Chapter 3", stage=2, order=4, target=None,
    tips="Unmissable act break; start stranger strands as you meet them.",
    sources=["powerpyx", "psnprofiles"],
    guide="Chapter 3's completion pops this bronze at the act break. By now the map has opened up considerably, so the risk is not missing the trophy — it is reaching the endgame with sloppy counters. Before pushing on, check which activity types you still have not sampled, and start the stranger strands you meet along the way rather than deferring all eight. The story missions named in the trophy list (Breakfast Run, The Cartel Heist, Child's Play and the rest) unlock around these chapters; do them as they appear. PowerPyx's roadmap and the PSNProfiles list track the chapter sequence.")

T[6] = dict(kind="story", missable=False, chapter="Chapter 4", stage=2, order=5, target=None,
    tips="Last numbered chapter; make a manual save and clear the missable window next.",
    sources=["powerpyx", "truetrophies"],
    guide="This bronze marks the end of Chapter 4, the last numbered chapter in the list. It is unmissable story progress, but it is also your last comfortable checkpoint before the finale: everything flagged as story-window dependent should be earned before you start the final mission. Run down the missable view in this tracker — the partner trophies, the VCIA departure, the Ocean Beach cocktail, the showroom exit — and clear whichever the story has made available. Keep a manual save here so you can replay the window if anything slipped. PowerPyx's roadmap treats the pre-finale cleanup as its own stage.")

T[7] = dict(kind="story", missable=False, chapter=None, stage=3, order=21, target=None,
    tips="Gold for finishing the finale; clear stage 3's missables before triggering it.",
    sources=["powerpyx", "truetrophies"],
    guide="The final mission's completion awards one of the two golds, and the description sets no difficulty or medal requirement — finishing it is enough. The catch is timing: several hidden trophies are tied to story situations (your partner's company, the VCIA visit, one-time scenes), so finish the missable stage before triggering the finale. Make a manual save at the last free-roam moment, clear the story-window list, then commit. If a scene trophy slips, that save is your replay route; the guide sites' roadmaps all put the finale behind a cleanup pass. See PowerPyx and TrueTrophies.")

T[8] = dict(kind="story", missable=False, chapter=None, stage=2, order=6, target=None,
    tips="Named story mission; completion only, no medal needed.",
    sources=["powerpyx", "psnprofiles"],
    guide="Breakfast Run is a named story mission, and completing it awards this bronze — no medal, no optional objective, just finish it. Named missions like this appear as the chapters introduce them, so follow the story markers and it lands on its own. While you are in the mission, watch for the situations the hidden trophies care about: if your partner is along, a quick shop robbery streak or a shared four-star escape may be easier here than engineered later. Nothing in the description suggests a fail state that locks the trophy; mission retries are standard. PowerPyx's roadmap lists the mission order.")

T[9] = dict(kind="story", missable=False, chapter=None, stage=2, order=7, target=None,
    tips="Story heist; take the setup steps, but completion is the only condition.",
    sources=["powerpyx", "psnprofiles"],
    guide="The Cartel Heist is a story heist mission; complete it and the bronze pops regardless of how messy the run gets. Heist missions in this series reward preparation, so take the setup steps the mission offers rather than rushing the trigger — a cleaner approach means fewer retries, not a different trophy. The description asks only for completion, so do not grind for a perfect run on its account. If the heist offers a choice of approach, either satisfies the trophy; choices feed the separate Actions Speak Louder counter instead. See PowerPyx's roadmap and the PSNProfiles list for where the heist sits in the story.")

T[10] = dict(kind="story", missable=False, chapter=None, stage=2, order=8, target=None,
    tips="Named story mission; watch for partner or one-time moments inside it.",
    sources=["powerpyx", "truetrophies"],
    guide="Child's Play is a named story mission; finish it for the bronze. Like the other mission trophies it has no grade requirement beyond completion, so play it however the story hands it to you. Mission trophies are the spine of the first two roadmap stages: they pop in sequence as you advance, and none of them asks for collectibles or side content. If you are hunting the hidden scene trophies at the same time, keep an eye on whether this mission's setup includes your partner or a one-time location — those are the moments the missable list cares about. PowerPyx and TrueTrophies list the mission among the story beats.")

T[11] = dict(kind="story", missable=False, chapter=None, stage=2, order=9, target=None,
    tips="Named story mission; do it when offered, not post-game.",
    sources=["powerpyx", "psnprofiles"],
    guide="Headliners is a story mission; completing it awards this bronze. Treat it as straight story progress — no optional objective is named in the description, so there is nothing extra to grind. As with every named mission, do it when the story offers it rather than saving it for post-game: mission contexts are where the hidden, situation-dependent trophies tend to live, and replaying a context later is not always possible. If the mission puts you in a vehicle showroom, an airport or a partner sequence, check the missable view before leaving the area. The PowerPyx roadmap and PSNProfiles list both track it as a story beat.")

T[12] = dict(kind="story", missable=False, chapter=None, stage=2, order=10, target=None,
    tips="Save before this mission: the VCIA visit is also the window for Catch Me If You Can.",
    sources=["powerpyx", "psnprofiles"],
    guide="VCIA Takedown is the story mission that takes you to VCIA — the airport the hidden departure trophy also names — and completing it awards this bronze. The important part for completionists: the same visit is the setting for Catch Me If You Can, the hidden trophy about an unscheduled departure. Before you finish the mission's scripted exit, try leaving the airport your own way; the guide sites treat that window as the natural moment for it. Make a manual save before the mission so you can attempt both in one visit. See PowerPyx's roadmap and the PSNProfiles list.")

T[13] = dict(kind="story", missable=False, chapter=None, stage=2, order=11, target=None,
    tips="Late-story set-piece; save first and watch for hidden scene trophies.",
    sources=["powerpyx", "truetrophies"],
    guide="Operation Savage Glory is a named story mission, and completing it awards the bronze. Play it for completion first; the description names no medal or difficulty condition. Set-piece missions are exactly where one-time scene trophies hide, so before starting, make a manual save and check the missable view for anything tied to partner sequences or unusual events. If the trophy list's hidden entries (Personal Best, The Truth Is Out There) have not popped by the late story, this stretch is where the guide sites suggest watching for them. PowerPyx and TrueTrophies cover the mission's place in the roadmap.")

T[14] = dict(kind="collectible", missable=False, chapter=None, stage=6, order=54, target=100,
    tips="Use the pause-menu completion screen as the source of truth; nothing locks out.",
    sources=["powerpyx", "fieldguide"],
    guide="One of the two golds, and the long one: 100% completion is the game's own checklist, not just the trophy list. It counts the story, the stranger strands, collectible sets, activities and challenges in the proportions the pause-menu completion screen shows — so use that screen as your source of truth and let this tracker mirror it. Finish the story first, then clear collectibles in map sweeps, then the activity and money grind. Nothing here is missable in the sense of being locked out: post-game free roam exists for exactly this cleanup. PowerPyx's roadmap and the GTA 6 Field Guide both publish completion checklists.")

T[15] = dict(kind="activity", missable=False, chapter=None, stage=6, order=37, target=250,
    tips="Cumulative counter; drive aggressively everywhere instead of grinding dedicatedly.",
    sources=["truetrophies", "exophase"],
    guide="Stunts are the series' jumps and wild-driving feats, and this silver wants 250 of them — a marathon, not a sprint. The counter is cumulative across the whole save, so the efficient route is to stop chasing it dedicatedly and instead drive aggressively everywhere: take jumps at speed during story missions, exploration and races, and let the total build in the background. Check your stunt count in the stats screen periodically; if you reach post-game still short, run a loop of known jumps in one district. TrueTrophies and Exophase list the 250 target and track progress.")

T[16] = dict(kind="activity", missable=False, chapter=None, stage=6, order=36, target=9,
    tips="One round of every activity type; do it as each unlocks, even badly.",
    sources=["fieldguide", "psnprofiles"],
    guide="This bronze asks for a first taste of every activity type the game offers — the kit's list counts nine — not mastery of any. Do it early: as each activity unlocks through the story, play one round immediately, even badly, and the trophy pops once the last type has been sampled. It is cheap insurance against a post-game scavenger hunt for one forgotten activity type. Keep a note of which types you have touched; the activities filter in this tracker groups them for you. The GTA 6 Field Guide and PSNProfiles list the activity types and the try-each-once condition.")

T[17] = dict(kind="activity", missable=False, chapter=None, stage=6, order=36, target=42,
    tips="Gold every one of the 42 range challenges; all retryable, nothing missable.",
    sources=["powerpyx", "exophase"],
    guide="The silver asks for gold medals in every Shooting Range challenge — 42 of them per the official count — so this is an accuracy grind with a retry button. Gold medals are score thresholds, not story conditions: each challenge can be replayed as often as you like, so nothing is missable. Work the range in sessions rather than one sitting; learn each challenge's target pattern, prioritize steady aim over speed until the pattern is memorized, then push for time bonuses. If a particular challenge walls you, skip it and return — the medal persists per challenge. PowerPyx's roadmap and Exophase's list carry the 42-challenge count.")

T[18] = dict(kind="activity", missable=False, chapter=None, stage=6, order=40, target=14,
    tips="Win at all 14 drone-race locations; repeats at one spot don't count.",
    sources=["fieldguide", "truetrophies"],
    guide="Top Fun is the drone-racing side activity, and this bronze wants a win at every one of its 14 locations, not just one victory overall. Treat it as a collectible-style sweep: mark each location on your map as you win it, because repeats at the same spot do not advance the trophy. Races are retryable, so nothing is missable; the only cost of losing is time. Learn each course's gate line in a practice run before committing to a winning pace. The GTA 6 Field Guide and TrueTrophies list the locations and the win-at-each condition.")

T[19] = dict(kind="activity", missable=False, chapter=None, stage=6, order=41, target=20,
    tips="20 different race events, one win each; keep a won-events checklist.",
    sources=["psnprofiles", "truetrophies"],
    guide="Twenty race wins, but twenty different races — repeating your favorite circuit nineteen times does nothing for this bronze. Enter every race event the map offers as you explore, and win each once; a mix of street, off-road and water events counts if the game classes them as races. Losses are retryable, so nothing is missable, and difficulty can usually be managed by picking slower events first. Keep a checklist of which events you have already won so you do not double up. PSNProfiles and TrueTrophies list the 20-different-races condition.")

T[20] = dict(kind="activity", missable=False, chapter=None, stage=6, order=39, target=None,
    tips="Beat Cal head-to-head; the prologue's fishing lesson is your prep.",
    sources=["fieldguide", "powerpyx"],
    guide="Cal is the fishing contact, and this bronze pops when you beat him in a fishing challenge — the activity the opening mission, Gone Fishing, teaches you. Find Cal through the story or his map marker, accept his challenge, and fish cleanly: the challenge is a head-to-head, so consistency beats risky casts. If you lose, the challenge can be retried; nothing about it is missable, though it is easiest while the fishing mechanics are fresh from the prologue. The GTA 6 Field Guide and PowerPyx's roadmap cover Cal and the fishing challenges.")

T[21] = dict(kind="activity", missable=False, chapter=None, stage=6, order=37, target=None,
    tips="Finish any one arcade cabinet; pair with Master of None's activity pass.",
    sources=["truetrophies", "fieldguide"],
    guide="One arcade game, completed — the bronze is a first-taste trophy, not a high-score chase. Arcades appear as the map opens up; walk into one, pick any cabinet, and play its game to completion rather than abandoning mid-round. If a cabinet is too hard, pick another: the description asks for any arcade game finished, so choose the simplest one available. It pairs naturally with Master of None's sample-every-activity pass, so do both in the same visit. TrueTrophies and the GTA 6 Field Guide list the arcade activity and this completion condition.")

T[22] = dict(kind="activity", missable=False, chapter=None, stage=4, order=22, target=None,
    tips="Finish every Andy mission in order; the last one pops the trophy.",
    sources=["powerpyx", "psnprofiles"],
    guide="Andy is one of the story's contact characters, and this bronze awards his strand's final mission — so the route is to accept and finish every mission Andy offers, in order, until the last one completes. Contact strands unlock progressively through the story; if Andy goes quiet, advance the main plot and check back. The description names no optional condition, so completion is all that matters. Doing strands as they appear, rather than batching them post-game, also feeds Strangers & Freaks and the 100% checklist. PowerPyx's roadmap and PSNProfiles track the contact strands.")

T[23] = dict(kind="activity", missable=False, chapter=None, stage=4, order=23, target=None,
    tips="Complete Kenton's chain to its final mission; completion only.",
    sources=["powerpyx", "psnprofiles"],
    guide="Kenton's strand ends with a final mission, and completing it awards this bronze. Work through every mission Kenton offers as the story unlocks them; the last one is the trophy trigger. The name hints at a boat-related payoff, but the description asks only for completion — no medal, no stealth requirement. If his missions stop appearing, push the main story forward and revisit his marker. Keep strands like this on your running checklist: they count toward 100% completion and several of them intersect the stranger-strand silver. PowerPyx and the PSNProfiles list cover the contact mission order.")

T[24] = dict(kind="activity", missable=False, chapter=None, stage=4, order=24, target=None,
    tips="Billy's last mission pops it; strands stay open post-game.",
    sources=["powerpyx", "truetrophies"],
    guide="Billy's contact strand closes with a final mission; finish it for the bronze. Accept each of Billy's missions as they unlock and complete them in sequence — the trophy fires on the strand's last mission, not on any single early one. Nothing in the description adds a difficulty or style condition, so play it straight. Contact strands are post-game safe: none of the five contact trophies is flagged as missable by the guide sites, so you can batch them after the finale if you prefer, though doing them along the way spreads the grind. PowerPyx's roadmap and TrueTrophies list the strands.")

T[25] = dict(kind="activity", missable=False, chapter=None, stage=4, order=27, target=8,
    tips="Eight finished stranger strands, not eight meetings; count completions.",
    sources=["powerpyx", "fieldguide"],
    guide="Eight complete mission strands for strangers across Leonida — a strand means seeing one stranger's storyline through its final mission, not just meeting eight people. The state is big, so treat this as an exploration trophy with a mission payoff: talk to every stranger marker you pass, finish the strands you start, and count completed strands rather than started ones. The five named contacts (Andy, Kenton, Billy, Randy, Tyrone) have their own trophies; check the guide sites for whether they count toward these eight. Nothing is missable — strands wait in free roam. PowerPyx and the GTA 6 Field Guide track the stranger strands.")

T[26] = dict(kind="activity", missable=False, chapter=None, stage=4, order=25, target=None,
    tips="Randy's strand finale; early missions alone won't pop it.",
    sources=["powerpyx", "psnprofiles"],
    guide="Randy's strand ends in a final mission, and this bronze pops when it completes. Take every Randy mission as the story offers it and finish the chain; the trophy names the last one specifically, so early missions alone will not pop it. The Supply & Demand name suggests his work runs through the game's economy, but the condition is plain completion. Like the other contact strands, it remains available in post-game free roam, so it is not missable — but doing it during the story keeps your 100% checklist shorter at the end. PowerPyx's roadmap and PSNProfiles list the contact strands.")

T[27] = dict(kind="activity", missable=False, chapter=None, stage=4, order=26, target=None,
    tips="Tyrone's final mission; if he goes quiet, advance the story.",
    sources=["powerpyx", "truetrophies"],
    guide="Tyrone's final mission completes his contact strand and awards this bronze. Accept his missions in sequence as they unlock; the trophy triggers only on the strand's last mission. No style or difficulty condition is named, so completion is the whole job. If Tyrone's marker goes quiet mid-strand, advance the story — contact missions commonly gate behind chapter progress. Batch the five contact strands together in one post-game pass if you like structure; none is missable, and all of them feed the 100% completion gold. PowerPyx and TrueTrophies cover the contact mission order.")

T[28] = dict(kind="collectible", missable=False, chapter=None, stage=5, order=28, target=18,
    tips="18 fixed meditation spots; sweep them with the other map collectibles.",
    sources=["fieldguide", "exophase"],
    guide="Meditation spots are Leonida's scenic collectible: 18 fixed places where the prompt to meditate appears, and this bronze wants every one. They are a map sweep, not a skill check — travel to each spot, trigger the meditation, and mark it done. Sweep them district by district alongside the WAiNK locations and card sets so you cross the map once, not three times. Spots remain available in free roam after the story, so nothing is missable; the only risk is losing track of which you have visited, which this tracker's checklist solves. The GTA 6 Field Guide and Exophase list the 18-spot count.")

T[29] = dict(kind="activity", missable=False, chapter=None, stage=4, order=28, target=None,
    tips="Follow Bret's hunting strand to the unique-animal hunt; retryable mission.",
    sources=["powerpyx", "fieldguide"],
    guide="Bret is the hunting contact, and this bronze asks you to hunt a unique animal for him — a specific target, not generic wildlife. Start Bret's hunting missions when they unlock and follow his strand until the unique-animal hunt appears; the trophy pops on that hunt's success. Use the hunt's own tracking mechanics rather than wandering: the mission points you at the animal's habitat. If you fail the hunt, retry it — the opportunity is a mission, not a one-time world event, so it is not missable. PowerPyx's roadmap and the GTA 6 Field Guide cover Bret's hunting strand.")

T[30] = dict(kind="collectible", missable=False, chapter=None, stage=5, order=29, target=3,
    tips="Three complete card sets; finish the sets closest to done first.",
    sources=["powerpyx", "fieldguide", "psnprofiles"],
    guide="Collectible cards come in sets, and this silver wants three complete sets — not three loose cards. Cards are scattered across Leonida as fixed pickups, so the efficient route is a dedicated sweep per set once the map is fully open, using an in-game or community map to mark what you have. Check your card progress screen to see which sets are closest to done and finish those first. Collectibles persist into post-game free roam; nothing is missable, only tedious if unplanned. PowerPyx's roadmap, the GTA 6 Field Guide and PSNProfiles all track the card sets.")

T[31] = dict(kind="collectible", missable=False, chapter=None, stage=5, order=30, target=100,
    tips="100 fixed WAiNK spots; combine the sweep with cards and meditation spots.",
    sources=["fieldguide", "exophase"],
    guide="WAiNK It is a location action the game places at 100 fixed spots across Leonida, and this silver wants all hundred. Treat it exactly like a collectible sweep: the spots do not move, they survive into post-game, and the only real cost is travel. Combine the sweep with meditation spots, card sets and map exploration so each trip across a district clears several counters at once. Keep a per-district tally so you can see where the remaining spots cluster. The GTA 6 Field Guide and Exophase list the 100-location count and track the sweep.")

T[32] = dict(kind="activity", missable=False, chapter=None, stage=6, order=38, target=50,
    tips="50 challenges of any kind; fold easy ones into what you already do.",
    sources=["truetrophies", "psnprofiles"],
    guide="Challenges are the game's structured optional tasks, and this bronze wants 50 completed — a broad counter that fills as you play rather than a single grind. Check the challenges menu early to see the categories, then fold easy ones into whatever you are already doing: driving, shooting, spending, exploring. Because the counter is cumulative and challenges remain available in free roam, nothing is missable; the risk is only ignoring the menu until post-game and facing a wall of unfamiliar tasks. Sort by easiest first and let the total climb. TrueTrophies and PSNProfiles list the 50-challenge condition.")

T[33] = dict(kind="activity", missable=True, chapter=None, stage=3, order=13, target=None,
    tips="Four stars with your partner, then a full escape — do it while paired.",
    why="Needs your story partner present; partner availability is story-driven, so earn it during the paired chapters.",
    sources=["powerpyx", "psnprofiles"],
    guide="This bronze wants a four-star wanted level earned with your partner present, then a clean escape — the heat must fully drop while the two of you are together. The reason it sits in the missable stage: the story partner is not permanently at your side, and the guide sites treat partner-dependent trophies as story-window work. While the chapters pair you up, cause a four-star scene together and break line of sight until the stars fade; do not wait for post-game and hope the partner is available. PowerPyx's roadmap and PSNProfiles flag the partner condition.")

T[34] = dict(kind="activity", missable=True, chapter=None, stage=3, order=14, target=3,
    tips="Three shops, one unbroken wanted streak, partner along; plan a tight route.",
    why="Partner-dependent streak; the partner's company is not guaranteed after the story, so run it during a paired chapter.",
    sources=["powerpyx", "truetrophies"],
    guide="Rob three shops back-to-back with your partner while never letting the wanted level drop — the streak, not the robberies, is the hard part. Plan a short route between nearby shops before starting so travel time does not cool the heat, and keep your partner with you for all three. Like Hot Together, this is partner-dependent: the guide sites treat it as story-window work, because the partner's company is not guaranteed in post-game. Do it during a paired chapter, in a district with clustered shops, and keep the pressure on between hits. PowerPyx and TrueTrophies cover the streak condition.")

T[35] = dict(kind="collectible", missable=False, chapter=None, stage=5, order=31, target=100,
    tips="Drive 100 distinct models; never ignore a vehicle you haven't driven.",
    sources=["exophase", "fieldguide"],
    guide="Discovering a vehicle means getting behind the wheel of a model you have not driven before — 100 distinct models for this bronze. The counter is cumulative and passive, so the golden rule is simple: never ignore a new model. Drive story vehicles, steal traffic variants, browse showrooms, and take different rides in races. Check the vehicle log periodically to see which classes you have neglected — boats, bikes and service vehicles are the usual gaps. Nothing is missable; every model remains reachable in free roam. Exophase and the GTA 6 Field Guide list the 100-vehicle count.")

T[36] = dict(kind="activity", missable=False, chapter=None, stage=6, order=39, target=5,
    tips="Gather five enemies first, then spend one Combat Focus on all of them.",
    sources=["truetrophies", "powerpyx"],
    guide="Combat Focus is the game's focused-combat state, and this bronze wants five takedowns inside a single activation — so the setup matters more than the shooting. Do not trigger it on one enemy and hope four more wander in. Gather a group first: a gang hangout, a busy hostile scene, or a wanted-level response gives you five targets in one place. Then activate, and work through them before the meter drains. Retries are free — the state can be used again — so nothing is missable. TrueTrophies and PowerPyx's roadmap cover the five-in-one condition.")

T[37] = dict(kind="activity", missable=True, chapter=None, stage=3, order=15, target=None,
    tips="During VCIA Takedown, leave the airport your own way before the scripted exit.",
    why="Tied to the story's VCIA visit; the airport sequence is a one-time story window.",
    sources=["powerpyx", "psnprofiles"],
    guide="The hidden description — an unscheduled departure at VCIA — reads as leaving the airport in a way the story did not plan. The natural window is the VCIA Takedown mission, which brings you there; the guide sites treat the visit as the moment to try it. Before taking the mission's scripted exit, look for a way to leave on your own terms — the trophy's joke is about improvising the departure. Make a manual save before the mission so a failed attempt does not cost the window. PowerPyx and PSNProfiles cover the VCIA sequence.")

T[38] = dict(kind="activity", missable=False, chapter=None, stage=6, order=40, target=None,
    tips="Get hold of a Rhino tank; heavy heat or military sites are the series' route.",
    sources=["truetrophies", "fieldguide"],
    guide="The description is a joke — 'Kinda hot in these Rhinos' — and the Rhino is the series' tank. The trophy asks you to get acquainted with one: the community reads it as acquiring or using a Rhino tank. In this series, tanks traditionally surface at maximum wanted levels or at military locations, so the guide sites' route is to provoke the heaviest heat and take what arrives, or find one where the world parks them. It is a sandbox trophy, retryable in free roam and not missable. TrueTrophies and the GTA 6 Field Guide cover the tank condition.")

T[39] = dict(kind="activity", missable=False, chapter=None, stage=6, order=42, target=None,
    tips="Case the jewelry store, take the quiet route; detection blows the clean run.",
    sources=["powerpyx", "fieldguide"],
    guide="A jewelry store robbery with no detection — the stealth is the trophy, not the loot. Case the store first: learn the camera and guard sightlines, pick a quiet hour, and take the slow route in rather than the loud one. If anyone spots you, the clean run is blown; leave, let the heat die, and try again — the store can be robbed repeatedly, so nothing is missable. Masks, silenced tools and patience are the series' usual stealth kit; the guide sites' walkthroughs show the clean route. PowerPyx's roadmap and the GTA 6 Field Guide cover the undetected condition.")

T[40] = dict(kind="activity", missable=False, chapter=None, stage=6, order=44, target=5,
    tips="Five vaults, five clean escapes; plan the getaway before the drill starts.",
    sources=["powerpyx", "psnprofiles"],
    guide="Five bank vaults robbed, each followed by a successful escape — the escape half is what makes this silver. A vault robbery that ends in arrest or death does not count, so plan the getaway before the drill starts: park a fast vehicle close, know your route out, and shake the wanted level fully before calling it done. Vaults are repeatable world content, so nothing is missable; spread the five across districts to vary the heat response. Keep a tally of clean escapes, not attempts. PowerPyx's roadmap and PSNProfiles list the five-vault condition.")

T[41] = dict(kind="activity", missable=False, chapter=None, stage=6, order=43, target=None,
    tips="Intercept an armored truck, take the cash, escape clean; speed is everything.",
    sources=["truetrophies", "fieldguide"],
    guide="Armored trucks are the series' roaming cash targets, and this bronze wants one robbed followed by a clean escape. The blitz-play name is the hint: speed. Intercept the truck, force it to stop, take the cash, and be gone before the response converges — the escape is part of the condition, so have a getaway car staged and a route planned. Trucks spawn in traffic, so the opportunity is farmable in free roam and not missable; if the heat overwhelms you, disengage and catch another truck later. TrueTrophies and the GTA 6 Field Guide cover the robbery-and-escape condition.")

T[42] = dict(kind="collectible", missable=False, chapter=None, stage=5, order=32, target=52,
    tips="Clear the map fog in all 52 areas; water and rural corners are the usual gaps.",
    sources=["exophase", "fieldguide"],
    guide="Exploring all of Leonida means clearing the map's fog across every named area — 52 per the official count — not just visiting the cities. The sweep is the trophy: drive, fly and sail through each district until the map marks it explored, and use the area list to find the corners you have skipped. Water and rural areas are the usual gaps, so give them a dedicated pass. Everything stays open in post-game free roam, so nothing is missable; combine the sweep with WAiNK spots, meditation spots and card sets to cross each district once. Exophase and the GTA 6 Field Guide list the area count.")

T[43] = dict(kind="activity", missable=False, chapter=None, stage=6, order=45, target=9,
    tips="One operation per gang, nine gangs; coverage matters, not volume.",
    sources=["powerpyx", "fieldguide"],
    guide="Each gang in Leonida runs illegal operations, and this bronze wants one operation robbed per gang — nine gangs per the official count, so nine robberies minimum, one from each. The trap is robbing three operations of the same gang and wondering why the trophy sleeps: spread your hits across gang territories. Identify which gang runs an operation before committing, and keep a per-gang tally. Operations are repeatable world content, so nothing is missable; the work is coverage, not difficulty. PowerPyx's roadmap and the GTA 6 Field Guide track the gangs and their operations.")

T[44] = dict(kind="activity", missable=True, chapter=None, stage=3, order=16, target=None,
    tips="Let the Ocean Beach cocktail scene play fully; save before beach-side beats.",
    why="A one-time story scene on Ocean Beach; skipping or missing the beat may not offer a second chance.",
    sources=["powerpyx", "psnprofiles"],
    guide="The hidden description is a scene: a cocktail with a view on Ocean Beach. The guide sites read it as a story-triggered moment rather than a free-roam activity — the kind of quiet beat the chapters stage between the leads. That is why it sits in the missable stage: if the scene passes without the trophy, the moment may not repeat. When the story takes you to Ocean Beach, slow down and let the scene play out instead of skipping ahead. Keep a manual save before beach-side story beats. PowerPyx and PSNProfiles cover the scene's place in the story.")

T[45] = dict(kind="activity", missable=True, chapter=None, stage=3, order=17, target=None,
    tips="In the showroom story beat, take the loud theatrical exit, not the quiet one.",
    why="Tied to a one-time showroom story sequence; the theatrical exit may not be repeatable.",
    sources=["powerpyx", "truetrophies"],
    guide="Smashing your way out of a vehicle showroom 'in classic style' is a staged story beat, not a sandbox errand — the guide sites treat it as a mission moment where the exit is the spectacle. The missable risk is doing the showroom sequence quietly or skipping its interactive beat: when the story puts you in a showroom, take the loud, theatrical exit the scene is clearly offering rather than walking out. Save before showroom missions so you can replay the beat if the trophy stays silent. PowerPyx's roadmap and TrueTrophies cover the showroom sequence.")

T[46] = dict(kind="activity", missable=False, chapter=None, stage=6, order=38, target=None,
    tips="Bowl a full game at the Kolt & Associates alley; don't quit mid-game.",
    sources=["fieldguide", "truetrophies"],
    guide="Kolt & Associates runs a bowling alley, and this bronze asks for a follow-through there — play a game of bowling at their alley and finish your frames properly rather than abandoning mid-game. It is an activity trophy: find the alley on the map, pay for a game, and bowl it to the end. The follow-through wording suggests completing the game cleanly matters more than the score, so do not quit after a strike. Pair the visit with Master of None's sample-every-activity pass. The activity remains open in free roam, so it is not missable. The GTA 6 Field Guide and TrueTrophies cover the bowling activity.")

T[47] = dict(kind="story", missable=True, chapter=None, stage=3, order=18, target=None,
    tips="Let duo story scenes play fully; save before major partnership missions.",
    why="A hidden partnership scene in the story; one-time staging means it can pass without popping.",
    sources=["powerpyx", "psnprofiles"],
    guide="The hidden description — 'A partnership with mass appeal' — points at a story moment between the two leads rather than an activity you can grind. The guide sites treat it as a scene trophy that pops when the partnership beat plays out during the chapters. Its missable risk is the same as every scene trophy: one-time staging. Let story scenes between the pair play fully instead of skipping dialogue or rushing objectives, and keep a manual save before major duo missions so a missed beat can be replayed. PowerPyx's roadmap and PSNProfiles track the hidden story trophies.")

T[48] = dict(kind="story", missable=False, chapter=None, stage=2, order=12, target=None,
    tips="Cumulative choice counter; no choice is wrong and none locks it out.",
    sources=["psnprofiles", "exophase"],
    guide="Choices made, for better or worse — this bronze is a cumulative counter of the decisions the story and side content put in front of you, not a demand for any particular choice. Play naturally: take the dialogue options, mission approaches and moral forks as they come, and the counter climbs on its own. There is no wrong choice for this trophy, and no choice locks it out, so it is not missable; the only way to stall it is skipping every optional decision. It pairs with the story stages and usually lands before the finale. PSNProfiles and Exophase track the choice counter.")

T[49] = dict(kind="story", missable=True, chapter=None, stage=3, order=19, target=None,
    tips="When a story beat offers a retry after failure, take it and succeed.",
    why="A hidden second-attempt moment; if its setup is one-time, quitting after a failure may close the window.",
    sources=["truetrophies", "psnprofiles"],
    guide="'Second time's the charm' reads as succeeding at something on the retry after a first failure — the guide sites treat it as a hidden trophy tied to a specific second-attempt moment. The practical route: when a mission or activity offers a retry after failing, take it and succeed; do not abandon failed attempts. Its missable flag is caution: if the intended moment is a one-time story setup, failing it and walking away could close the window. Save before risky story beats, and retry rather than quit. TrueTrophies and PSNProfiles cover the hidden retry condition.")

T[50] = dict(kind="story", missable=True, chapter=None, stage=3, order=20, target=None,
    tips="When the world stages something strange, stop and watch it fully.",
    why="A staged strange event; one-time sightings can be missed by driving past.",
    sources=["powerpyx", "fieldguide"],
    guide="'What the hell just happened?' is the list's mystery trophy — the series' tradition of strange, unexplained events, and the guide sites read it as witnessing one of the game's oddities. These events are staged, sometimes at fixed times or places, and some play once; that is why it carries a missable flag. When the world offers something strange — an odd sighting, an unexplained scene — stop and watch it fully rather than driving past. Keep saves before odd story beats. PowerPyx's roadmap and the GTA 6 Field Guide track the strange-event trophies.")

T[51] = dict(kind="activity", missable=False, chapter=None, stage=6, order=41, target=None,
    tips="Swing a melee weapon from a moving car at a pedestrian; knockdown, not kill.",
    sources=["truetrophies", "fieldguide"],
    guide="A melee drive-by means knocking someone down with a melee weapon swung from a moving vehicle — the bowling-pin name is the joke. Equip a bat or similar, have a driver keep the car rolling at walking pace, and swing at a pedestrian as you pass; the knockdown, not a kill, is what the description asks for. It is a sandbox stunt, repeatable anywhere with traffic and pedestrians, so nothing is missable. Do it away from police if you want to avoid a wanted level complicating the attempt. TrueTrophies and the GTA 6 Field Guide cover the melee drive-by condition.")

T[52] = dict(kind="activity", missable=False, chapter=None, stage=6, order=46, target=250000,
    tips="Launder $250,000 of marked bills via contacts; watch the stats counter.",
    sources=["powerpyx", "fieldguide"],
    guide="Marked bills are dirty cash the game wants you to clean, and this bronze asks for $250,000 laundered through your contacts — a money grind, not a single mission. The route is the contacts' laundering work: take the jobs that pay in marked bills, run them through the contact network, and let the total accumulate. Check the laundering counter in the stats screen so you know how much of the $250,000 is left. It is all repeatable economy content, available in post-game, so nothing is missable — only slow if ignored. PowerPyx's roadmap and the GTA 6 Field Guide cover the laundering loop.")

T[53] = dict(kind="activity", missable=False, chapter=None, stage=6, order=47, target=100000,
    tips="Spend $100,000 across shop types; big purchases move the counter fast.",
    sources=["psnprofiles", "truetrophies"],
    guide="Spending $100,000 across all shops is a cumulative lifetime counter, and the phrase 'across all shops' suggests breadth matters — buy from different shop types rather than sinking everything into one counter. Weapons, clothes, vehicles, food, activities: spread the spend as the story pays you, and the total lands without a dedicated grind. Check your spending stats before the post-game cleanup; if you are short, the garage properties and vehicle purchases move big sums quickly. Nothing is missable — money remains earnable in free roam. PSNProfiles and TrueTrophies list the $100,000 condition.")

T[54] = dict(kind="collectible", missable=False, chapter=None, stage=5, order=33, target=8,
    tips="Buy all 8 garage properties; fold the purchases into late-game cash.",
    sources=["fieldguide", "exophase"],
    guide="Garage properties are purchasable vehicle storage, and this bronze wants every one of them owned — eight per the official count. It is a money trophy with a map component: find each garage's for-sale marker, buy it, and mark it off. Prices add up, so fold the purchases into the late-game economy when heists and laundering pay well, rather than draining early cash. Garages stay purchasable in post-game free roam, so nothing is missable; the only risk is assuming you bought one you merely visited. The GTA 6 Field Guide and Exophase list the garage properties and the eight-count.")

T[55] = dict(kind="collectible", missable=False, chapter=None, stage=5, order=34, target=10,
    tips="Register 10 vehicles in the Scooter Bros app as you discover them.",
    sources=["fieldguide", "psnprofiles"],
    guide="The Scooter Bros app registers vehicles, and this bronze wants ten registrations — a light collection task rather than a grind. Find the app's registration flow in the in-game phone or menu, and register vehicles as you acquire them; any ten distinct registrations should satisfy the counter. Fold it into the vehicle-discovery pass for Whip It Good so each new model you find does double duty. Nothing about it is missable: the app and the vehicles remain available in free roam. The GTA 6 Field Guide and PSNProfiles cover the Scooter Bros registration condition.")


def build():
    base = json.loads(DATA.read_text(encoding="utf-8"))
    official = base["trophies"]
    assert len(official) == 55, f"expected the kit's 55 trophies, found {len(official)}"
    assert set(T) == {t["id"] for t in official}, "guide table must cover every official id"
    order = {}
    for stage, ids in STAGE_SEQUENCE.items():
        for trophy_id in ids:
            assert T[trophy_id]["stage"] == stage, f"trophy {trophy_id} is not in its listed stage"
            order[trophy_id] = len(order) + 1
    assert set(order) == set(T), "stage sequence must list every trophy once"
    out = []
    for trophy in official:
        extra = T[trophy["id"]]
        item = {
            "id": trophy["id"],
            "name": trophy["name"],
            "description": trophy["description"],
            "grade": trophy["grade"],
            "kind": extra["kind"],
            "missable": extra["missable"],
            "chapter": extra["chapter"],
            "stage": extra["stage"],
            "order": order[trophy["id"]],
            "tips": extra["tips"],
            "guide": extra["guide"],
            "sources": [SOURCES[key] for key in extra["sources"]],
        }
        if extra.get("target") is not None:
            item["target"] = extra["target"]
        if extra["missable"]:
            item["missable_reason"] = extra["why"]
        out.append(item)
    doc = {
        "game": base["game"],
        "platform": base["platform"],
        "list": base["list"],
        "roadmap": ROADMAP,
        "trophies": out,
    }
    DATA.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {DATA} with {len(out)} trophies")


if __name__ == "__main__":
    build()
