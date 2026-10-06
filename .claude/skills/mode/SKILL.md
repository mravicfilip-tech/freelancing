---
name: mode
description: Sets the working mode for this session, coding, studio, content, research or light, which decides the main thread model and the helper tier for each role. Use when Filip types /mode with a name, or says switch to a mode by name. Do NOT use for picking a single helper's model mid-task, and never run it on every turn.
---

# Mode

K is the kit root. It is `studio/` when the repo root holds `studio/DOCTRINE.md`, and the folder
this skill was loaded from otherwise.

The modes table lives in `K/foundation/models.md`.
Read only its Modes section. Never restate the table from memory.

1. Take the mode name Filip gave. With no name, list the five modes in one line and stop.
   An unknown name gets the same one line.
2. Print the row in at most five short lines. Mode, builders, readers and research, shots
   and sweeps, and what it is for.
3. Compare the row's main thread with the model and effort this session runs on. If they
   differ, add one line telling Filip what to pick in the model menu, for example
   "Pick Opus at high in the model menu." A session cannot switch its own model, so never try.
   If they match, say nothing about it.
4. For the rest of the session, spawn helpers by tier agent (`quick`, `read`, `build`, `deep`)
   as the row says. A role marked none gets no helper. Outside the kit repo the tier agents can
   be missing. Then spawn a general-purpose helper on the tier's model alias instead.
5. The mode lasts until Filip picks another or the session ends. After a compaction, if the
   mode is no longer in context, pick it again from the task in one line.

The `/uireview` critic ignores the mode. Writing follows `K/foundation/writing.md`.
