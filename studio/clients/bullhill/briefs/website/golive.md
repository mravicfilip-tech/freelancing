# BullHill go-live plan, bullhill-16

Written 20 October 2026. Waits for Filip's go. Nothing reaches bullhill.co until he says deploy.

## Baseline

- Code baseline 9932467 on claude/hopeful-maxwell-bwuy3c. Its code is production 845348c plus the client's
  answers in dd123c2 (Höhenfeld, 6 towns, the VAT number), content.ts only.
- The home page must look and move exactly as 9932467 does at 390 and 1440, English and German. Shots
  before and after with shoot.mjs. The only change a visitor can see on the home page is that the two
  footer links and the form now do something.

## What the environment can do today

- The Cloudflare token verifies and reaches Cloudflare Pages for the account. It lists no zones, no
  registrar, no Workers and no Email Routing. So it can create the Pages project and upload builds, and
  it cannot see bullhill.co, its DNS or its mail.
- The agent proxy blocks pages.dev and gets no answer from bullhill.co. Deployments are checked through
  the Pages API and Filip clicks the link.
- The doctrine's preview hold covers "any other preview deploy", so a pages.dev preview needs Filip to
  lift the hold for it in his own words.

## 1. Public build, switches off

- A new script `npm run build:public` builds with Vite mode `public`. `npm run dev`, `npm run live` and
  `npm run build` stay as they are, so localhost and the Vercel project keep every switch for review.
- In the public build only `?lang=de` is read. Ignored there are `?v`, the keys 1 2 3, `?hero`, `?btn`,
  `?slab`, `?lab`, `?blk`, `?svc`, `?svct`, `?still`, `?seam`, `?dust`, `?t`, `?p`, `?flip`, `?glfail`,
  `?h7dbg`, `?form` and `?motion`. Reduced motion and the automatic phone checks still work.
- The root opens Foundry with hero 7, the slab arrow cell and service art 3. It already does when no
  `?v` is given, the change is that nothing else can be opened.
- Daylight and Underground leave the public bundle, since only Foundry is imported there.
- Every URL read is edited one by one in its own file, about 15 places, listed before the edit. No sweep.
- The block colour pick in bullhill-1 is still open. The public build ships 1, the text's own colour,
  unless Filip picks before launch.

## 2. Contact form, real delivery to bullhilldoo@gmail.com

Recommended route, Cloudflare only, free.

- The form posts to `/api/contact`, a Pages Function in the same project. It checks the required fields,
  the email shape, field lengths, a hidden honeypot field and a minimum of 3 seconds on the page.
- It hands the message over a service binding to a small Worker, `bullhill-contact`, whose send_email
  binding may send to bullhilldoo@gmail.com and no other address.
- The mail comes from `BullHill website <form@bullhill.co>` with Reply-To set to the visitor, so BullHill
  answers with one click. Subject `Website enquiry, <name>, <role>`, plain text, every field, and the
  page language so they know which language to answer in.
- The success state shows only after Cloudflare accepts the mail. A failure shows the existing error
  line, which already points to the phone.
- Nothing is stored. No database, no log of the message body.
- `npm run dev` keeps today's fake success, since the Function does not run under Vite. The real send is
  tested on the pages.dev preview.
- Turnstile is left out at launch. It goes in if spam arrives.

What this needs from outside the repo.

- The token widened, same token so the environment value stays. Zone bullhill.co with Zone Read, DNS
  Edit and Email Routing Rules Edit. Account with Workers Scripts Edit and Email Routing Addresses Edit.
- Email Routing switched on for bullhill.co, which adds its MX and SPF records. I do this once the token
  reaches the zone.
- bullhilldoo@gmail.com verified as a destination. Cloudflare mails a link to that inbox and someone with
  access clicks it. This is the long pole.
- One real test enquiry from the preview, named "TEST from Filip, please ignore", into the client's inbox.

Fallback if the verification click stalls or the free plan refuses the send. Resend's free tier, 3,000
mails a month. Filip opens the account, the key goes into the environment and never into chat, and the
privacy page names Resend as a second processor.

## 3. Legal notice and privacy, English and German

- Two light pages, `/legal` and `/privacy`. The language follows the site's switch, `?lang=de`, and
  `/impressum` and `/datenschutz` open the German versions.
- Built as their own small Vite pages, no 3D and no motion, so they load fast. Black ground, the Foundry
  header with the full logo and the language switch, a back link to the home page, body on the base
  layout type scale, the closing's base row at the foot.
- The footer links Legal notice and Privacy point there, and the consent line under the form links to
  Privacy. No other change to the home page.

Legal notice content, for the Austrian E-Commerce Act section 5, the Austrian Media Act section 25 and
the German Digital Services Act section 5.

- On file. BullHill d.o.o., Kidričeva ulica 24, 3000 Celje, Slovenia, the phone, bullhilldoo@gmail.com,
  VAT ID SI77173686, the business, fibre trenching and duct laying.
- Missing, and required. The exact registered company name as the Slovenian register (AJPES) holds it,
  the registration number (matična številka) with the register, and the managing director's name. A
  web search by the VAT ID found none of these.
- No EU online dispute link, the platform closed in July 2025.

Privacy content, under the GDPR.

- Controller BullHill d.o.o. and its contact.
- The form, what it collects, why (answering the request, Art. 6(1)(b)), how long it is kept, and who
  handles it on the way (Cloudflare for hosting and mail delivery, Google as the inbox provider).
- Server logs at Cloudflare, no cookies, no analytics, no tracking, fonts served from the site itself,
  the WhatsApp link leaves the site.
- The visitor's rights and the Slovenian Information Commissioner as the authority, plus the right to
  complain where they live.
- No cookie banner. The site sets no cookies and writes nothing to browser storage.
- The text is drafted to the usual structure. The client confirms it, and a lawyer reads it if the client
  wants certainty, since a gap in a German Impressum is a common reason for a warning letter.

## 4. Cloudflare Pages project

- Project `bullhill-site`, the name the registry already holds for BullHill, so the deploy guard reads
  the right client.
- Direct upload with wrangler from `bullhill-site/`, from a `build:public` build. Never connected to git,
  so a push builds nothing, the same rule as Vercel.
- Review builds go to a preview branch alias, never to the production branch. pages.dev answers with
  `X-Robots-Tag noindex` through `_headers`, so the preview is never indexed.
- pages.dev previews are public, there is no password on the free plan without Cloudflare Access.
- Launch hygiene in the public build. A canonical link to bullhill.co, robots.txt, sitemap.xml, and
  www.bullhill.co answering with a 301 to bullhill.co from a small middleware.
- A deploy note for Cloudflare in `foundation/env.md` and the Run section of the client README.

## 5. Checks before the review link

- `npm run build:public` and the typecheck pass.
- The root with `?v=2&hero=6&btn=1` opens Foundry with hero 7. The bundle holds no Daylight or Underground.
- Shots of the home page before and after at 390 and 1440, English and German, with the interaction pass.
- Shots of both legal pages at 390 and 1440 in both languages.
- Every form state, empty, errors, sending, sent, failed.
- baselint on the diff, then /uireview on the legal pages and the form states. Done is no open sev 1.

## 6. Review, then deploy

- The review link is the preview alias on pages.dev, sent with its commit hash. One real test enquiry.
- On Filip's deploy line for that commit. The same build goes to the production branch, bullhill.co and
  www.bullhill.co are added as custom domains, DNS and TLS are checked through the API, then Filip opens
  bullhill.co.

## 7. Filip's steps outside the repo

- Widen the Cloudflare token as in step 2.
- Registrant on bullhill.co to BullHill d.o.o. and auto-renew on, in Cloudflare Registrar. The token
  cannot see the registrar.
- Ask the client for the three Impressum facts and the verification click.

## After launch

- bullhill-site.vercel.app keeps the old build with every switch open, Daylight and Underground public.
  It stays until Filip decides, since any Vercel change sits under the hold. Retiring it soon after
  launch avoids a public duplicate of the site.
- info@bullhill.co forwarding to the Gmail inbox becomes a one rule job once Email Routing is on. Not in
  scope unless Filip asks.
