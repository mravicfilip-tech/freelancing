# The shop, kickoff

Filip, 18 November 2026. "We need to start working on the shop, the shop will be basic with just leading to contact form, we need to show
categories from their google drive that they gave us and use those products, start working on styling everything." "The ekotehnika scroll
through page is just the homepage which will lead to the shop."

Status. Kickoff questions sent, answers pending. Nothing built.

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
