"""
Fills the app's database with designed demo data for the App Store screenshots.

Usage: python3 seed.py <path to habits.db> <en|fr> <today YYYY-MM-DD> [--check]
The app must have run once (so its migrations created the tables) and be closed.
With --check, prints the stats each habit will show instead of writing anything.

The data is designed, not random: each habit has a monthly rate that rises over the year,
a weekday pattern, and an exact current streak, so every chart tells a clear story.
"""
import random
import sqlite3
import sys
from datetime import date, timedelta

db_path, lang, today_str = sys.argv[1], sys.argv[2], sys.argv[3]
check = '--check' in sys.argv
today = date.fromisoformat(today_str)
start = date(today.year - 1, today.month, 1) - timedelta(days=62)  # ~14 months of history

# Weekday weights, Monday first: higher = more likely kept that day.
WEEKEND_HARD = [0.9, 0.85, 0.8, 0.7, 0.4, 0.35, 0.65]
WEEKDAYS_HARD = [0.5, 0.5, 0.55, 0.55, 0.65, 0.8, 0.75]
EVEN = [0.6] * 7

HABITS = [
    # names, color, rate at start → rate now, weekday weights, current streak, ticked today, longest earlier run
    dict(names=('No screens in bed', 'Pas d’écran au lit'), color='#F0B35A', rates=(0.40, 0.86),
         weekdays=WEEKEND_HARD, streak=23, today=True, max_run=19),
    dict(names=('Read 10 pages', 'Lire 10 pages'), color='#6E9BF2', rates=(0.62, 0.92),
         weekdays=EVEN, streak=47, today=True, max_run=26),
    dict(names=('Walk 8,000 steps', 'Marcher 8 000 pas'), color='#80DAB5', rates=(0.66, 0.82),
         weekdays=WEEKDAYS_HARD, streak=9, today=True, max_run=16),
    dict(names=('Floss', 'Passer le fil dentaire'), color='#D3B8FF', rates=(0.34, 0.72),
         weekdays=WEEKEND_HARD, streak=3, today=False, max_run=8),
]


def days_between(a, b):
    d = a
    while d <= b:
        yield d
        d += timedelta(days=1)


def build(h, seed):
    rng = random.Random(seed)
    ticked = set()
    total = (today - start).days
    month = start.replace(day=1)
    while month <= today:
        nxt = (month + timedelta(days=32)).replace(day=1)
        days = [d for d in days_between(max(month, start), min(nxt - timedelta(days=1), today - timedelta(days=1)))]
        if days:
            progress = (days[len(days) // 2] - start).days / total
            rate = h['rates'][0] + (h['rates'][1] - h['rates'][0]) * progress + rng.uniform(-0.04, 0.04)
            scored = sorted(days, key=lambda d: h['weekdays'][d.weekday()] + rng.uniform(0, 0.9), reverse=True)
            ticked.update(scored[: round(rate * len(days))])
        month = nxt
    # The current streak, exactly: ticked up to today (or yesterday), with a gap just before.
    end = today if h['today'] else today - timedelta(days=1)
    first = end - timedelta(days=h['streak'] - 1)
    ticked.update(days_between(first, end))
    ticked.discard(first - timedelta(days=1))
    if not h['today']:
        ticked.discard(today)
    # Earlier runs stay below the allowed length, so the record is the one we chose.
    run = []
    for d in days_between(start, first - timedelta(days=2)):
        if d in ticked:
            run.append(d)
            if len(run) > h['max_run']:
                ticked.discard(d)
                run = []
        else:
            run = []
    # The last 30 days beat the 30 before by at least 5 points: the trend arrow points up.
    recent = [d for d in days_between(end - timedelta(days=29), first - timedelta(days=2))]
    before = list(days_between(end - timedelta(days=59), end - timedelta(days=30)))
    share = lambda days: sum(d in ticked for d in days) / len(days)
    for d in sorted((d for d in recent if d not in ticked), key=lambda d: -h['weekdays'][d.weekday()]):
        if share(list(days_between(end - timedelta(days=29), end))) >= share(before) + 0.05:
            break
        ticked.add(d)
    return ticked


def describe(name, ticked):
    def rate(a, b):
        days = list(days_between(a, b))
        return round(100 * sum(d in ticked for d in days) / len(days))

    end = today if today in ticked else today - timedelta(days=1)
    streak, d = 0, end
    while d in ticked:
        streak, d = streak + 1, d - timedelta(days=1)
    best = cur = 0
    for d in days_between(start, today):
        cur = cur + 1 if d in ticked else 0
        best = max(best, cur)
    months = []
    m = date(today.year - 1, today.month, 1)
    for _ in range(12):
        nxt = (m + timedelta(days=32)).replace(day=1)
        months.append(rate(m, nxt - timedelta(days=1)))
        m = nxt
    year_from = date(today.year - 1, today.month, 1)
    weekdays = []
    for wd in range(7):
        days = [x for x in days_between(year_from, m - timedelta(days=1)) if x.weekday() == wd]
        weekdays.append(round(100 * sum(x in ticked for x in days) / len(days)))
    print(f'{name}\n  streak {streak} · record {best} · 30 days {rate(end - timedelta(days=29), end)}% '
          f'(before {rate(end - timedelta(days=59), end - timedelta(days=30))}%)\n'
          f'  months {months}\n  weekdays Mon→Sun {weekdays}')


con = None if check else sqlite3.connect(db_path)
if con:
    con.execute('DELETE FROM checks')
    con.execute('DELETE FROM habits')
    con.execute('DELETE FROM reminders')
    con.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('weekStartsOn', 'monday')")
    con.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('theme', 'system')")
    con.execute("INSERT INTO reminders (time) VALUES ('21:30')")

for order, h in enumerate(HABITS):
    ticked = build(h, seed=order + 1)
    name = h['names'][0 if lang == 'en' else 1]
    if check:
        describe(name, ticked)
        continue
    cur = con.execute(
        'INSERT INTO habits (uid, name, color, sort_order, start_day, archived_at) VALUES (?, ?, ?, ?, ?, NULL)',
        (f'demo-{order}', name, h['color'], order, start.isoformat()),
    )
    con.executemany('INSERT INTO checks (habit_id, day) VALUES (?, ?)', [(cur.lastrowid, d.isoformat()) for d in sorted(ticked)])

if con:
    con.commit()
    con.close()
