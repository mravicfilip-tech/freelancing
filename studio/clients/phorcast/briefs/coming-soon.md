# Phorcast coming soon page, plan and content

Status. Draft for Filip's yes. Nothing built. Written 13 October 2026 from the Phorcast repo at
commit `932bbf5` and the live landing page it builds.

The ask, from Filip. Answer fast what Phorcast is, with information and illustration blocks.
Professional. Engaging. Show how Phorcast helps and what the benefits are. Conversion driven. An
email sign up form.

## What Phorcast is, from the repo

- A prediction market for real-world events. You take a YES or NO position on a question.
- Prices run from 1¢ to 99¢ and read as the market's probability. A winning contract pays $1.
- Your maximum loss is what you stake. No leverage, no liquidations. You can sell before the
  result.
- Markets across crypto, stocks, indices, commodities, forex and sports, from 5 minutes to monthly
  (FAQ 2). The Fan band and the art add elections, geopolitics and tech.
- Sign up with an email, a social login or a wallet. Crypto deposits. Settlement on-chain.

## The current landing page, judged for this job

What carries over
- A finished design system in both themes, the 3D mark with its fallback, the Fan category band
  and the FAQ accordion. All of it is reusable as it stands.
- The client already moved the language from trading to forecasting.

What does not carry over
- 11 buttons. Ten point nowhere and one jumps to Steps. A coming soon page converts on one action.
- A four slide auto-rotating hero splits the first screen across markets, sports, a bonus and a
  token.
- Five claims contradict the FAQ. On a sign up page each one turns into a promise to the list.
- Numbers that look live but are not, "$9.3M Vol" in the phone mock-up and a bonus countdown
  that ticks from a fixed start.
- No backend, no analytics and no privacy policy link. The form needs all three.

## Claims, what goes on the page

| Claim | Where it is today | On the coming soon page |
|---|---|---|
| YES or NO, price reads as probability, $1 per winning contract | FAQ 1, About primer | Yes |
| Maximum loss is the stake, no leverage, no liquidations | FAQ 1, About | Yes |
| Sell before the result | About primer | Yes |
| Sign up with an email or a wallet | Pillars, Steps, FAQ 3 | Yes |
| On-chain settlement | Pillars, meta description | Yes |
| Crypto, stocks, indices, commodities, forex, sports | FAQ 2 | Yes |
| Elections, geopolitics, tech | Fan band, Familiar art | Only if the client confirms them for launch |
| 0.05% fee | Pillars | Only if confirmed. Otherwise "one clear fee" with no number |
| No KYC | Bento A, Steps 1, About | No. Conflicts with card payments and FAQ 3 |
| Instant withdrawals | Pillars | No. FAQ 6 says up to 24 hours |
| First forecast in 60 seconds | Bento A | No. FAQ 4 says under two minutes |
| Self-custody, "Your Funds Stay Yours" | Bento B, Built, meta | No. The FAQ deposit flow reads custodial |
| Phorcast token | Hero slide 4 | No. FAQ 7 says no date and no details |
| 100% deposit match up to $200 | Hero slide 3, Bento C | No, unless the client confirms it for early access with terms |

## The direction, one pick

Updated 13 October 2026 after Filip's ruling. The value proposition leads the hero, a guided tour
follows, and the form comes after the tour. The first version, with the form in the hero, is
logged as rejected inside that ruling in `taste.md`.

Page structure, top to bottom
1. Slim bar. Logo left. Theme toggle and an outline "Get Early Access" button on the right, which
   focuses the form after the tour. It is the one shortcut for a visitor who is already sold.
2. Hero. The value proposition, front and facing. Title, lede, three value points and a "See How
   It Works" button into the tour. The 3D mark on the right.
3. How it works, the tour. One market card carried through three beats, Pick a Question, Choose
   YES or NO, Get $1 If You're Right. Built on the Steps band's cards and panel frame. Plays every
   6 seconds with a pause control. A tap on YES or NO pauses it and shows that side's payout.
4. Early access. The red panel with the form, the privacy note and the social links.
5. Why Phorcast. Six benefit blocks, three by two.
6. Markets. The existing Fan band.
7. FAQ. Four questions in the existing accordion.
8. Footer. Strapline, socials, Privacy Policy, Terms, the disclaimer.

What it refuses
- No carousel. One headline, not four.
- No countdown without a real launch date.
- No bonus, token, KYC, custody or speed claims, per the table above.
- No fake volumes or live-looking prices. The demo card is labelled as an example.
- No waitlist counter unless it reads a real number.
- No link to a page that does not exist yet.

Why this one
- Prediction markets are still unfamiliar to most visitors, so the page has to teach. The teaching
  sits under a first screen that already holds the form, so a visitor who gets it at once can
  sign up without scrolling.
- The tap-to-try card turns the hardest idea, price as probability and a $1 payout, into one
  tap. It is the only motion on the page that teaches something.
- Reusing the repo's tokens, mark, Fan band and FAQ keeps the brand exact and limits the build to
  the new parts.

## References

| Product | What it does best | What to borrow |
|---|---|---|
| Kalshi homepage | Explains event contracts with one market card and its YES price | The example card with price shown as probability |
| Polymarket market cards | Probability is the headline number on every card | A percent beside each price on the demo card |
| Robinhood's 2013 waitlist | One field, then "move up the line by sharing" after sign up | The single field. The referral step is phase 2, it needs a backend |
| Linear and Arc launch pages | One message per screen, quiet motion, the product as the art | Section rhythm and restraint |

Refuse from them. Leaderboards, live tickers and trending lists, since nothing is live yet.

## Build plan

Where. In the Phorcast repo, not the freelancing repo. The tokens, fonts, 3D mark, Fan band and
FAQ live there, and a copy in freelancing would become a second design system that drifts. The
studio side, this brief, the tasks and the taste log, stays in `studio/clients/phorcast`.

Steps
1. A new `ComingSoon` page. A build flag, `VITE_SITE=soon`, makes "/" render it. At launch one flag
   brings the full landing back, and nothing gets deleted.
2. Reused unchanged. Tokens, buttons, `HeroLogo`, `LiveDot`, `Icon`, `Fan` and the motion helpers.
3. Reused with one new prop. `Faq` takes its items, `Footer` takes a shorter link list.
4. New. `EmailForm` with every state, `HowItWorks` with the demo card, `Benefits`, the
   `EarlyAccess` panel, and a Vercel function `api/subscribe` that adds the email to the client's
   list tool. The API key stays on the server.
5. Bots. A hidden honeypot field and a per-IP limit in the function. No captcha.
6. Double opt-in through the list tool, so the list stays clean and holds up for EU visitors.
7. Analytics. Vercel Web Analytics, cookieless, with one event on a confirmed sign up, so
   conversion is a number and not a feeling.
8. Meta. Tab title, description and a share image, since most visits will come from X, TikTok,
   Discord and Telegram links.
9. Self-check, shots at the agreed widths, baselint, `/uireview`, then a password-protected Vercel
   preview link to Filip. The repo's `deploy.sh` ships to production, so the preview goes out as
   a plain preview deployment. Production only after Filip's ship line for that link.

Form states

| State | What shows |
|---|---|
| Empty | Field "Your email address", button "Get Early Access" |
| Invalid | "Enter a valid email address, like name@example.com." under the field, in the error colour |
| Sending | Button reads "Joining…", field locked |
| Success | The form is replaced by "You're on the list." and, only when the list tool sends a confirmation email, "Check your inbox to confirm your email." Otherwise "We'll email you before launch." Then Discord and Telegram links |
| Already on the list | "You're already on the list. We'll email you before launch." |
| Server error | "Something went wrong on our side. Try again in a moment." The field keeps the address |
| Too many tries | "Too many tries. Wait a minute and try again." |
| Long address | A 60 character address stays inside the field, no layout shift |
| No JavaScript | The form still posts to the function and lands on a plain thank-you page |

## Content

Every heading uses the site's Title Case. Eyebrows stay uppercase. No em dashes.

### Hero

- Eyebrow. COMING SOON, with the live dot
- Title. Forecast What Happens Next.
- Lede. Phorcast is a prediction market for real-world events. Take a YES or NO position on what
  happens next, from where Bitcoin closes today to who lifts the trophy this season.
- Value point 1. $1 Per Winning Contract. Know your payout before you take a position.
- Value point 2. Max Loss Is Your Stake. No leverage, no liquidations, no margin calls.
- Value point 3. Settled On-Chain. Every result can be checked.
- Button. See How It Works

### How it works, the tour

- Eyebrow. HOW IT WORKS
- Title. One Question. Two Sides. A Clear Payout.
- Beat 1, Pick a Question. Will Bitcoin close higher today? Who lifts the trophy this season?
  Choose a market you have a view on. The panel shows the Bitcoin card coming forward from a
  stack with a Sport and a Finance market behind it.
- Beat 2, Choose YES or NO. Prices run from 1¢ to 99¢ and read as odds. YES at 62¢ means the
  market gives it a 62% chance. The card shows YES 62¢ and NO 38¢, an odds bar, and "The market
  gives YES a 62% chance. Tap a side."
- Beat 3, Get $1 If You're Right. Every winning contract pays $1. Or sell before the result to
  lock in a profit or cut a loss. The card shows "100 YES at 62¢, cost $62", "If YES wins, you
  get $100" and "If it doesn't, you lose $62, never more". With NO picked, 100 NO at 38¢, cost
  $38.
- Card labels. "Example market" in the corner, and "Example only, before fees. No real money."
  under the payout.

### Why Phorcast

- Eyebrow. WHY PHORCAST
- Title. Built Around Your Control. The client's own words from the Bento line.
- Know Your Risk Up Front. Your maximum loss is what you stake. No leverage, no liquidations, no
  margin calls.
- Prices That Mean Something. Every price is the market's live probability, so you see where the
  world stands at a glance.
- Every Outcome in One Place. Crypto, stocks, indices, commodities, forex and sports, from
  5-minute to monthly markets.
- Out Whenever You Want. Hold to the result or sell early. You decide when your position ends.
- Settled On-Chain. Outcomes settle transparently on-chain, so every result can be checked.
- Start With an Email or Wallet. Sign up with an email address or connect a wallet, and go
  straight to the markets.

If the client confirms the fee, "Low, Transparent Fees. One 0.05% fee when you take a position.
No hidden costs." replaces the last block.

### Markets

- Title. Where Every Outcome Connects. Kept from the Fan band.
- Line. Prediction markets across sports, finance, crypto, elections, technology and geopolitics,
  all in one place at launch.

The live line starts with "Explore", which a coming soon visitor cannot do yet. If elections,
geopolitics or tech do not launch first, their pills and words come out.

### Early access

- Eyebrow. EARLY ACCESS
- Title. Be First In When Phorcast Opens.
- Line. Join the list and we'll email you the moment your account is ready. Launch news only,
  nothing else.
- Form. Same as the hero.
- Social line. Or follow along on Discord, Telegram, X and TikTok.
- Perk line, only if the client confirms one. Early access members get [perk] at launch.

### FAQ

1. What is Phorcast? Phorcast is a prediction market for real-world events. You take a YES or NO
   position on what happens next, and each winning contract pays $1. No leverage, no
   liquidations. Your maximum loss is always what you stake.
2. When does Phorcast launch? Soon, or the client's date. Everyone on the early access list gets
   an invite before the public launch.
3. What do I get for joining the list? An invite before public launch and launch news by email.
   We never sell or share your email, and you can unsubscribe in one click.
4. How will I sign up when it opens? With an email address, a social login or a crypto wallet.
   Your invite email takes you straight there.
5. Optional, once the client answers. Where is Phorcast available? Countries and minimum age.

### Footer

- Strapline. Trade the outcome, not the asset. The client's own words, kept as supplied.
- Links. Privacy Policy, Terms of Service.
- Socials. X, TikTok, Discord, Telegram. The live URLs are already in `src/lib/sitemap.ts`.
- Disclaimer. Information on this site does not constitute investment advice.
- Copyright. © 2026 Phorcast. All rights reserved.

### Meta

- Tab title. Phorcast | Prediction Markets, Coming Soon
- Description. Phorcast is a prediction market for real-world events. Choose YES or NO on crypto,
  stocks, sports and more. Join the list for early access.
- Share image. The 3D mark on the dark ground with "Forecast What Happens Next." and "Coming soon".

## Questions before the build

Kickoff, each with its default
1. Scope. A new coming soon page. The live landing page code stays untouched. Default yes.
2. Reference. The live Phorcast site and its Figma file. Default yes, no outside reference.
3. Baseline. Phorcast `main` at `932bbf5`. The live site must not regress. Default yes.
4. Output. Built in the Phorcast repo behind the build flag, password preview on Vercel. Default
   yes, not in the freelancing repo.
5. Done. `/uireview` with no open sev 1, the preview live, and one test sign up confirmed in the
   client's list.

Client answers, needed before launch and not before the build
6. Which email tool holds the list. Default Loops, unless the client already uses one.
7. Privacy Policy and Terms URLs. A launch blocker, the form cannot go live without a privacy link.
8. Which markets launch first, and whether the 0.05% fee is final. Default both stay off the page.
9. Any early access perk. Default none, early access only.
10. A launch date. Default no date and no countdown.
11. Countries and minimum age. Default FAQ 5 stays hidden.
12. Whether the page replaces phorcast-markets.vercel.app or goes on a new domain. Default it
    replaces "/" there through the flag.
13. Phone width. Default 1440 and 390, since TikTok, X and Telegram traffic is mostly phones.
14. The deadline.
