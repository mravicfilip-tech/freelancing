# Working with Filip
<!-- studio-freelance kit. The kit lives in studio/, its skills and helpers in .claude/. -->

Filip is a freelance product and UI designer. He builds real, running prototypes for clients and
ships them to a preview URL the client can open. The studio kit below loads his writing rules, the
triggers, the modes and the two guards.

@studio/DOCTRINE.md

## The operating agreement

Filip hands over whole pieces of work and expects the judgement of someone who knows the craft,
not a literal executor. Two failure modes cost days on past builds, building on a guess instead of
asking, and regressing working design while fixing a named defect. These rules stop both. They
apply to every client and every project.

### Defaults that are settled, do not ask about these

- **A client prototype ships as a real, running prototype.** It is walked through live in a
  browser, clicked by the client, and deployed to a URL they can open themselves. Never a deck,
  never a projector mock-up, never a standalone HTML file, never a Figma frame presented as the
  deliverable.
- **It is built in the client's folder in this repo**, on the session's branch, with real data
  shapes and real interaction. Every client lives in this one repo. Cloud sessions are pinned to a
  `claude/<name>` branch, so the concept is named in the task line in
  `studio/clients/<client>/tasks.md`, with the PR and the preview URL beside it. Scratch files
  are for settling one detail, never for the thing that gets shown.
- **It is deployed before it is presented.** A prototype that only runs on localhost is not
  finished. The preview URL is part of the deliverable.
- **Brand fidelity is not decoration.** The palette, the logo treatment and the type are the
  client's property and get matched exactly, from `studio/clients/<client>/README.md`. Do not
  improvise brand expression.

### The kickoff gate, ask once before writing any code

When a new build or a redesign starts, and the answer is not already obvious from the repo or the
thread, ask these in **one message**, with a proposed default beside each so Filip can reply "yes"
or correct one line. Then stop and wait. Do not start building while the message is unanswered.

1. **Scope verb.** Am I changing only the named thing, or am I free to change the design around
   it? Default is only the named thing.
2. **Reference.** Is there a design, screenshot or product I should match? Default is none, so I
   will propose one direction in words first and build only after it is approved.
3. **Baseline.** Which commit or URL is the current good version I must not regress? Default is
   the last one Filip reacted well to, named explicitly.
4. **Output format.** Prototype in the repo, a document, an artifact, a report? Default is a
   prototype in the repo plus a deployed preview URL.
5. **Done.** What has to be true for this to be finished? Default is that `/uireview` shows no
   open sev 1 and the preview URL is live.

If a question comes up mid-build that changes what gets built, **stop and ask**. Do not produce
something plausible to see how it lands. A blocked half hour is cheaper than a rejected day.

### Scope discipline

- A verb like "apply", "add", "swap" or "use" means **that and nothing else**. Only "redesign",
  "rebuild" or "rethink" licenses changing layout, structure or components.
- When a request is ambiguous about scope, the narrow reading wins, and say in one line that the
  wider reading is available.
- Variants are split by level. Layout, structure and direction get one pick, argued, with what it
  refuses, built in the real app. Micro detail (motion, icons, states, loaders) gets 3 to 5
  numbered variants, genuinely different, so Filip can answer with a number. Never a menu of
  near-identical variants at either level.

### The regression rule

Fixing a named defect must not change anything that was not named.

- Before touching the code, capture a screenshot of every affected route at the client's Widths, with
  `node studio/scripts/shoot.mjs`. Compare after. Anything that moved and was not
  on the list is a regression to undo, not a bonus.
- Desktop first. Phone layouts only when the client brief names them.
- **Never run a blind find and replace across files.** A blanket colour or class sweep is how
  tiles turn into flat slabs and a nav scrim changes colour. If a sweep is genuinely the right
  tool, enumerate the matches first, read every one, and screenshot the result before committing.
- Keep the diff proportional to the ask. A one line defect should not produce a fifteen file
  commit.

### Use the rails that already exist

- **`/uireview` before anything reaches a client.** Its rubric catches small type, weak contrast,
  invisible chips and inconsistent controls. Run it on my own work.
- If installed, `make-interfaces-feel-better` is for polish detail and `frontend-design` is for
  direction.

### Artifact hygiene

- One concept, one session branch and one PR. The concept's name goes in the PR title and the
  task line. `main` always holds the **accepted** work, so only an accepted concept is merged. A
  rejected direction gets its PR closed or clearly marked, never left where someone would open it
  first.
- Clean up worktrees when a line of work ends. A directory name must describe what is in it.
- Keep the task's link in `studio/clients/<client>/tasks.md` pointing at the version Filip would
  want to show.

### Memory discipline

Record design decisions with their **status**, not just their content. Accepted, rejected or
superseded. A memory that describes a rejected direction as the standard is worse than no memory,
because the next session will rebuild it. When a direction is rejected, update or delete the
memory in the same turn.
