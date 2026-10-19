# Round 1 notes, lusty-lagoon

Review of the old Figma design, forwarded by Filip on 2026-10-19 with "Sending you some feedback I
want you to execute moving forward. Note take them and build plan to execute a better
design/product/landing page after." The reviewer wrote in Serbian. Each note keeps the original
words, an English reading and the Figma node it points at. Times are the reviewer's chat times.

Status queued. No code is touched until Filip pauses or says go, then all notes are planned in one
pass.

Only the first screenshot reached the session as a file, saved beside this note. The rest are
described in words and located by Figma node.

## 1. 11.54am, payment method picker gradients

- Points at Wallet, Deposit, Select Payment Method, the Mastercard, Visa, PayPal and Wire Transfer
  cards. Figma 473-62 (panel), 364-797 (card group). Screenshot `note-01-payment-method-gradients.png`.
- Said "npr ovi gradijenti ovde su prejaki previse forsirani, to bih smanjio skoro svuda, nisam
  siguran da li je visa highlightovana ili samo vizuelno izgleda malo jaci gradijent"
- Reads as. These gradients are too strong and too forced, reduce them almost everywhere. He could
  not tell whether Visa is selected or just has a slightly stronger gradient.
- Evidence. The next frame in the flow carries a layer named "Selected ---- VISA" (364-1916), so
  Visa was meant as selected, and the gradient was the only signal.

## 2. 11.55am, text glow and 3D tabs

- Points at the wallet tabs, Deposit, Gift card, Withdraw, Tip. Figma instance 475-397 of Tabs.
- Said "sav tekst ima glow sto je mozda malo previse i npr ovakvi tabovi nemaju potrebu za tom
  unutrasnjom senkom koja ih kao pravi 3d"
- Reads as. All text has a glow, which is a bit much. Tabs like these do not need the inner shadow
  that makes them look 3D.

## 3. 11.56am, rank progress card effects

- Points at the Bronze Rank card, 550K of 650K, 23% to level. Figma 339-1655, sidebar of every
  product screen.
- Said "ovde su isto prejaki efekti i 3d progres bara i senke koju baca i gradijent na ovom ispod
  sto oznacava kapacitet"
- Reads as. The effects are too strong here as well. The 3D progress bar, the shadow it casts, and
  the gradient on the track below it that shows capacity.

## 4. 11.56am, flying fragments

- Points at, unclear. Either the glowing particles trailing off the end of the progress bar in
  note 3, or the floating coin and currency tiles around the wallet cards and the character art.
- Said "ti kao leteci fragmenti sada mogu da se urade bolje, bilo je top za tada kad si radio"
- Reads as. Those flying fragments can be done better now. They were great for when you made them.
- Open question for Filip, which fragments.

## 5. 11.57am, generic feature tiles

- Points at the landing page section Why choose Lusty Lagoon, six tiles. Figma 339-936 and its
  siblings.
- Said "ovi delovi izgledaju dost genericki sa ovim ikonicama i ponavljanjem tog gradijenta u
  svakom boksu"
- Reads as. These parts look quite generic, with these icons and the same gradient repeated in
  every box.

## 6. 11.58am, FAQ gradient

- Points at the landing page FAQ rows. Figma 339-1360 and its siblings.
- Said "isto za kradijent"
- Reads as. Same for the gradient.

## 7. 11.59am, buttons too fun to scale

- Points at the gold Register account button on the landing page. Figma 339-445. The same glossy
  pill style is used for Play now, Claim bonus and the wallet actions.
- Said "buttoni su isto previse fun, lepo su uklopljeni tu gde jesu ali ne daju utisak
  usabilitija u smislu da se mogu koristiti kroz product kad se skalira"
- Reads as. The buttons are too playful as well. They sit well where they are, but they do not
  read as usable controls that can carry through the product as it scales.

## 8. 12.06pm, case study scope, missing screens, button hierarchy

- Points at the whole job. Filip reacted with a thumbs up.
- Said "super, takodje bih poveo malo racuna o nekim da kazes upadljivim stvarima, ono sto ne
  planiras da ubacis u case studi ne moras polirati, sa druge strane ako ti fali neki ekran npr za
  payment flow ili tako nesto da bi ga pokazao celog, mozes ga napraviti ako nije previse posla.
  takodje bih malo hijerarhiju popravio u smislu sta je primarno sta sekundardno dugme i napravio
  jasnu razliku u privlacenju paznje i upotrebi izmedju njih, i tako te stvari koje ce se sigurno
  videti u case studiju"
- Reads as. Mind the conspicuous things. What will not go in the case study does not need polish.
  If a screen is missing, for example in the payment flow, make it so the flow shows whole, if it
  is not too much work. Fix the hierarchy between primary and secondary buttons so they clearly
  differ in how much attention they pull and in what they are used for. Focus on what will
  certainly be seen in the case study.
- Effect on the kickoff. The deliverable feeds a case study, so Done covers the case study screens,
  not every screen in the file.
