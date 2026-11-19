# The shop, Filip's notes

Round of 18 November, sent while the shop ran on his localhost. Planned and built in one pass.

1. The shop's first page, "need to add a hero to this page with button, slider images to promote new products etc". Screenshot marks the
   intro row. Built as a slider with the old site's own three slides (the MT15 C offer at 1.390 euro, the counterbalance trucks, the order
   picker) after one slide for the shop, the photos from the Drive.
2. The categories, "can we add filters to these categories and some information". Screenshot marks the row of tiles. Built as a row of
   filters over the tiles, the type of truck and a search, and each tile with its capacity range and its highest lift.
3. A category, "can we add more sorting/filter options, make it look like a shop please". Screenshot marks the list of categories on the
   left. Built as a shop listing, the categories, then filters with counts (capacity, lift height, kind, data sheet), a sort, a search,
   the count shown, the filters on as chips, and cards with an inquiry button. One listing for a category and for all models.
4. The filters, "style all of this better with paddings etc". Screenshot marks the filter groups.
5. The sort, "style this too and don't make the focus / active so aggressive". Screenshot of the browser's own dropdown, blue highlight.
6. "make sure grid doesn't interfere with UI". Screenshot marks a vertical through a slide tab and through the Tegljači filter.
7. The hero, "do better more attractive hero/slider, use inspiration we did for CTA banner and previous inspirations I gave you, make it
   look more the part". Screenshot marks the whole hero.
8. The search, "make search bigger and when opening the search suggest top 5 models searched for and do suggested searching".
9. The hero's slides, "style this slider better". Screenshot marks the row of tabs under the hero, "02 Linde transporter MT15 C" with its
   bar, the thumbnails and the two arrows. Built as four tabs that fill the grid's four frames, each with its picture at full strength, the
   frame's own top line filling black while a slide runs, and the counter and the two arrows moved up over the words.
10. The search, "use better icon". Screenshot marks the magnifier in the search field over the categories. Icons are micro detail, so three
   variants in the real app, picked by number.
11. The model page, "the product page needs more work, needs description, bullet points why this works, extract data from google drive and
   populize this page as much as we can". Link to /prodavnica/dizel-i-plinski-ceoni-viljuskari/h16-do-h20. Lifts the brief's "specs only
   from an exact old-site match" for what the client's own Drive says about a series, his words "extract data from google drive".
    Filip's answers, 18 November, "yes to all 4, go". 1 the Serbian is translated from Linde's English data sheets, marked for the client
    to proofread. 2 H16 to H20 is built in full first, every other series after Filip looks. 3 data sheet numbers replace the old site's on
    the cards and in the filters wherever a sheet exists. 4 the page grows to five sections, the top with the description, Zašto ovaj model
    and four figures, then Karakteristike, Verzije with the full table closed under it, Oprema closed by group, then Fotografije and related.
12. Karakteristike on the model page, "needs better styling here, icons, ticks etc". Screenshot marks the four feature groups.
13. "issue with duplicated lines". Screenshot marks the doubled rule with its marks over Verzije, the cap under Karakteristike over the
    rule of the next section.
14. Verzije, "1,2, or evne 3 rows should stand out". Screenshot boxes the three H20 columns. Read as each model's versions standing out
    as a group, H16, H18 and H20 each a band with its D, T and CNG under it, alternate bands tinted. A featured version is the other reading.
15. "duplicate line issue". Screenshot marks the doubled rule under Oprema, over Fotografije. Same cause as 13.
16. Oprema, "add icons here please". Screenshot marks the eight equipment groups.
17. Oprema, "ticks and also i think we can keep top row open always (but not on mobile)". Screenshot marks the square bullets of an open
    group. Ticks for the lists, and the first row of groups open on a wide screen, closed on a phone.
18. The model's photos, "these should be moved above here and have gallery preview". Screenshots mark Fotografije and the empty space
    under the main picture. Built as thumbnails under the main picture, the render first, a click shows that picture in the main frame,
    and the Fotografije section under the page goes.
19. The model's pictures, "make images bigger, we have al ot of white space use it". Screenshot marks the empty space under the
    thumbnails. Built as thumbnails grown into tiles across the frame, three or four to a row at 4 to 3, and the main picture's height
    cap raised from 640px to 800px.
20. Karakteristike, "use proper icons". Screenshot shows solid black squares where the icons belong, the shapes never drew on his
    browser. The icons passed their shape through a CSS variable, the ticks wrote theirs directly and drew fine. Each icon now writes its
    shape directly.
21. Verzije, "add maybe recommended tag here, style this better". Screenshot marks the space beside H18. Built as a Preporučeno tag in the
    site's Akcija label style on one model group, the middle one by default, set per series in src/shop/recommended.json, the client to
    name the real one. Only that group is tinted, the others split by a hairline, the fuel letters small and grey under each model.
22. Sve tehničke karakteristike, "stlye this better please". Screenshot of the open full table. Built as the unit on the label's line
    in grey, the VDI number in its own narrow column, every row one line high, each section's name ruled off under it, and a faint
    highlight on the row under the pointer.
23. Oprema, "where icons". Screenshot shows black squares and the top row closed, from before the icon fix was pushed. The top row now
    opens from the first render instead of after it.
24. Kontakt, "style this page better". Screenshot marks the empty fourth frame right of the form. A layout ask, so a structure in words
    goes to Filip first.
25. "icon size reduced by 50% on all dropdowns". Screenshot marks the arrow of the model select on Kontakt. Every dropdown arrow in the
    shop at half its size.
26. Kontakt, "add some imagery here". Screenshot marks the empty space under the contact rows on the left. Goes into the same structure
    proposal as 24.
    Filip's yes to the Kontakt structure for 24 and 26, 18 November, "yes, go". The picture of the inquiry's model under the contact rows,
    following the select, the range photo with no model, and the form across both right frames.
27. Kontakt, "this doesn't look good, even it out a bit". Screenshots mark the empty space under the form while the picture's column runs
    on. Built as the picture capped at 400px, its caption on one row, the name left and the figures right, and the message box growing so
    the form ends level with the picture's column.
28. Kontakt, "fix this". Screenshot marks the rule under the page's two halves, over the footer.
29. Oprema on the model page, "reduce the amount of content too much info honestly". Screenshot of the open first row, 14, 12, 5 and 4
    lines.
30. The model's main picture, "reduce this image size so we get rid of this space here". Screenshots mark the picture and the empty space
    under the right column. Built as the main picture filling the height the right column sets, so both end together at any width.
    28 found, the closing rule under a section is a 2px row that drew its own bottom marks 2px under its top marks, doubled on every page.
    29 built as each open equipment group showing its first 4 lines and a Još N button for the rest.
31. The top menu, "this menu doesn't make sense, remap it to new home page + shop with categories, contact page and so on". Screenshot
    marks Početna, Novi, Polovni, Najam, Servis, Kontakt. Shared by the homepage and the shop.
    Filip's yes to the menu map, 18 November, "yes, go". Početna, Prodavnica with its categories, Najam and Servis to their homepage
    chapters, Polovni on ekotehnika.rs, Kontakt, and Zatražite ponudu to the form with Kupovina picked.
32. Karakteristike and Oprema, "better icon choices overall please". Screenshot marks the four feature icons, hand drawn glyphs that read
    as an L, a pin and a blob. To be redrawn from a proper icon set in its solid style, per the taste ruling.
33. "what is this menu here remove it". Screenshot marks the phone bar, Meni, Prodaja and Zatražite ponudu, under the footer on a wide
    screen. The phone's bar showing where it never should.
34. The top menu, "we have deadlinks here, fix this menu, remap it, add new links, show categories, create a mega menu etc gogogo".
    Screenshot marks the six links on a model page.
    34 built as a mega menu, Početna, Prodavnica with the ten categories by kind, each with its picture and count, and the MT15 C offer,
    Usluge with Najam, Servis, Hitan servis and Polovni, Kompanija the story's company chapter, Kontakt. The dead links were Najam and Servis
    from a shop page, the story gave up waiting for its pin after 5 seconds, now 30. Najam and Servis on the homepage open the form.
35. The filters, "make this better". Screenshot marks the count of a ticked option, its grey pill gone on the row's grey.
36. Kontakt, "can we add images, icons here and multi select maybe?". His second screenshot marks the topic row, Kupovina, Najam, Servis
    and Delovi, together with the Model field under it. Asked which part, he answered the topic row.
37. Kontakt, "1st image can we add multiple images if multiple selected products and to remove too". His first screenshot marks the
    picture of the chosen model in the left column, Linde E16 do E20 with its two figures. Several models picked, several pictures, each
    one removable.
    36 and 37 built on Filip's go, 19 November. The topics are cards with a photo and an icon, one or more ticked, a request touching
    sales and service goes to both inboxes. The model field adds up to six models to a list under it, each with an ×, and the left column
    follows the list, one large, two or more in a grid of two, each with an ×. The server takes teme and several models.
38. Kontakt, "just do a random grid of sliding images like we did on a hero page here". His screenshot marks the still grid of the picked
    models on the left. Built the same turn as the Najam hero's reel, shared as Reel.tsx, the picked models' cut outs with their names
    woven in among the shop's photos, mixed sizes, the cross to take a model out stays in the list beside the field.
39. Servis, "rework this". His screenshot marks the Servis hero's Hitan servis call button and Zakažite servis under it, the number
    running under the phone cell on his screen, and the ring of the phone cell standing as a dark box round it. Queued, plan sent.
    39 on Filip's go, three versions on one board, n39-call-board.png beside this file, live at /servis?poziv=1 to 3, each sized to its
    own number and checked at 1920, 1440, 390 and 360. Waiting for his number, 1 shows until he picks.
