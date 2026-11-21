#!/usr/bin/env python3
"""Validate app/data/trophies.json against the entry's content rules.

Checks the 55 official names and grades, guide length and source citations,
the play-order/stage metadata, and the missable flags. Exits non-zero on error.
  python3 tools/validate_trophies.py
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "app" / "data" / "trophies.json"

OFFICIAL = [
    ("Vice Got a Price!", "platinum"),
    ("Just Like Paradise", "bronze"),
    ("Paradise Lost", "bronze"),
    ("T**s Ass Drug Money", "bronze"),
    ("Vice City, Baby!", "bronze"),
    ("Top Of The World, Ma", "bronze"),
    ("You Gotta Know When to Get Off", "gold"),
    ("Trust", "bronze"),
    ("Break the Bank", "bronze"),
    ("Family Matters", "bronze"),
    ("DWNFALL", "bronze"),
    ("Hi-Jacked", "bronze"),
    ("Snow Storm", "bronze"),
    ("A Long Road", "gold"),
    ("Cunning Stunts", "silver"),
    ("Master of None", "bronze"),
    ("The Shootist", "silver"),
    ("Top Fun", "bronze"),
    ("Earn Cash, Not Kudos", "bronze"),
    ("Baited My Tackle", "bronze"),
    ("Stick Fiddler", "bronze"),
    ("Road to Rehabilitation", "bronze"),
    ("This Was No Boat Accident", "bronze"),
    ("The Lone Rider", "bronze"),
    ("Strangers & Freaks", "silver"),
    ("Supply & Demand", "bronze"),
    ("Spin On This!", "bronze"),
    ("Positive Mental Attitude", "bronze"),
    ("Fair Game", "bronze"),
    ("Don't Touch My Deck", "silver"),
    ("You WAiNKer!", "silver"),
    ("One Last Thing", "bronze"),
    ("Hot Together", "bronze"),
    ("Retail Therapy", "bronze"),
    ("Whip It Good", "bronze"),
    ("Gunslinger", "bronze"),
    ("Catch Me If You Can", "bronze"),
    ("Challenging Tank", "bronze"),
    ("Sneakthief", "bronze"),
    ("Maximum Withdrawal", "silver"),
    ("A Classic Blitz Play", "bronze"),
    ("The Goodtime State", "bronze"),
    ("Pest Control", "bronze"),
    ("In The Beginning…", "bronze"),
    ("Capital Offense", "bronze"),
    ("Let’s Go Bowling", "bronze"),
    ("Personal Best", "bronze"),
    ("Actions Speak Louder", "bronze"),
    ("Bad Luck, I Guess", "bronze"),
    ("The Truth Is Out There", "bronze"),
    ("Ten Pin", "bronze"),
    ("Dime on the Dollar", "bronze"),
    ("Treat Yo Self", "bronze"),
    ("Little Boxes", "bronze"),
    ("On the Spot", "bronze"),
]

SOURCE_URLS = {
    "https://www.powerpyx.com/gta-6-trophy-guide-roadmap/",
    "https://psnprofiles.com/trophies/32234-grand-theft-auto-vi",
    "https://www.truetrophies.com/game/Grand-Theft-Auto-VI/trophies",
    "https://www.exophase.com/game/grand-theft-auto-vi-ps5/trophies/",
    "https://gta6fieldguide.com/guides/gta-6-trophies-and-achievements",
}
KINDS = {"story", "missable", "collectible", "activity", "online"}


def fail(errors, message):
    errors.append(message)


def main():
    errors, notes = [], []
    doc = json.loads(DATA.read_text(encoding="utf-8"))
    trophies = doc.get("trophies") if isinstance(doc, dict) else doc
    if not isinstance(trophies, list):
        fail(errors, "trophies.json has no trophies array")
        trophies = []
    if len(trophies) != 55:
        fail(errors, f"expected 55 trophies, found {len(trophies)}")

    by_name = {t.get("name"): t for t in trophies}
    for name, grade in OFFICIAL:
        item = by_name.get(name)
        if item is None:
            fail(errors, f"missing official trophy: {name!r}")
            continue
        if item.get("grade") != grade:
            fail(errors, f"{name!r}: grade {item.get('grade')!r} != {grade!r}")
        if not str(item.get("description", "")).strip():
            fail(errors, f"{name!r}: blank description")
        words = len(str(item.get("guide", "")).split())
        if not 60 <= words <= 140:
            fail(errors, f"{name!r}: guide is {words} words (need 60-140)")
        sources = item.get("sources")
        if not isinstance(sources, list) or not 1 <= len(sources) <= 3:
            fail(errors, f"{name!r}: needs 1-3 sources")
            sources = []
        for source in sources:
            if not isinstance(source, dict) or not source.get("name") or not source.get("url"):
                fail(errors, f"{name!r}: source needs name and url")
            elif source["url"] not in SOURCE_URLS:
                fail(errors, f"{name!r}: uncited source url {source['url']!r}")
        if item.get("kind") not in KINDS:
            fail(errors, f"{name!r}: bad kind {item.get('kind')!r}")
        if not isinstance(item.get("missable"), bool):
            fail(errors, f"{name!r}: missable must be true/false")
        if item.get("missable") and not str(item.get("missable_reason", "")).strip():
            fail(errors, f"{name!r}: missable without a reason")
        if not (item.get("chapter") is None or isinstance(item.get("chapter"), str)):
            fail(errors, f"{name!r}: chapter must be a string or null")
        stage = item.get("stage")
        if not isinstance(stage, int) or not 1 <= stage <= 6:
            fail(errors, f"{name!r}: stage must be 1-6")
        if not isinstance(item.get("order"), int):
            fail(errors, f"{name!r}: order must be an int")
        if not str(item.get("tips", "")).strip():
            fail(errors, f"{name!r}: blank tips")

    orders = sorted(t.get("order") for t in trophies if isinstance(t.get("order"), int))
    if orders != list(range(1, 56)):
        fail(errors, "order values must be exactly 1..55 with no duplicates")
    stages = {t.get("stage") for t in trophies}
    if stages != {1, 2, 3, 4, 5, 6}:
        fail(errors, f"all six stages must be used, got {sorted(s for s in stages if isinstance(s, int))}")
    counts = {grade: sum(1 for t in trophies if t.get("grade") == grade) for grade in ("platinum", "gold", "silver", "bronze")}
    if counts != {"platinum": 1, "gold": 2, "silver": 6, "bronze": 46}:
        fail(errors, f"grade tally wrong: {counts}")

    missable = [t["name"] for t in trophies if t.get("missable")]
    kinds = {}
    for t in trophies:
        kinds[t.get("kind")] = kinds.get(t.get("kind"), 0) + 1
    cited = {}
    for t in trophies:
        for source in t.get("sources", []):
            cited[source["name"]] = cited.get(source["name"], 0) + 1

    notes.append(f"trophies: {len(trophies)}/55")
    notes.append(f"guides with 60-140 words: {sum(1 for t in trophies if 60 <= len(str(t.get('guide', '')).split()) <= 140)}/55")
    notes.append(f"trophies with 1-3 cited sources: {sum(1 for t in trophies if 1 <= len(t.get('sources') or []) <= 3)}/55")
    notes.append(f"grades: {counts}")
    notes.append(f"kinds: {kinds}")
    notes.append(f"missable ({len(missable)}): {', '.join(missable)}")
    notes.append(f"citations per site: {cited}")

    for note in notes:
        print("  " + note)
    if errors:
        print("\nFAIL")
        for error in errors:
            print("  - " + error)
        sys.exit(1)
    print("\nOK: all 55 trophies have an original guide and cited sources.")


if __name__ == "__main__":
    main()
