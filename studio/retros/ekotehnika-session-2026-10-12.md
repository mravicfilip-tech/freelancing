# Ekotehnika session review

The session titled "Ekotehnika", 8 to 12 October 2026, branch `claude/awesome-faraday-lkhnn2`, still running when
this was written. Every time below is UTC, taken from commits and transcript events. It is written for Filip, to hand
to another Claude that will change the studio kit. Confidence tags mark how hard the evidence is.

## Read this first

- [Certain] Execution was not the slowest part. The slowest part was finding the story. From the brief at 4.23pm on
  8 Oct to your "I'll be driving it" at 2.56pm on 9 Oct, about 11 working hours, Claude built 5 directions, then 5
  one to one variants, then 9 story combinations. All of it was thrown out.
- [Certain] Once you drove the story with your own recording, voice over and Figma, it went from plan to production
  in about four hours, 2.56pm to 6.53pm on 9 Oct. Storyline 2 is still the base of everything since.
- [Certain] One session carried four days and eight tasks and cost $419.69. At 2.32pm on 12 Oct the split was $191.53
  on the Opus main thread and $148.30 on Sonnet builders. The main thread held 786k tokens before an auto compaction.
- [Certain] Today's estimate of 2.5 to 3.5 more hours came from the machine. Four builders rendered WebGL in software
  on 4 cores at a load of about 18. More usage does not buy that back. A second container does.
- [Certain] Claude told you twice that builder 3 was fitting Linija and Grad. It had stopped at 1.14pm and never
  committed. This is the worst miss in the session, because you planned around a false status.
- [Certain] Two of the five round 3 builders, plus a second cloud session, work on versions 2 and 4. You picked
  version 5 at 9.57am on 12 Oct.
- [Certain] None of the Ekotehnika studio files are on the default branch. The 56 taste entries, 8 tasks and every
  brief live only on the session branch, with no PR. A fresh Ekotehnika session started today would know none of it.
- [Certain] The kit update merged this evening (PR #9) already covers part of this. It does not cover the rest, and its
  new `/newui` skill is shaped for product apps with states and Radix controls, not for a scroll story site.

## The numbers

| Measure | Value |
|---|---|
| Wall time | 8 Oct 3.45pm to 12 Oct, still running |
| Cost | $419.69 total, 5.94M output tokens, 1.41B cache read tokens |
| Main thread | Opus at xhigh effort, `foundation/models.md` says high for studio work |
| Context | 786k tokens at the 2.30pm compaction on 12 Oct, 2.32M tokens dropped across compactions |
| Commits on the branch | 157, of them 28 taste logs and 26 note commits in one hour on 12 Oct |
| Tasks opened | 8 (ekotehnika-1 to ekotehnika-8), 1 in Done |
| Taste entries | 56, of them 28 REJECTED and 27 ACCEPTED |
| Rejections by day | 8 Oct 7, 9 Oct 1, 12 Oct 20 |
| Entries where the why had to be guessed | 16 of 56, marked "(inferred)" |
| `/uireview` runs | 1, on 8 Oct at 4.47pm, on a build you rejected 5 minutes later |
| Production deploys without a review | Storyline 2 on 9 Oct, version 5 light on 12 Oct |

## What you were doing

### 8 October, the hero rebuild and the exploration

- Filed the competitive analysis and a hero brief written for a standalone `index.html` with real photos, the live
  header rebuilt as is, and a light ground.
- First build at 4.41pm, 18 minutes after the brief. Rejected at 4.52pm, "this is not like my inspiration where it
  scrolls and changes perspective on the animation on scroll".
- 3D rebuild with a moving camera at 5.07pm. Rejected at 5.09pm, "you're keeping current website UI too much".
- Reel style UI at 5.22pm. Rejected at 5.27pm, and you opened five directions, "you can change fonts, you can keep
  colors but feel free to mix and match".
- Five directions done at 5.57pm. Rejected at 6.09pm, "feels like AI slop garbage" and "Apply different tech
  stack", with an ask to copy each reel's style one to one.
- Moved to React Three Fiber and built five variants that copy one reel each, done 7.30pm. The deploy was blocked
  by the Vercel daily limit.
- 8.28pm narrowed to 2 Linija, 4 Grad and 5 Sistem. Late evening, version 2 rebuilt in a dashboard card style from a
  reference, then rejected for static cards at 11.49pm.

### 9 October, the storyboard and then your storyline

- 11.12am rejected the one pallet story, "we're not telling a story here", "like a pit stop".
- A four service storyboard, five UI references and an ask for "3 UI variants per current version 3x3 = 9 total".
  Nine combinations built by 2.18pm.
- 2.56pm, "bring back the 3 versions from before, we're going to a different storyline completely this time I'll be
  driving it".
- Your recording, Serbian voice over and Figma file became storyline 2. Built on all three versions with the real
  Linde models from your Drive, deployed to production at 6.53pm.

### 12 October, version 5, the UI pass, rounds 2 and 3

- 9.57am picked version 5, light mode with only the servis screen dark. Logos from the Drive at the Linde co-branding
  sizes.
- 10.22am to 11.26am, notes mode. You sent references, site scans and twelve scene rejections, S1 to S12, with
  "note take and not execute till I say I am done". Claude logged each one.
- A plan, then "Wait before executing ... I want the websites and their references screenshotted in the plan". The
  plan was rebuilt with 68 images, then executed with builders.
- Round 2 notes on buttons, digits, the schematic and arrows. Variant boards for buttons and section markers. The
  review board on the Design artifact.
- 3.51pm you ruled boards are shot at 1920. Then round 3 comments on the board and in chat, nine of them between
  4.03pm and 4.10pm.
- 4.10pm, "you need to stop now, let's create a plan to fix all of this I gave you 20+ comments you'll get confused".
- 4.21pm the round 3 plan with eight questions and defaults. 4.35pm "Build the plan execute everything gogogo".
- 4.58pm rejected the version 5 AT scene, "Redo this scene 100%". 5.03pm approved a new AT direction written in
  words.
- About 5.55pm the scene builders stopped mid round and were restarted. 6.31pm "ETA?", answered with 2.5 to 3.5
  hours. 6.33pm "2.5/ 3.5 is unacceptable I have usage left what can we do to rush the work?". 6.34pm "I don't want
  rushed work over quality, I just want same quality but faster execution give me tips".
- 6.36pm Grad moved to a second cloud session on `claude/awesome-faraday-lkhnn2-grad`. 6.39pm "apply the kit
  update", while three builders were still running.

## What went wrong on Claude's side

Each item gives the evidence, the cost and where the kit can catch it.

1. **A false status, twice.** [Certain] At 4.01pm Claude wrote that builder 3 had made its last output at 1.14pm and
   never committed, then "I told you twice that it was fitting Linija and Grad, and that was wrong." The status lines were written from memory of the dispatch, not from the helper's output. Catch it with a
   rule that every status line about a helper names its last report time, checked that turn.
2. **A narrow scope where you meant wide.** [Certain] Part E of the round 2 plan kept versions 2 and 4 with "no
   redraws beyond what framing needs", because your notes were marked on version 5. You answered "The illustrations
   should have been edited to be better executed I told you". The CLAUDE.md rule that the narrow reading wins did
   the damage here. Catch it with a scope matrix in every round plan that you approve.
3. **The first build missed what the reels do.** [Certain] It slid one flat side view sideways, while every reel
   changes the camera itself. The reference decode was too shallow to name the one property that mattered. Catch it
   with a decode table of the references, confirmed before the first build.
4. **AT was built twice before it was said in words.** [Certain] S10 traced Figma frame 31 one to one and was
   rejected as "taken too literally". The round 2 redo was rejected at 4.58pm. The direction written in words was
   approved in five minutes. Catch it with words first for any redraw of a rejected scene.
5. **It acted on comments while builders ran.** [Certain] Between 4.00pm and 4.09pm Claude committed changes from
   your incoming comments one by one, sections removed and a button rule changed, until you stopped it. Catch it
   with a queue rule for notes that arrive during a build.
6. **Too many screenshots for a 4 core machine.** [Certain] A 1920 frame of the 3D took about 40 seconds and the 38
   screen board about 25 minutes. Builders shot full sets at two widths. Claude only cut that back at 6.34pm, after
   you asked for speed.
7. **Live builders in the shared working tree.** [Certain] The cloud stop hook asks for a commit whenever the tree is
   dirty. It fired 4 times between 6.31pm and 6.37pm, so the visible ends of those turns read "The uncommitted files
   belong to the four builders" instead of the answer you asked for. Builder A also had to make its own clean copy of
   an old commit to get honest before shots.
8. **The task list went stale.** [Certain] ekotehnika-1, ekotehnika-2 and ekotehnika-3 still sit under In progress
   with open steps, though their directions were rejected or superseded days ago.
9. **Studio files never reached the default branch.** [Certain] CLAUDE.md says taste and task edits reach the default
   branch through a PR. Four days in, there is no PR and no `studio/clients/ekotehnika/` on the default branch.
10. **The taste log outgrew its own rule and contradicts itself.** [Certain] It is 39,727 characters against the
    8,000 limit, the longest entry is 2,614 characters, and every builder and the critic read all of it. Live entries
    still say "two outline pill buttons", "one filled linde-red pill", Geist type, "very rounded white cards" and
    "round icon buttons with an arrow", while newer rulings say sharp corners, the 2D button, Daxline Pro and no
    arrows. Only some older entries were marked SUPERSEDED.
11. **The review never ran on the real work.** [Certain] `/uireview` ran once on the first build and scored it 6.5.
    It never ran on storyline 2 or the UI pass before production. Its stale ekotehnika-1 ledger then blocked the
    round 3 review until you pasted a line, and you had to ask "what is ekotehnika 1 what am i dropping?". A ledger
    bug also refused your typed line, fixed in commit 2a9aff1 and now carried into the kit.
12. **Lessons died in compaction.** [Certain] The compaction summary says `pkill -f` killed Claude's own shell
    "again". Environment traps learned in one context window were not written anywhere durable.

## What went wrong on your side

1. **The brief described a different job.** [Certain] It asked for one standalone HTML file, real photos and no
   illustrations, the live header rebuilt as is, and a light ground. You overrode all four within two hours. The reels
   were the real brief, and they were not decoded on paper first.
2. **Direction by volume.** [Certain] "explore five directions" and "3x3 = 9 total" produced 19 built variants
   before the story was yours. CLAUDE.md already says direction gets one argued pick. Exploring in builds is the most
   expensive way to explore, and in 3D it is slower still. I disagree with doing that again, because the moment you
   drove the story, it took four hours. I'd explore in storyboard frames and words instead. The risk in your approach
   is that each built variant teaches Claude about style while the story stays unsolved.
3. **Three versions alive for four days.** [Certain] 2, 4 and 5 carried every change from 8 Oct onward. After the
   version 5 pick, versions 2 and 4 still take two builders and a second container in round 3. [Guessing] If the
   client only sees version 5, that is close to half of today's builder time.
4. **Verdicts without the fix.** [Certain] 16 of 56 entries needed Claude to guess why. "Giga bad AI slop screen",
   "Wordpress 2011 screen" and "same for footer giga bad execution" say what failed, not what good looks like. Your
   notes that carried a reference or a property landed on the first try.
5. **Comment floods during a build.** [Certain] Nine comments in seven minutes while builders ran. Your own stop at
   4.10pm was the right call, and the kit should make it for you.
6. **Pins that name a frame, not an element.** [Certain] On V4 H Claude had to ask which button you meant before it
   could act.
7. **Blanket yes on defaults that move layout.** [Certain] "Build the plan execute everything gogogo" approved Q5,
   the delivery photos in Najam. It was built, then reversed about 65 minutes later with "Remove this from here", and
   the photos moved to a new closing section. One line per layout default would have caught it.
8. **Kit work inside a live client round.** [Likely] "apply the kit update" landed with three builders running.
   Kit changes can change the rules a builder is halfway through following.
9. **No deadline given.** [Likely] The ETA came at 6.31pm. With a deadline at the start of the round, the split into
   two deploys and the second container would have been planned at 4.35pm instead of 6.34pm.

## What went wrong in the environment

- [Certain] 4 CPU cores and software WebGL. This is the ceiling on speed for 3D work in one container.
- [Certain] Vercel Hobby. Git previews of four linked projects used up the 100 deploys a day and blocked production
  (a 402). Git deploys of commits authored by Claude are refused. The workaround is a deploy from a copy with no git
  history, using the CLI and a token, and `git.deploymentEnabled` set to false for the session branch.
- [Certain] The agent proxy blocks `vercel.app`, so Claude cannot open its own preview to check it. [Guessing] Adding
  the host under Allowed domains in the environment's network settings may fix it, if the policy allows it.
- [Certain] The cloud stop hook, see item 7 above. It is the environment's hook, not the kit's.

## What worked, keep it

- Your own story, told as a recording, a voice over and Figma frames. The fastest accepted build in the session.
- Notes mode on 12 Oct, "note take and not execute till I say I am done".
- Plans with measured numbers and a default per question. Round 3 named the 1.18 to 1 button edge, the 121px per
  model step and the cause of the broken grid, and you answered in one line.
- The AT direction in words, approved in five minutes after two built rejections.
- Every ruling logged the same turn with your words and a carry forward rule.
- Claude refused to loosen the ledger check on its own and asked you first.

## Already covered by the 12 Oct kit update

So the next Claude does not rebuild these.

- **Progress line.** One status line each time a helper reports. Covers "how long until the builders are done?" and
  "where is that". It does not cover a false status, see change 5 below.
- **`/design` board at 1920** with `studio/scripts/board.mjs`. Covers your 1920 ruling and slow board delivery.
- **Preview link before ship.** A Vercel preview behind the project password, never production without your ship
  line. Ekotehnika deploys straight to production today, so decide which wins.
- **Standing yes.** "Go" approves the last plan's recommendations and nothing else.
- **Structure first** for layout asks, and **variant boards** for micro detail with `variants.mjs`.
- **`/newui`** with references, one argued direction and two stops. The gap is scroll and motion work.
- **Critic tier with caps** and a `tools` line on every helper, which lowers each helper's start cost.
- **`/mode` dropped**, the mode is picked silently.
- **The ledger fix** for a typed line stored as an object.

## Changes to make, ranked by time saved

Each change names the rule, where it goes and the evidence. Every rule text follows `studio/foundation/writing.md`.

1. **A story gate for scroll and motion work.** A new `/story` skill, or a branch of `/newui` when the job is a
   scroll site. Steps, one, decode the references (change 2). Two, write the beats as a table, each beat with its
   camera move, what the scene shows and the one thing a stranger should understand. Three, Filip records a voice
   over or marks Figma frames, or approves the table. Stop. Four, build one beat in one version and show it. Stop.
   Five, build the rest. Rule, no more than one built direction before the story is accepted. Explore happens in
   frames and words. Evidence, 8 and 9 Oct. [Likely] The largest single saving.
2. **A decode table for video references.** In step 1 of `/newui` and `/story`. Per reel, one frame per beat and a
   row each for camera, ground, type scale, chrome, rendering and the story device. Filip confirms before any build.
   Evidence, the flat pan at 4.41pm on 8 Oct.
3. **A pick freezes the losers.** A DOCTRINE trigger. When Filip picks a version, the others freeze at their last
   commit and leave every later round's scope unless he names them. Claude asks once whether the client will see
   them. Evidence, round 3.
4. **A scope matrix in every round plan.** Rows are the notes, columns are every live version and screen, each cell
   says change or keep. `/harden` checks the matrix. Default, a note on one version applies to every live version.
   Evidence, Part E of round 2.
5. **Helper status from evidence only.** Extend the progress line in DOCTRINE. Before any status line about a
   helper, read its last report time and its changed files that turn. No output in 20 minutes means stalled, said
   plainly, then restart or report. Evidence, builder 3.
6. **A queue for notes during a build.** A DOCTRINE trigger. When Filip sends design notes while builders run, Claude
   writes them to the next round's notes file, touches no running builder and no code, and replies once with the
   count. They are planned when the round lands or when Filip says go. Evidence, 4.00pm to 4.10pm on 12 Oct.
7. **One worktree per builder.** Build recipe step 2. Each builder works in its own git worktree on its own branch,
   and the main thread merges on its report. The main tree stays clean, so the stop hook stays quiet, and before
   shots come from a clean commit. Worktrees are removed when the round ends. Evidence, item 7 above.
8. **A render budget for 3D.** In `foundation/models.md`. At most two 3D builders per container. Any further heavy 3D
   slice goes to its own cloud session from the start, on a `<branch>-<slice>` branch. Interim shots are the changed
   beats only, one frame per fix, on one contact sheet. The full 1920 board is shot once, at round end. Evidence, a
   load of 18 on 4 cores and the 2.5 to 3.5 hour estimate.
9. **A deploy script.** `studio/scripts/deploy.mjs` deploys from a copy with no git history, then checks the alias
   through the Vercel API. The kit's default `vercel.json` turns off git deploys for `claude/*` branches. Evidence,
   the 402 and the refused deploys, rediscovered in this session.
10. **One session per round.** A DOCTRINE rule. A new round or task starts a fresh session that reads `tasks.md`, the
    client rules and the round plan from the repo. No handoff document is needed, so the handoff hold stays. Main
    thread at high effort, per `models.md`. Evidence, 786k tokens of context re-read on every main thread call.
    [Likely] The biggest cost lever. [Guessing] On how much it saves, I have no per call split.
11. **A rules file beside the taste log.** `/taste` rewrites `clients/<client>/rules.md` after each entry. Current
    rules only, one line each, grouped by surface (buttons, type, logo, grid, scenes, motion), each with the date of
    its entry. Builders and the critic read `rules.md`, and the log only when asked. `lint.mjs` warns when the log
    passes 8,000 characters or an entry passes 600, and lists live entries on the same surface as a newer one.
    Evidence, item 10 above.
12. **Studio files reach the default branch every day.** A studio only PR at the end of each working day, opened when
    Filip says so. Evidence, item 9 above.
13. **Superseded tasks close.** In the tasks trigger. When `/taste` marks a direction REJECTED or SUPERSEDED, its task
    moves to Done with "superseded by ekotehnika-N" in the same turn. Evidence, ekotehnika-1 to ekotehnika-3.
14. **Feed the misses to the review.** Add these to `.state/review-misses.md` and to "Rejected on sight" in
    `foundation/principles.md`, since none of them is specific to Ekotehnika. A centred stack of title, box and equal
    icon cards. A third of the frame left empty. A text block that sits on no grid line. A feathered fade between a
    scene and its text. A boxed logo. Arrow glyphs on rows and buttons. A storyboard frame traced one to one. Objects
    out of true scale. Automation drawn as a route diagram. Also, a ledger older than the code it reviewed closes by
    itself instead of blocking, and the decision card never asks Filip to paste a task key he has to look up.
15. **Words first after a rejection.** In the regression or scope section of CLAUDE.md. Any redraw of a rejected
    scene or section is proposed in words with one reference and built only after Filip's yes. Evidence, AT.
16. **An environment notes file.** `studio/foundation/env.md`, read once per session before shots or deploys. Never
    `pkill`, use `fuser -k <port>/tcp`. WebGL shots wait 9000 to 13000ms with the swiftshader flags. The proxy blocks
    `vercel.app`. The Vercel Hobby limits and the deploy script. Evidence, item 12 above.

## Habits for you that buy speed

- Drive the story first, a two minute voice over and a few Figma frames.
- Give one reference or one property with each verdict, "too centred, like ref 2 instead".
- Pin the element and name it.
- Batch your comments into one round, or say "queue these" while builders run.
- Answer layout defaults by number instead of "execute everything".
- Decide early which versions the client will see.
- Keep kit maintenance out of a live client round.
- Say the deadline when a round starts.

## Questions for you

1. Will Ekotehnika see versions 2 and 4, or only version 5?
2. Keep production deploys for Ekotehnika, or move to the PR #9 preview behind a password?
3. A studio only PR every day, or one when the concept ends?
4. A second cloud session for each heavy 3D slice by default, knowing each one is its own container?
5. Change the Widths line in the Ekotehnika README to 1920 and 1440, since you judge at 1920?

## Evidence and what was not read

- Read in full from the session branch. `tasks.md`, `taste.md`, `taste-archive.md`, `README.md`, `round3.md` and the
  three round 3 progress notes. Read in part. The hero brief, the storyline 2 plan and the ekotehnika-1 ledger. All
  157 commit subjects, and the bodies of the checkpoint and deploy commits.
- Read from the 12 Oct kit update. The diffs of `CLAUDE.md`, `DOCTRINE.md`, `.claude/settings.json` and
  `foundation/models.md`, and the `newui`, `design`, `taste`, `critic` and `build` files.
- Read from the transcript. The auto compaction summary at 2.30pm on 12 Oct, which lists every message you sent from
  the evening of 9 Oct to 2.30pm on 12 Oct. Your messages and Claude's turn end replies from 3.50pm to 4.37pm and from
  6.31pm to 6.39pm on 12 Oct, and Claude's main thread text at 6.31pm and 6.34pm. Session cost and token figures from
  the session record and two turn results.
- Not read. The raw transcript of 8 and 9 Oct, and 4.37pm to 6.31pm on 12 Oct. Your words for those spans come from
  the taste log quotes and the commit messages. Builder and tool output inside the transcript pages was filtered out
  by script and not read. Why the scene builders stopped at about 5.55pm is not known.
- The taste log's times run about an hour off the commit times, so this review uses commit times.
