# Go-live plan, bullhill-16

Written 20 October 2026. Filip said go the same day, steps 1 to 4 built, 5 to 7 wait on the open questions. Baseline is a7fab6e on claude/hopeful-maxwell-bwuy3c,
the build at production 845348c plus the go-live facts. Nothing reaches bullhill.co until Filip says deploy.

## What the probe found

- The Cloudflare token is valid and scoped to Pages only. It lists no Pages projects yet.
- The token cannot see the bullhill.co zone, Email Routing or the registrar. So the custom domain,
  any DNS record and the registrant change need Filip in the dashboard, or a wider token.
- npm and pages.dev answer from the container, so wrangler can build and upload from here.
- The form fakes success after 800ms. The legal and privacy links point at #top.
- main.tsx still bundles Daylight and Underground and listens for keys 1, 2 and 3.
- Foundry reads 14 URL switches, hero, btn, slab, lab, blk, svc, svct, cam, glfail, h7dbg, flip, t, p and form.
- Fonts are self hosted, no analytics, no cookies, no localStorage. The only outside link is wa.me.
- public is 43MB, largest file under 25MB, inside the Pages free limits.

## Steps once Filip says go

1. Public build. `vite build --mode public` sets one flag. Under it main.tsx renders Foundry only,
   the other two pathways are not bundled, the key listener is gone, and every switch returns its
   default. `npm run dev` keeps every switch for review.
2. Contact form. A Pages Function at /api/contact checks the fields again, drops bots through a
   hidden field and a minimum fill time, and sends through Resend from noreply@bullhill.co to
   bullhilldoo@gmail.com, reply-to the sender. The form shows its real success and error states.
3. Legal notice and privacy as /legal and /privacy, German through ?lang=de like the page,
   same header and footer. Footer links point at them.
4. Launch basics. Title and description per language, canonical bullhill.co, robots.txt,
   sitemap.xml, a 404 page, `_headers` with long cache on hashed assets and basic security headers.
5. Pages project bullhill-site, so the registry and the deploy guard match. Upload with
   `wrangler pages deploy` to a preview branch only, and send Filip the pages.dev link.
6. Test the form end to end on the preview, to Filip's address first.
7. On Filip's deploy, a production upload, then he adds bullhill.co as the custom domain.

## Filip's hands

- A Resend account, bullhill.co added there, its DNS records added through Resend's Cloudflare connect,
  and the API key set as a Pages secret RESEND_API_KEY. Never pasted into chat.
- The custom domain bullhill.co and www on the Pages project, at deploy time.
- The registrant contact set to BullHill d.o.o. and auto-renew on.

## Open questions

1. The legal notice is missing the share capital and the register court, which the Slovenian
   companies act asks for on a company website. The register number is still unconfirmed by the client.
2. Does BullHill hold an Austrian or German trade licence or chamber membership? The Impressum
   names it if so.
3. The old bullhill-site.vercel.app. Redirect it to bullhill.co, or leave it up.
4. A preview on pages.dev is public to anyone with the link. Fine, or put it behind Cloudflare Access.
5. A deadline for the launch.
