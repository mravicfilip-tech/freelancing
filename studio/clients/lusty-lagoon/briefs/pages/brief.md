# Brief, the rest of the dashboard, lusty-lagoon-4

Filip, 2026-10-20. "Create the rest of the pages needed for this dashboard, withdraw, deposit, all from
my Figma screens reimagined and better UX with the new UI, remaining screens that are missing for
settings, category pages etc." Run in its own session, per the doctrine's one session per round.

## Where it starts

- The dashboard direction is picked, variant 1, Neon arcade (`src/features/variants/v1`, taste entry
  of 2026-10-20 11:24). Every page in this task uses its shell (top bar, sidebar, chat rail), its
  surfaces, type, keys, the sheen hover, the icon style and the styled scrollbars.
- Round 8 left three open choices on `/variants/1`, the hero, the category cards and the phone shell
  (`?hero`, `?cards`, `?m`, listed in `src/features/variants/variants.ts`). The phone shell choice
  decides how every page looks on a phone. Ask Filip for his M1, M2 or M3 pick before building any
  page's phone layout, and build desktop meanwhile.
- The current routes (`/wallet/deposit`, `/wallet/withdraw`, `/account`, `/notifications`, `/agent`,
  `/refer`, `/faq`, `/lobby`) are the Figma 1 to 1 build in the old shell (`src/components/shell`).
  Their flows, data, states and deep links work and stay the behaviour to keep (`README.md`, Run). The
  wallet flow has e2e coverage worth keeping green.

## What the job covers

- Every Figma screen in the Pro team copy (`README.md`, Reference), reimagined in the Neon arcade UI
  with better UX, not traced. Wallet in its 8 states across Deposit, Withdraw and Gift card, Tip, Gift
  cards, Notifications, Refer a friend, Send to agent, Account settings in its 4 states.
- The screens the Figma lacks that a casino dashboard needs. A starting list to argue with Filip,
  category pages (Slots, Megaways, Hold and win, Fish, New, Live), search results, a game page or
  launch view, rewards and the VIP rank road, the Daily chest, the Hot streak giveaway and the weekly
  race as pages, transaction history, settings beyond the four account states (security, limits and
  responsible play, preferences), help.
- Every state on every page, empty, loading, error, long text and no access.
- Desktop at 1440, 1920 and 2560 and the phone at 375 and 425, per the Widths line.

## Gate

No brief answers the kickoff questions, so the kickoff gate in `CLAUDE.md` runs once, in one message,
before any code. Proposed defaults. Scope, every screen above in the v1 shell, routes moved off the old
shell. Reference, the Figma copy for content and flow, variant 1 for the look. Baseline, the pushed
commit this session starts from. Output, the prototype in this repo, reviewed on Filip's localhost
while Vercel previews stay on hold. Done, `/uireview` shows no open sev 1 at all five widths.

The page list goes to Filip as a list with a one line purpose each, so he can strike or add before the
build starts.
