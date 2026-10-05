---
name: harden
description: Self-review of words, meaning an answer, a plan, a doc or a drafted message. Pokes holes, checks logic and mistakes, returns a hardened version and what changed. Use on "harden this", "poke holes", "double check", "review this plan", "review your answer", "check your logic", "/harden", when the thing to check is text. Do NOT use on UI code, a build, screens or a branch (that is /uireview), and do not run it twice on the same target.
---

# Harden

K is the kit root. It is `studio/` when the repo root holds `studio/DOCTRINE.md`, and the folder
this skill was loaded from otherwise.

One pass, in the main thread, no helpers.
It runs when Filip asks, never by itself and never in a loop.

## 1. Pick the target

The last answer or plan in this chat, or whatever Filip pasted or pointed at. If the audience or
purpose is not obvious, assume one and state it as the first line.

If the target is UI code, a build, screens or a branch, do not harden it. Run the self-check from
the doctrine build recipe, then say in one line that `/uireview` is there if he wants it. If he says
"again" or "double check" on a version already hardened, that is a new request and one more pass is
fine. Do not offer it, and do not start it yourself.

## 2. Poke holes

Read the target as a stranger would. Look for
- logic that does not follow, and steps out of order
- mistakes in facts, numbers, names, paths and commands
- claims made without checking, so check them now with a read or a command where cheap
- bias or one-sided framing
- gaps, meaning what the reader will ask that it does not answer
- scope creep, or a narrower reading that would have been enough
- anything that commits Filip to more than he intended

Keep the seven most serious. Cut each to two sentences.

## 3. Return three sections, in this order

- **Holes.** The assumption line if any, then the numbered list, most serious first.
- **Hardened version.** The full rewrite, ready to use, in Filip's voice and with his facts.
  - Never add a fact, number, name, date or promise he did not make.
  - When a fix needs a fact that is missing, leave a plain slot such as "owner to be named" and
    list it under What I changed as "Filip to add".
- **What I changed.** One line per hole. Fixed, left open and why, or Filip to add.

When the target was a plan, the hardened version is the revised plan. Do not start building it.

All three sections follow `K/foundation/writing.md` in full. No long dashes, no colons,
plain words, short. Never send anything. Filip sends.
