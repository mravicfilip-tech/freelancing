# The shop, kickoff

Filip, 18 November 2026. "We need to start working on the shop, the shop will be basic with just leading to contact form, we need to show
categories from their google drive that they gave us and use those products, start working on styling everything." "The ekotehnika scroll
through page is just the homepage which will lead to the shop."

Status. Filip answered the kickoff on 18 November, "yes, go with defaults", to the hardened questions. The answers are below and bind
the build. Nothing is built yet.

## The answers, binding

1. Pages. Four kinds, no prices, no cart. Prodavnica with the 10 categories, a category page, a model page, and Kontakt, the form with the
   model filled in. Posetite prodavnicu, Pogledajte modele, the seven product cards of Proizvodi, and Novi and Kontakt in the menu point into
   it. Polovni, Najam and Servis in the menu stay on ekotehnika.rs.
2. Products. All 89 series, one product each, the category names in the table below. A series with no cut out render shows its best photo.
3. Text and specs. Each series is matched by hand to its ekotehnika.rs model page, and the Serbian description, nosivost and visina
   podizanja come from there. Every model offers its English PDF as a download. A series with no match shows its name, category, pictures and
   the PDF, and no numbers. The list of series with no match goes to Filip before the build.
4. Rental and used. New trucks only. Each model has a second button, Pitajte za najam, to the same form. The old site's list of 84 rental
   trucks is not rebuilt for now. Polovni stays on ekotehnika.rs.
5. The form. Ime, Prezime, Firma, Telefon, Email, Interesuje vas (Kupovina, Najam, Servis), Model, Poruka, a consent box and a link to the
   privacy text. Kupovina and Najam go to info@ekotehnika.rs, Servis to servis@ekotehnika.rs, through a server function and Resend unless
   Filip names another service. Until the key arrives the form says plainly that it is a test and gives the address to write to instead.
   Open, who writes the privacy text, Filip to name.
6. Look. The homepage's language without the scroll story, the white ground, the grid lines, Daxline, the red button with its black plus
   cell, the same header and footer, big type. One direction in words with one reference first, then the model page first at 1440 and 390.
7. Baseline. Production today, bfa30ca0 on claude/awesome-faraday-lkhnn2 and 02aed4b on mravicfilip-tech/ekotehnika. The homepage changes
   only in its links into the shop.
8. Done. /uireview with no open sev 1 and a preview link Filip has opened. Open, the deadline, Filip to name.

## For the next session

- Start with the hand match of the 89 series to the ekotehnika.rs model pages and send Filip the list with no match, then the direction in
  words. Neither needs code.
- The session scratchpad of 4 to 5 November is gone, the deploy copy and its preview script with it. Rebuild them from the rules in
  `studio/foundation/env.md`, Vercel Hobby, before the first preview.

## What the Drive holds

From `briefs/drive/index.tsv`, folder `VILJUSKARI PO VRSTI I MODELIMA`. 89 series in 10 categories, one product per series folder. Four generic
folders (Automation Software, Electric Counterbalance Trucks, Reach Trucks, Very Narrow Aisle Trucks) and the range photos of `PHOTOSHOOT SVI
MODELI` are not products. The Serbian names are the old site's own words for each type.

| Drive folder | Proposed Serbian name | Series |
|---|---|---|
| E - ELEKTRO ČEONI VILJUŠKARI | Električni čeoni viljuškari | 14 |
| IC - DIZEL I PLINSKI ČEONI VILJUŠKARI | Dizel i plinski čeoni viljuškari | 4 |
| HEAVY TRUCKS | Viljuškari velike nosivosti | 3 |
| REACH TRUCKS | Regalni viljuškari | 5 |
| ORDER PICKER | Viljuškari za komisioniranje | 7 |
| PALLET STACKER | Slagači paleta | 17 |
| PALLET TRUCK | Niskopodizna vozila | 13 |
| TOW TRACTORS | Tegljači | 13 |
| VNA Very Narrow Aisle Trucks | Viljuškari za uske prolaze | 2 |
| AUTOMATED TRUCKS | Automatizovana vozila | 11 |

- Each series has official Linde cut out renders, 2400 by 2400 PNG on a transparent ground, application photos, and mostly an English data
  sheet, `DS_..._en_..._view.pdf`. About 16 series have a 36 frame turntable (`_WEB_00000` to `_00035`).
- About 10 series have no cut out render at all (E10, E16 to E20 1275, E25S, H50 to H80, D12 RW, L14 to L16 RW, T20 to T25 RW, T33 R HP, P180,
  R20 to R25 F, L03 EX). They have photos only, or almost nothing.
- No Serbian product text and no spec table are in the Drive. The old site ekotehnika.rs has both for its 96 new trucks, Serbian copy,
  nosivost in kg and visina podizanja in mm per model, captured in `briefs/hero-rebuild/screenshots/06` and `07`.
- Every file downloads straight from its share link, `https://drive.google.com/uc?export=download&id=<id>`, checked 18 November. The Drive
  connector itself failed to connect that day.

## The old site's shop, for reference

New trucks (96) and rental trucks (84) as two tabs, filters by application, drive, type, capacity, lift height and explosion protection,
cards with capacity and lift height. A model page has Zatraži ponudu, Iznajmi ovaj viljuškar, a spec PDF, a description, features in an
accordion, a spec table, options and related models. Kontakt has Ime, Prezime, Firma, Interesuje Vas, Telefon, Email, Vaša poruka.
