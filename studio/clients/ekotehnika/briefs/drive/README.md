# Ekotehnika media centre, from Filip's Google Drive

Shared folder `MEDIA CENTAR LMH`, 17,195 files, indexed on 9 October 2026 in `index.tsv` (Drive file id and path).
Files are not copied into the repo. This note lists what matters for storyline 2 and what to pull first.

## What is in it

| Folder | Files | What it holds |
|---|---|---|
| VILJUSKARI PO VRSTI I MODELIMA | 15,315 | Official Linde renders, application photos, data sheets and 66 FBX 3D models, by truck type and series |
| EKOTEHNIKA LINDE (materijal i pravila) | 78 | Ekotehnika's own drone videos and photos of the Vrčin site, delivery photos, a promo video, logos, the Linde co-branding guideline, a marketing playbook, the Dax font, a truck catalogue |
| SAFETY RESENJA | 446 | Linde safety products |
| Socialne Mreze Final | 443 | Finished social posts |
| SLIKE SA DOGADJAJA | 437 | Event photos |
| MEDAI CENTAR LIONSBOT, MARKETING LIONSBOT | 238 | Cleaning robots, another brand |
| SLIKE KOD KLIJENATA | 94 | Photos at client sites |
| SERVIS I REZERVNI DELOVI | 69 | Service sets, spare parts, seats |
| MEDIA CENTAR GRI, BATERIJE, AI Design, AUDIO, Pozadine | 74 | Batteries and chargers, AI generated images, audio, screen backgrounds |

## Pull first, mapped to storyline 2

| Use | Files |
|---|---|
| Hero and the whole story, the forklift Filip used in Figma | `1254_00_X50-600_BASIC_010.fbx`, Linde X50 electric counterbalance |
| Outdoor forklift alternative | `BR1202-H30D_016.fbx`, Linde H30 diesel |
| Automatizacija robots | `BR8925_C-Matic_10_004.fbx`, `C-MaticHP.fbx`, Linde C-Matic |
| Warehouse and najam grid trucks | `BR1120_R16_13.fbx` reach truck, `BR1115-00_N20_002.fbx` order picker, `BR1131-02-MT15C_004.fbx` pallet truck, `1173 D12_LINDE.FBX` stacker |
| Kompanija, the real Vrčin site | 23 short drone videos, 24 promo photos, 10 delivery photos, 2 promo videos |
| Logos | 7 files, Ekotehnika and Linde, with and without background |
| Rules | Linde co-branding guideline 1.3 (low and high res PDF), marketing playbook, truck overview catalogue |
| Proizvodi range | 11 full range photos from the Linde photoshoot |

## Pulled so far

- Eight Linde models are converted from FBX and live in `ekotehnika-hero/public/models/linde/`, x50, h30d, r16, n20,
  mt15c, d12, cmatic10 and cmatichp, about 7MB in all. The X50 wheel mesh was split into four wheels that spin on their
  own centres.
- The cmatic10 model carries a quicktron logo, another brand, so scenes hide that mesh.
- The drone videos, promo photos, delivery photos, range photos, logos and rules are downloaded to the session
  scratchpad only, 2.4GB. Nothing from them is in the app yet.

## Rules to check before shipping

- The co-branding guideline decides how the Ekotehnika and Linde logos sit together.
- The Dax font is in the folder, but the README says Dax is licensed and never embedded. Geist stays unless Filip
  confirms the licence covers web use.
- LIONSBOT is another brand and stays out of this site.
- AI generated images are not used as real photos of Ekotehnika.
