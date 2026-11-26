---
name: polovni-oglas
description: Adds a used machine to the site's Polovni shop from an ad link, or marks one sold. Use when the site owner pastes a mojauto.rs or polovniautomobili.com ad link, asks to add a used truck, forklift, tractor or machine ("dodaj polovni", "novi polovni oglas"), or says a machine is sold ("prodat", "prodato"). Reads the ad, fills every field it can, asks for the rest in one message, then adds the machine, builds the site and shows it.
---

# Polovni oglas

The Polovni shop lists used machines at /prodavnica/polovni, each with its own page. Its data is `src/shop/polovni.json`, the fields
are described in `src/shop/used.ts`, the pages are `src/shop/Used.tsx`. The person asking is the site owner. Talk to him in Serbian
with the full letters, short and plain.

## 1. Whose ad

Ask first, unless he already said so, whether the ad is Ekotehnika's own. Only Ekotehnika's own ads may be copied, their text and
photos. If it is not, stop and say why in one sentence.

> Da li je ovo Ekotehnikin oglas? Tekst i fotografije možemo da preuzmemo samo iz naših oglasa.

## 2. Read the ad

```
node scripts/polovni-oglas.mjs "<link>" --photos public/polovni/<slug> --max 12
```

The slug is the brand, the model and the year in lowercase words joined by hyphens, such as `linde-h30d-2018`. The script prints
what it found as JSON and saves the photos as 1.jpg, 2.jpg and on.

When it prints `"blocked": true`, the portal refused the reading (polovniautomobili.com does). Ask him to paste the ad's text and
attach the photos, then work from those.

> Portal ne dozvoljava automatsko čitanje oglasa. Nalepite ovde tekst oglasa i pošaljite fotografije, pa nastavljam.

## 3. Fill the fields

Fill an item of `items` in `src/shop/polovni.json` from what the ad gives. Never guess. A field the ad does not give stays `null`
and becomes a question in step 4.

| Field | From the ad |
|---|---|
| `title` | the brand and the model in normal case, `John Deere 6120 M 4x4` |
| `brand` | the brand |
| `kind` | one word, Viljuškar, Viljuškar sa protivtegom, Paletar, Slagač, Traktor and the like |
| `group` | for a forklift the shop's own category slug from `src/shop/catalog.json`, for any other machine a group of `groups` in `polovni.json`, `ostale-masine` until he names another |
| `year` | the year of make |
| `hours` | the working hours, often only in the description, "RADNI SATI 2942" |
| `kg`, `mm` | the capacity and the lift height of a forklift, in kg and mm |
| `power` | the power as the ad writes it, `120 KS (88 kW)` |
| `location` | where the machine stands |
| `price` | the price in euros as a number, `null` when the ad says Dogovor or Po dogovoru, which shows Cena na upit |
| `pdv` | `sa` or `bez`, only from his answer |
| `photos` | the saved photos as `/polovni/<slug>/1.jpg` and on, the first is the card's photo |
| `text` | the description's prose, rewritten from capitals into normal sentences |
| `specs` | pairs of name and value, from the spec list and the description's lines that hold a number |
| `equipment` | the description's other lines, one item each, in normal case, obvious typos fixed |
| `source` | the portal, the link without its query, the ad's id and today's date |

Keep model names, units and codes as written, `AutoQuad Plus 24F/24R`, `460/85R38`, `PTO`. Write Serbian with its full letters.

## 4. Ask for the rest, once

Send one message. Say in one line what you found, then list only the missing or unsure fields as numbered questions he can answer
in a word. Always ask about the price with PDV, the location and the original photos, since portal photos carry the portal's mark.

> Pročitao sam oglas, John Deere 6120 M 4x4, 2020. godište, 2.942 radnih sati, 19 fotografija. Fali mi još ovo.
> 1. Cena u evrima, ili da piše Cena na upit?
> 2. Da li je cena sa PDV-om ili bez?
> 3. Gde se mašina nalazi?
> 4. Imate li originalne fotografije, bez oznake portala? Ako nemate, koristim ove iz oglasa.
> 5. Da li da mašina odmah bude na sajtu?

For a forklift also ask for the capacity and the lift height when the ad does not give them. Wait for his answers. Do not add the
machine before he answers.

## 5. Add it and show it

1. Write the item with his answers. `status` is `na-stanju`, `confirmed` is `true`. Original photos he sends replace the portal's,
   saved into the same folder as `1.jpg` and on.
2. While the sample machine with `status` `primer` is still in `items`, ask once whether to remove it, and remove it when he says so.
3. Run `npm run build`. A change that does not build is not done.
4. Run `npm run dev` and give him the address, http://localhost:5173/prodavnica/polovni/<slug>.

The menu's Polovni link moves from the old page on ekotehnika.rs to /prodavnica/polovni by itself once a machine with `status`
`na-stanju` and `confirmed` `true` is in the list.

## Sold

When he says a machine is sold, set its `status` to `prodato`. It leaves the list, and its page stays reachable with a Prodato mark.
Run the build. Delete a machine only when he asks for it.
