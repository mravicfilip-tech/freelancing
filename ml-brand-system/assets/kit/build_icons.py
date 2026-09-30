"""Service icons, one per lever. 24 x 24 grid, 2px stroke, round caps and joins, 2px safe margin.
Colour comes from currentColor, so icons take the text colour they sit in.
Run: python3 build_icons.py
"""
import json, math, os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "icons", "svg")
os.makedirs(OUT, exist_ok=True)


def bar60(x, y, length):
    """A short 60 degree bar from (x, y) upwards, the mark's own angle."""
    return f"M{x} {y} l{length * 0.5:.2f} {-length * math.sqrt(3) / 2:.2f}"


def star(cx=12, cy=12.4, R=9, r=4.1):
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        rr = R if i % 2 == 0 else r
        pts.append(f"{cx + rr * math.cos(a):.2f} {cy + rr * math.sin(a):.2f}")
    return "M" + " L".join(pts) + " Z"


ICONS = {
    # a call that was missed and won back: handset plus an arrow returning to it
    "calls": ["M5.5 4h2.6l1.4 3.6-1.9 1.2a10 10 0 0 0 4.9 4.9l1.2-1.9 3.6 1.4v2.6a2 2 0 0 1-2.2 2A14.5 14.5 0 0 1 3.5 6.2a2 2 0 0 1 2-2.2z",
              "M20.5 3.5l-5 5", "M15.5 4.5v4h4"],
    # follow-up: a message that arrives in sequence, a second bubble behind
    "follow-up": ["M4 7.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-5.5L6 19v-3.5a2 2 0 0 1-2-2z", "M8.5 3.5H18a2 2 0 0 1 2 2V12"],
    "reviews": [star()],
    "booking": ["M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z", "M8 3v4", "M16 3v4", "M4 10h16", "M9 15l2 2 4-4"],
    "ads": ["M4 10v4a1 1 0 0 0 1 1h2l6 4V5L7 9H5a1 1 0 0 0-1 1z", "M7 15l1 4.5", "M16.5 9.5a3.5 3.5 0 0 1 0 5", "M19 7a7 7 0 0 1 0 10"],
    # the always-on assistant that picks up: a headset
    "assistant": ["M4.5 14v-2a7.5 7.5 0 0 1 15 0v2", "M4.5 14h2.5v5H5.5a1 1 0 0 1-1-1z", "M19.5 14H17v5h1.5a1 1 0 0 0 1-1z", "M17 19a3 3 0 0 1-3 2h-2"],
    "automation": ["M4 12a8 8 0 0 1 13.6-5.7L20 8.5", "M20 3.5v5h-5", "M20 12a8 8 0 0 1-13.6 5.7L4 15.5", "M4 20.5v-5h5"],
    "offers": ["M3.5 12.2V5a1.5 1.5 0 0 1 1.5-1.5h7.2L21 12.3 12.3 21z", "M8.2 8.2h.01"],
    # results: axes plus the mark's three rising bars at 60 degrees
    "reporting": ["M4 4v16h16", bar60(7.5, 16.5, 4), bar60(11.25, 16.5, 7), bar60(15, 16.5, 10)],
    "customers": ["M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z", "M3 20a6 6 0 0 1 12 0", "M16 4.2a3.5 3.5 0 0 1 0 6.6", "M21 20a6 6 0 0 0-3.5-5.4"],
    # hours given back: a clock running the other way
    "hours": ["M4 12a8 8 0 1 0 2.3-5.7L4 8.5", "M4 3.5v5h5", "M12 8v4.5l3 2"],
    # leverage itself: a beam on a fulcrum, rising to the right
    "leverage": ["M3 16.5l18-8", "M12 12.5l-3.8 7.5h7.6z"],
}

LABELS = {
    "calls": "Missed-call recovery", "follow-up": "Follow-up", "reviews": "Reviews", "booking": "Booking",
    "ads": "Ads", "assistant": "Always-on assistant", "automation": "Automation", "offers": "Offers",
    "reporting": "Reporting", "customers": "Customers", "hours": "Hours back", "leverage": "Leverage",
}


def icon_svg(paths, title=None):
    t = f"<title>{title}</title>" if title else ""
    body = "".join(f'<path d="{d}"/>' for d in paths)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" '
            f'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="{title or ""}">{t}{body}</svg>\n')


for name, paths in ICONS.items():
    open(os.path.join(OUT, f"ml-icon-{name}.svg"), "w").write(icon_svg(paths, LABELS[name]))

# one sprite for the web: <svg><use href="ml-icons.svg#ml-icon-calls"/></svg>
sprite = ['<svg xmlns="http://www.w3.org/2000/svg" style="display:none">']
for name, paths in ICONS.items():
    sprite.append(f'<symbol id="ml-icon-{name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
                  + "".join(f'<path d="{d}"/>' for d in paths) + "</symbol>")
sprite.append("</svg>\n")
open(os.path.join(HERE, "icons", "ml-icons.svg"), "w").write("".join(sprite))
json.dump(LABELS, open(os.path.join(HERE, "icons", "icons.json"), "w"), indent=1)
print(len(ICONS), "icons")
