# The service pages and the company page, the plan

Filip, 19 November, "Need to work on the service pages and about pages, can you gather the content needed and work on it? So it's
interesting. Also to the service pages add parts page (Delovi)". Content on file in content.md beside this file. Hardened the same day,
and Filip's yes, "yes, go".

## What the content allows

- Najam and Servis have the company's own short lines and figures, and the old site's long Serbian text. That long text is Linde's dealer
  template, and its 50.000 devices and 8.500 technicians are Linde's worldwide figures, never Ekotehnika's.
- Kompanija has 1997, 1.000+ clients, the Vrčin address, two service centres, and 24 drone photos of Vrčin. The history after 1997 is
  self reported and only in English, so it stays off.
- Delovi has no Serbian copy, no captured page, no contact and no parts list, so it stays small until the client answers.
- No page has a service promise in numbers, response times, hours, technicians or vans.

## Four pages, in the shop's look, at /najam, /servis, /delovi and /kompanija

Each ends on its own form topic. The menu's Usluge panel, the Kompanija link and the homepage's Uslovi najma and Usluge servisa links
point to them.

1. Najam. The hero with the live line, od nekoliko sati do godinu dana, isporuka za 24 sata, over the delivery photos. The four facts,
   24 sata isporuka, besplatna dostava i preuzimanje, održavanje uključeno, zamena viljuškara. Kratkoročno and dugoročno side by side,
   the long one with the four terms, 36, 48, 60 and 72 months, picking one opens the form with Najam and that term filled in. A line to
   the shop that any model can be asked about for rent, no fleet grid.
2. Servis. The hero with Hitan servis and its number at full size. The servis map with both centres, their addresses and phones. Five
   services as cells in the live copy's words, repairs of 300+ vehicle types as the live homepage already shows it. The five check areas
   as a plain list, no tabs. Photos from the company's own service posts.
3. Delovi. The hero, originalni Linde delovi. The groups the old site sold, gume, baterije i punjači, priključci, potrošni delovi, each
   with a Linde photo where one fits. The form with a new Delovi topic, and the form's server learns the topic and sends it to the inbox
   the client names, servis@ekotehnika.rs until then. The rest waits for the client's answers.
4. Kompanija. The hero over a Vrčin drone photo, Snaga koja pokreće, od 1997. širom Srbije i Crne Gore. The figures 1997, 1.000+
   klijenata and 2 servisna centra. The two sites with addresses and the map. Work at clients' sites without their names, event photos
   only without clear faces.

Build step. The four paths go into vercel.json, App.tsx, index.html and route.tsx, and a reload of each is checked on a production build.

## Client to answer before Delovi says more

- Which part groups they sell, and for which brands.
- The usual delivery time.
- Which inbox gets parts requests.
- Whether the rental number +381 63 102 1907 from the old Najam page is still in use.

## Kickoff, Filip's yes of 19 November

1. Scope. Four new pages, and the menu and the homepage's two links point to them.
2. Reference. The shop's own look.
3. Baseline. d8010c5, nothing on the shop or the homepage moves beyond the links.
4. Output. Pages on the branch for localhost, production after the ship line.
5. Done. /uireview with no open sev 1, and Filip has looked on localhost.
6. The Linde template text becomes short plain Serbian lines with no worldwide figures, for the client to check.
7. The history after 1997 stays off until the client confirms it in Serbian.
8. Delovi is a fourth form topic, to servis@ekotehnika.rs until the client names the inbox.
9. Photos, the Vrčin drone photos, the delivery photos, the company's service post stills checked for text baked in, client site photos
   without names, event photos without clear faces.
10. Opening hours stay off until the client confirms them.

## Built, 19 November, on the branch for localhost

- Four pages in the shop's chunk, src/shop/Pages.tsx and pages.css, the map part in Centres.tsx, loaded only where a page shows it.
- Each page is the hero of words and a collage, rows of cells, a close row with its own form topic, and tiles to the other pages.
- Najam has the four facts, the short and the long rental side by side, and each of 36, 48, 60 and 72 months opens the form with Najam
  and "Zanima me dugoročni najam na 48 meseci." filled in.
- Servis has Hitan servis at full size, the four services, 300+ beside the service van, the five checks, and the map that draws on once
  in view.
- Delovi has the four groups, each opening the form with Delovi and the group filled in, routed to servis@ekotehnika.rs, or to
  FORM_TO_PARTS once the client names an inbox.
- Kompanija has the four figures, the heart line with its list, the four offers as tiles, the map, and two client site photos without
  names.
- The menu's Usluge panel holds Najam, Servis, Delovi and Hitan servis as cards. Polovni moved to a line under the cards, because a fifth
  card would push the panel past the left edge of a 1440 screen. Usluge opens /najam, Kompanija opens /kompanija, the phone sheet and the
  footer list the pages.
- The van picture lost its bottom strip, which carried a third party credit, and the parts kit photo lost a grey border column.

## New Serbian lines for the client to check

- Kratkoročni najam, "Za sezonski špic, veliki broj narudžbina ili događaj. I kao jednostavan način da viljuškar upoznate pre kupovine."
- Najam, "Za svaki model iz prodavnice možete pitati i za najam." and "Cena najma zavisi od modela, visine podizanja, dodatne opreme i
  dužine najma."
- Servis, "Servis u propisanim intervalima, pre nego što kvar zaustavi rad.", "Jedan poziv je dovoljan. Tehničar dolazi sa originalnim
  rezervnim delovima.", "Propisani bezbednosni pregledi, sa potpunom servisnom dokumentacijom.", "Jedan ugovor pokriva sve neophodne
  mere održavanja."
- Delovi, the four group lines, "Gume za viljuškare.", "Baterije i punjači za električne viljuškare.", "Push pull i drugi priključni
  uređaji.", "Delovi koji se menjaju na redovnom servisu.", and "Navedite model viljuškara, serijski broj i deo koji vam treba."
- The close rows, "Recite nam šta vam treba i na koliko dugo.", "Zakažite servis ili pozovite za hitnu intervenciju.", "Zatražite
  ponudu za novi Linde viljuškar."
