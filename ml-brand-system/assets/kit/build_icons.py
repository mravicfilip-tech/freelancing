"""Service icons, one per lever. 24 x 24 grid, 1.5px stroke, round caps and joins, 2px safe margin.
Colour comes from currentColor, so icons take the text colour they sit in.

Every icon also has a motion loop (3s) that acts out what the service does: the missed call rings back,
the bars grow, the lever lifts. Motion only moves parts of the static drawing and settles back on it,
so the static and animated icons are the same icon. Reduced-motion users get the static icon.

Outputs
  icons/svg/ml-icon-<name>.svg        static
  icons/animated/ml-icon-<name>.svg   self-contained animated SVG (CSS inside, works in <img> and browsers)
  icons/ml-icons.svg                  static sprite: <svg><use href="ml-icons.svg#ml-icon-calls"/></svg>
  icons/ml-icons-motion.css           motion for inline SVG on the web: <svg class="ml-icon ml-calls"> with the part classes
  icons/icons.json                    labels and paths (with part classes) for building inline SVG
Run: python3 build_icons.py
"""
import json, math, os

HERE = os.path.dirname(os.path.abspath(__file__))
ICON_DIR = os.path.join(HERE, "icons")
OUT = os.path.join(ICON_DIR, "svg")
ANIM = os.path.join(ICON_DIR, "animated")
os.makedirs(OUT, exist_ok=True)
os.makedirs(ANIM, exist_ok=True)
STROKE = 1.5
CYCLE = "3s"
EASE = "cubic-bezier(.3,.7,.2,1)"


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


BUBBLE = "M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-4.5 3.5V17H6a2 2 0 0 1-2-2z"

# name: [(path, part classes)]. Part "d" draws the path in (pathLength=1); a, b, c, e are moving parts.
ICONS = {
    # a call that was missed and won back: handset plus an arrow returning to it
    "calls": [("M5.5 4h2.6l1.4 3.6-1.9 1.2a10 10 0 0 0 4.9 4.9l1.2-1.9 3.6 1.4v2.6a2 2 0 0 1-2.2 2A14.5 14.5 0 0 1 3.5 6.2a2 2 0 0 1 2-2.2z", "a"),
              ("M20.5 3.5l-5 5", "b"), ("M15.5 4.5v4h4", "b")],
    # follow-up: a message that arrives in sequence, a second bubble behind
    "follow-up": [("M4 7.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-5.5L6 19v-3.5a2 2 0 0 1-2-2z", "a"), ("M8.5 3.5H18a2 2 0 0 1 2 2V12", "b")],
    "reviews": [(star(), "a")],
    "booking": [("M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z", ""), ("M8 3v4", "b"), ("M16 3v4", "c"), ("M4 10h16", ""), ("M9 15l2 2 4-4", "d")],
    "ads": [("M4 10v4a1 1 0 0 0 1 1h2l6 4V5L7 9H5a1 1 0 0 0-1 1z", "a"), ("M7 15l1 4.5", "a"), ("M16.5 9.5a3.5 3.5 0 0 1 0 5", "b"), ("M19 7a7 7 0 0 1 0 10", "c")],
    # the always-on assistant that picks up: a headset
    "assistant": [("M4.5 14v-2a7.5 7.5 0 0 1 15 0v2", ""), ("M4.5 14h2.5v5H5.5a1 1 0 0 1-1-1z", "b"), ("M19.5 14H17v5h1.5a1 1 0 0 0 1-1z", "c"), ("M17 19a3 3 0 0 1-3 2h-2", "d")],
    "automation": [("M4 12a8 8 0 0 1 13.6-5.7L20 8.5", "a"), ("M20 3.5v5h-5", "a"), ("M20 12a8 8 0 0 1-13.6 5.7L4 15.5", "a"), ("M4 20.5v-5h5", "a")],
    "offers": [("M3.5 12.2V5a1.5 1.5 0 0 1 1.5-1.5h7.2L21 12.3 12.3 21z", "a"), ("M8.2 8.2h.01", "a")],
    # results: axes plus the mark's three rising bars at 60 degrees
    "reporting": [("M4 4v16h16", ""), (bar60(7.5, 16.5, 4), "b"), (bar60(11.25, 16.5, 7), "c"), (bar60(15, 16.5, 10), "e")],
    "customers": [("M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z", "a"), ("M3 20a6 6 0 0 1 12 0", "a"), ("M16 4.2a3.5 3.5 0 0 1 0 6.6", "b"), ("M21 20a6 6 0 0 0-3.5-5.4", "b")],
    # hours given back: a clock running the other way
    "hours": [("M4 12a8 8 0 1 0 2.3-5.7L4 8.5", "a"), ("M4 3.5v5h5", "a"), ("M12 8v4.5l3 2", "b")],
    # leverage itself: a beam on a fulcrum, rising to the right
    "leverage": [("M3 16.5l18-8", "a"), ("M12 12.5l-3.8 7.5h7.6z", "")],
    # ---- set 2: the rest of a local business's growth stack ----
    "website": [("M3 6.5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", ""), ("M3 9h18", ""), ("M6 6.75h.01", ""), ("M8.5 6.75h.01", ""), ("M7 13h8", "b"), ("M7 16h5", "c")],
    "local-search": [("M12 19.5s-6-5.2-6-10a6 6 0 0 1 12 0c0 4.8-6 10-6 10z", "a"), ("M12 11.75a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5z", "a"), ("M8.5 21h7", "b")],
    "messaging": [(BUBBLE, ""), ("M8.5 10.5h.01", "b"), ("M12 10.5h.01", "c"), ("M15.5 10.5h.01", "e")],
    "email": [("M3.5 7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z", "a"), ("M4 7.5l8 5.5 8-5.5", "a d")],
    "quotes": [("M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z", ""), ("M14 3v5h5", ""), ("M9 13h6", "b"), ("M9 17h4", "c")],
    "payments": [("M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "a"), ("M3 10h18", "a"), ("M7 15h3", "a")],
    # new leads dropping into the pipeline
    "pipeline": [("M4 5h16l-6 7.5V19l-4 2v-8.5z", ""), ("M12 2h.01", "b")],
    # word of mouth: a bubble with a heart
    "referrals": [(BUBBLE, ""), ("M12 13.5s-3-1.8-3-3.8a1.6 1.6 0 0 1 3-.8 1.6 1.6 0 0 1 3 .8c0 2-3 3.8-3 3.8z", "b")],
    "reminders": [("M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z", "a"), ("M12 3v2", "a"), ("M10 20.5a2 2 0 0 0 4 0", "b")],
    "social": [("M14 5l6 6-6 6", "a"), ("M20 11h-8a7 7 0 0 0-7 7v1", "a")],
    "growth": [("M3 17l5.5-5.5 4 4L20 8", "d"), ("M15 8h5v5", "b")],
    "storefront": [("M4 9l1.5-5h13L20 9", "a"), ("M4 9a2.67 2.67 0 0 0 5.33 0 2.67 2.67 0 0 0 5.34 0 2.67 2.67 0 0 0 5.33 0", "a"), ("M5.5 12v8h13v-8", ""), ("M10 20v-4.5h4V20", "b")],
}

LABELS = {
    "calls": "Missed-call recovery", "follow-up": "Follow-up", "reviews": "Reviews", "booking": "Booking",
    "ads": "Ads", "assistant": "Always-on assistant", "automation": "Automation", "offers": "Offers",
    "reporting": "Reporting", "customers": "Customers", "hours": "Hours back", "leverage": "Leverage",
    "website": "Website", "local-search": "Local search", "messaging": "Text messaging", "email": "Email",
    "quotes": "Quotes", "payments": "Payments", "pipeline": "Lead pipeline", "referrals": "Referrals",
    "reminders": "Reminders", "social": "Social", "growth": "Growth", "storefront": "Local business",
}

# Motion per icon. Origins are in the 24 x 24 view box (transform-box: view-box).
MOTION = {
    # the arrow comes back in, then the handset rings
    "calls": """
.ml-calls .b{animation:ml-calls-b 3s {E} infinite}
.ml-calls .a{transform-origin:10px 12px;animation:ml-calls-a 3s linear infinite}
@keyframes ml-calls-b{0%{transform:translate(3px,-3px);opacity:0}20%,100%{transform:none;opacity:1}}
@keyframes ml-calls-a{0%,22%,56%,100%{transform:none}27%,37%,47%{transform:rotate(-12deg)}32%,42%,51%{transform:rotate(10deg)}}""",
    # the second message slides in behind, the first gives a nudge
    "follow-up": """
.ml-follow-up .b{animation:ml-fu-b 3s {E} infinite}
.ml-follow-up .a{animation:ml-fu-a 3s {E} infinite}
@keyframes ml-fu-b{0%{transform:translate(-2.5px,2.5px);opacity:0}25%,100%{transform:none;opacity:1}}
@keyframes ml-fu-a{0%,28%,44%,100%{transform:none}35%{transform:translateY(-1.5px)}}""",
    # the star pops in with a turn
    "reviews": """
.ml-reviews .a{transform-origin:12px 12.4px;animation:ml-rv 3s {E} infinite}
@keyframes ml-rv{0%,100%{transform:none}12%{transform:scale(.7) rotate(-24deg)}30%{transform:scale(1.12) rotate(6deg)}42%{transform:none}}""",
    # rings flick and the tick draws in
    "booking": """
.ml-booking .d{stroke-dasharray:1;animation:ml-bk-d 3s {E} infinite}
.ml-booking .b,.ml-booking .c{animation:ml-bk-r 3s {E} infinite}
.ml-booking .c{animation-delay:.08s}
@keyframes ml-bk-d{0%,12%{stroke-dashoffset:1}38%,100%{stroke-dashoffset:0}}
@keyframes ml-bk-r{0%,100%{transform:none}5%{transform:translateY(-1.5px)}12%{transform:none}}""",
    # the speaker thumps and the sound goes out
    "ads": """
.ml-ads .a{transform-origin:9px 12px;animation:ml-ad-a 1.5s {E} infinite}
.ml-ads .b,.ml-ads .c{animation:ml-ad-w 1.5s {E} infinite}
.ml-ads .c{animation-delay:.12s}
@keyframes ml-ad-a{0%,100%{transform:none}10%{transform:scale(.9)}24%{transform:none}}
@keyframes ml-ad-w{0%,8%{transform:translateX(-1.5px);opacity:0}30%,100%{transform:none;opacity:1}}""",
    # it picks up: ear cups pulse, the mic swings down
    "assistant": """
.ml-assistant .b,.ml-assistant .c{transform-box:fill-box;transform-origin:center;animation:ml-as-c 1.5s {E} infinite}
.ml-assistant .c{animation-delay:.1s}
.ml-assistant .d{stroke-dasharray:1;animation:ml-as-d 3s {E} infinite}
@keyframes ml-as-c{0%,100%{transform:none}12%{transform:scale(1.15)}28%{transform:none}}
@keyframes ml-as-d{0%,10%{stroke-dashoffset:1}40%,100%{stroke-dashoffset:0}}""",
    # one full turn of the loop
    "automation": """
.ml-automation .a{transform-origin:12px 12px;animation:ml-au 3s {E} infinite}
@keyframes ml-au{0%{transform:none}50%,100%{transform:rotate(360deg)}}""",
    # the tag swings on its hole
    "offers": """
.ml-offers .a{transform-origin:8.2px 8.2px;animation:ml-of 3s ease-out infinite}
@keyframes ml-of{0%,52%,100%{transform:none}10%{transform:rotate(14deg)}22%{transform:rotate(-9deg)}34%{transform:rotate(5deg)}44%{transform:rotate(-2deg)}}""",
    # the three bars grow from their feet, shortest first
    "reporting": """
.ml-reporting .b{transform-origin:7.5px 16.5px}
.ml-reporting .c{transform-origin:11.25px 16.5px}
.ml-reporting .e{transform-origin:15px 16.5px}
.ml-reporting .b,.ml-reporting .c,.ml-reporting .e{animation:ml-rp 3s {E} infinite}
.ml-reporting .c{animation-delay:.12s}
.ml-reporting .e{animation-delay:.24s}
@keyframes ml-rp{0%{transform:scale(0)}24%{transform:scale(1.1)}32%,100%{transform:none}}""",
    # a second customer joins
    "customers": """
.ml-customers .b{animation:ml-cu-b 3s {E} infinite}
.ml-customers .a{animation:ml-cu-a 3s {E} infinite}
@keyframes ml-cu-b{0%{transform:translateX(-3px);opacity:0}26%,100%{transform:none;opacity:1}}
@keyframes ml-cu-a{0%,26%,42%,100%{transform:none}33%{transform:translateY(-1px)}}""",
    # the hands wind back a full turn
    "hours": """
.ml-hours .b{transform-origin:12px 12.5px;animation:ml-hr-b 3s {E} infinite}
.ml-hours .a{transform-origin:12px 12px;animation:ml-hr-a 3s {E} infinite}
@keyframes ml-hr-b{0%{transform:none}50%,100%{transform:rotate(-360deg)}}
@keyframes ml-hr-a{0%,100%{transform:none}14%{transform:rotate(-18deg)}40%{transform:none}}""",
    # the beam drops level, then the lever lifts it
    "leverage": """
.ml-leverage .a{transform-origin:12px 12.5px;animation:ml-lv 3s {E} infinite}
@keyframes ml-lv{0%,100%{transform:none}14%,24%{transform:rotate(24deg)}44%{transform:rotate(-3deg)}54%{transform:none}}""",
    # the page lines type in
    "website": """
.ml-website .b{transform-origin:7px 13px}
.ml-website .c{transform-origin:7px 16px}
.ml-website .b,.ml-website .c{animation:ml-ws 3s {E} infinite}
.ml-website .c{animation-delay:.15s}
@keyframes ml-ws{0%,6%{transform:scaleX(0)}32%,100%{transform:none}}""",
    # the pin drops onto the map
    "local-search": """
.ml-local-search .a{animation:ml-ls-a 3s {E} infinite}
.ml-local-search .b{transform-origin:12px 21px;animation:ml-ls-b 3s {E} infinite}
@keyframes ml-ls-a{0%{transform:translateY(-5px);opacity:0}18%{transform:none;opacity:1}26%{transform:translateY(-1.2px)}34%,100%{transform:none}}
@keyframes ml-ls-b{0%,14%{transform:scaleX(.3)}20%{transform:scaleX(1.25)}32%,100%{transform:none}}""",
    # someone is typing
    "messaging": """
.ml-messaging .b,.ml-messaging .c,.ml-messaging .e{animation:ml-ms 1.5s {E} infinite}
.ml-messaging .c{animation-delay:.12s}
.ml-messaging .e{animation-delay:.24s}
@keyframes ml-ms{0%,40%,100%{transform:none}14%{transform:translateY(-2px)}}""",
    # the envelope arrives and closes
    "email": """
.ml-email .a{animation:ml-em-a 3s {E} infinite}
.ml-email .d{stroke-dasharray:1;animation:ml-em-a 3s {E} infinite,ml-em-d 3s {E} infinite}
@keyframes ml-em-a{0%{transform:translateX(-3px);opacity:0}20%,100%{transform:none;opacity:1}}
@keyframes ml-em-d{0%,16%{stroke-dashoffset:1}42%,100%{stroke-dashoffset:0}}""",
    # the quote writes itself
    "quotes": """
.ml-quotes .b{transform-origin:9px 13px}
.ml-quotes .c{transform-origin:9px 17px}
.ml-quotes .b,.ml-quotes .c{animation:ml-qt 3s {E} infinite}
.ml-quotes .c{animation-delay:.15s}
@keyframes ml-qt{0%,6%{transform:scaleX(0)}32%,100%{transform:none}}""",
    # tap to pay
    "payments": """
.ml-payments .a{transform-origin:12px 12px;animation:ml-py 3s {E} infinite}
@keyframes ml-py{0%,100%{transform:none}14%,20%{transform:translate(2px,-2px) rotate(-8deg)}38%{transform:none}}""",
    # a lead drops through the funnel
    "pipeline": """
.ml-pipeline .b{animation:ml-pl 3s ease-in infinite}
@keyframes ml-pl{0%,8%{transform:none;opacity:1}36%{transform:translateY(15px);opacity:0}37%{transform:translateY(-2px);opacity:0}52%,100%{transform:none;opacity:1}}""",
    # the heart beats
    "referrals": """
.ml-referrals .b{transform-origin:12px 11px;animation:ml-rf 1.5s {E} infinite}
@keyframes ml-rf{0%,60%,100%{transform:none}12%{transform:scale(1.25)}26%{transform:scale(.95)}40%{transform:scale(1.12)}}""",
    # the bell rings
    "reminders": """
.ml-reminders .a{transform-origin:12px 4px;animation:ml-rm-a 3s ease-out infinite}
.ml-reminders .b{animation:ml-rm-b 3s ease-out infinite}
@keyframes ml-rm-a{0%,44%,100%{transform:none}8%{transform:rotate(14deg)}16%{transform:rotate(-12deg)}24%{transform:rotate(8deg)}32%{transform:rotate(-4deg)}}
@keyframes ml-rm-b{0%,48%,100%{transform:none}11%{transform:translateX(-1.5px)}19%{transform:translateX(1.5px)}27%{transform:translateX(-1px)}35%{transform:translateX(.5px)}}""",
    # it gets shared
    "social": """
.ml-social .a{animation:ml-so 3s {E} infinite}
@keyframes ml-so{0%,100%{transform:none}12%{transform:translateX(2px)}26%{transform:translateX(-.5px)}36%{transform:none}}""",
    # the trend line draws, the arrow lands
    "growth": """
.ml-growth .d{stroke-dasharray:1;animation:ml-gr-d 3s {E} infinite}
.ml-growth .b{animation:ml-gr-b 3s {E} infinite}
@keyframes ml-gr-d{0%,4%{stroke-dashoffset:1}32%,100%{stroke-dashoffset:0}}
@keyframes ml-gr-b{0%,24%{transform:translate(-2px,2px);opacity:0}36%,100%{transform:none;opacity:1}}""",
    # the awning flaps and the door opens
    "storefront": """
.ml-storefront .a{transform-origin:12px 4px;animation:ml-sf-a 3s {E} infinite}
.ml-storefront .b{transform-origin:10px 20px;animation:ml-sf-b 3s {E} infinite}
@keyframes ml-sf-a{0%,100%{transform:none}10%{transform:scaleY(1.12)}20%{transform:scaleY(.96)}30%{transform:none}}
@keyframes ml-sf-b{0%,24%{transform:none}40%,64%{transform:scaleX(.25)}80%,100%{transform:none}}""",
}
BASE_CSS = (".ml-icon *{transform-box:view-box}\n"
            "@media (prefers-reduced-motion:reduce){.ml-icon *{animation:none!important}}")


def motion_css(name):
    return MOTION[name].replace("{E}", EASE).strip()


def path_el(d, cls="", motion=False):
    if not motion:
        return f'<path d="{d}"/>'
    attrs = f' class="{cls}"' if cls else ""
    if "d" in cls.split():
        attrs += ' pathLength="1"'
    return f'<path d="{d}"{attrs}/>'


def icon_svg(name, motion=False):
    title = LABELS[name]
    body = "".join(path_el(d, c, motion) for d, c in ICONS[name])
    cls = f' class="ml-icon ml-{name}"' if motion else ""
    style = f"<style>{BASE_CSS}\n{motion_css(name)}</style>" if motion else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg"{cls} viewBox="0 0 24 24" width="24" height="24" fill="none" '
            f'stroke="currentColor" stroke-width="{STROKE}" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="{title}">'
            f'<title>{title}</title>{style}{body}</svg>\n')


assert ICONS.keys() == LABELS.keys() == MOTION.keys()
for name in ICONS:
    open(os.path.join(OUT, f"ml-icon-{name}.svg"), "w").write(icon_svg(name))
    open(os.path.join(ANIM, f"ml-icon-{name}.svg"), "w").write(icon_svg(name, motion=True))

# one static sprite for the web: <svg><use href="ml-icons.svg#ml-icon-calls"/></svg>
sprite = ['<svg xmlns="http://www.w3.org/2000/svg" style="display:none">']
for name, paths in ICONS.items():
    sprite.append(f'<symbol id="ml-icon-{name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{STROKE}" stroke-linecap="round" stroke-linejoin="round">'
                  + "".join(path_el(d) for d, _ in paths) + "</symbol>")
sprite.append("</svg>\n")
open(os.path.join(ICON_DIR, "ml-icons.svg"), "w").write("".join(sprite))
open(os.path.join(ICON_DIR, "ml-icons-motion.css"), "w").write(
    "/* Maximum Leverage icon motion. Use with inline SVG: <svg class=\"ml-icon ml-calls\"> and the part classes from icons.json. */\n"
    + BASE_CSS + "\n" + "\n".join(motion_css(n) for n in ICONS) + "\n")
json.dump({n: {"label": LABELS[n], "paths": [[d, c] for d, c in ICONS[n]]} for n in ICONS},
          open(os.path.join(ICON_DIR, "icons.json"), "w"), indent=1)
print(len(ICONS), "icons, static and animated")
