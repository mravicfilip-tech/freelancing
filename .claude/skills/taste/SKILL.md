---
name: taste
description: Logs a design pick or rejection to the client's taste log the same turn, with Filip's words for why and a carry forward rule, and marks any older entry it overturns as superseded. Use the moment Filip picks a variant ("v6 is perfect", "go with 3"), rejects a look ("don't like these indicators"), or accepts or kills a direction. Also on "/taste" or "log this". Do NOT use for bugs or defects with no design judgement in them, or for a bare "ok", "thanks" or "looks good" that does not name a design choice.
---

# Taste

K is the kit root. It is `studio/` when the repo root holds `studio/DOCTRINE.md`, and the folder
this skill was loaded from otherwise.

The `/uireview` critic and every builder read these logs before judging or building. An
unlogged rejection gets rebuilt next week.

## Write the entry

File `K/clients/<client>/taste.md`. Newest entry at the
top, under the header. One bullet in this format. Outside the kit repo there is no log to write.
Then print the entry in one code block and say in one line that it belongs in
`studio/clients/<client>/taste.md` in the freelancing repo.

```
- **YYYY-MM-DD HH:MM, <thing>, <what happened>.** ACCEPTED | REJECTED. Said: "<Filip's words, under 20 words>". Why: <the reason>. Carry forward: <the rule a builder follows next time>.
```

One line per entry. The time keeps same-day entries in order.

- **Said** is his exact words. **Why** is the reason. When his words are only a verdict
  ("perfect", "don't like it"), write the most likely reason and mark it `(inferred)`.
- **Name what was judged.** For a rejection, name the actual treatment from the code or the
  screen (token, class, value, component), so the rule still means something next month. If
  you cannot find it, ask Filip one question before logging.
- **"Kill X, use Y"** is one ACCEPTED entry for Y that names X as rejected inside it. Mark Y
  `(not yet built)` until Filip has seen it built.
- **Variant picks** name the winner, then `Losers:` with what each did, inside Why.
- **Brand values** are written as the token name from `K/clients/<client>/README.md` or the
  repo's tokens, never an improvised hex.
- **Carry forward** is a rule someone can check. "No opacity on content text", not "make it
  better".

## App-wide rulings

A ruling that covers the whole app ("8px gap always, app wide", "standardize this across the
app", "accepting terms works like this everywhere") is one ACCEPTED entry. Write the rule in
**Carry forward** as a checkable value with its scope, for example "Gap between sibling cards is
8px on every route". Mark the entry `APP-WIDE`. Builders apply it to every screen they touch from
then on, and the brand README and taste log are read before UI work, so it carries into later
sessions without Filip repeating it.

## Keep the log true

- If the new entry overturns an older one, append to the older one's status in place, so
  `ACCEPTED` becomes `ACCEPTED, SUPERSEDED by YYYY-MM-DD <thing>`. Never delete history.
- **A reversal back to an earlier choice** does not add a third entry. Mark the entry being
  reversed `SUPERSEDED`, and append `REINSTATED YYYY-MM-DD HH:MM` to the earlier one, with
  Filip's words. One entry stays current for each thing.
- **"Log this" with nothing to log.** If no pick or rejection is in the conversation, ask one
  question naming the last design choice discussed. Never invent an entry.
- If a project memory describes the overturned direction as current, update its status the
  same turn, per the memory rule in the global CLAUDE.md.
- **Size.** Every UI session reads the whole log. When
  the file passes 8,000 characters, move entries marked `SUPERSEDED` to `taste-archive.md` in the
  same folder, in the same turn, unchanged. The archive is never read unless Filip asks.
- **No client folder yet** (a personal tool, a new pursuit). Create
  `K/clients/<client>/taste.md` with the header only, log the entry, and say so in the confirm line.

## Confirm

One line in chat per entry logged. The client, the entry's first words, and the carry
forward rule. Taste logging never moves a task.
