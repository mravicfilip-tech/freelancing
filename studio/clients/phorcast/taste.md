# Taste log, phorcast

Newest entry at the top. `/taste` writes here the turn Filip picks or rejects a look. The
`/uireview` critic and every builder read this whole file before judging or building, so each
entry is a rule. Entries marked SUPERSEDED are not rules and move to `taste-archive.md` once this
file passes 8,000 characters.

Entry format.

```
- **YYYY-MM-DD HH:MM, <thing>, <what happened>.** ACCEPTED | REJECTED. Said: "<Filip's words, under 20 words>". Why: <the reason>. Carry forward: <the rule a builder follows next time>.
```

- **2026-10-13 12:45, review widths, 1920 replaces 1440.** ACCEPTED. Said: "not 1440 but 1920 and go". Why: the Phorcast site is designed and judged at 1920, the Figma width (inferred). Carry forward: shots and `/uireview` for Phorcast run at 1920 and 390, never 1440 as the desktop width.
- **2026-10-13 12:45, coming soon page direction, one message and one action.** ACCEPTED (not yet built). Said: "go". Why: the visitor has to understand an unfamiliar product fast and has one thing to do, so every section explains, proves or asks for the email again (inferred). Rejected inside it, the landing page's four-slide hero carousel, the bonus countdown, the "$9.3M Vol" style live-looking numbers and the No KYC, instant withdrawal, 60 seconds, self-custody and token claims. Carry forward: a Phorcast pre-launch page has exactly one action, the email form, no carousel, no countdown without a real date, no number presented as live, and only claims the FAQ backs.
