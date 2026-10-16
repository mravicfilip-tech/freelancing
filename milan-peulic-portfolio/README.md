# Milan Peulic portfolio 2026

Two Diversify portfolio decks, rebranded as Milan Peulic and written in first person. Same
colours, same layout, same case studies.

- `Portfolio_Milan_Peulic_2026.pdf` is the general deck, 24 pages, 10.2 MB.
- `Portfolio_iGaming_Milan_Peulic_2026.pdf` is the iGaming deck, 17 pages, 4.9 MB.

## What changed in both

- The name Diversify became Milan Peulic on the cover, page 2, every page header and every
  footer. The header and footer name is set in Manrope Medium, the face the decks already use
  there. The cover name reuses the cover's own display face, letter for letter. The iGaming deck
  never draws an M or a space in that face, so those come from the general deck, where it does.
- The Diversify mark is gone from the cover and page 2, and the large outline watermarks are gone
  with it.
- The header tile holds an MP monogram in Manrope Medium, white, in place of the mark. This is a
  placeholder until Milan has a mark of his own.
- The letsdiversify.com pill on the right of every header is removed. It goes back the moment
  there is a URL for it.
- We became I in every case study. On page 2 the studio line now reads "I help companies turn
  digital products into growth engines through design and engineering."
- The invisible text layer moves with every edit, so search and copy read the new words.

## Only in the general deck

- The hero orb on page 1 holds the MP monogram too.
- On page 19 the pull quote was also baked into the background photo. A small patch of that photo,
  with the old words removed, sits under the quote so only the new wording shows.
- The source file still carried its old Diversify contact page as a hidden page, kept alive by a
  bookmark called 26, with Diversify's email, LinkedIn and site links on it. The bookmark is
  unlinked and the hidden page is gone.

## Only in the iGaming deck

- The closing page lost Diversify's email, LinkedIn page and website, their links and their
  labels. It reads "Milan Peulic" and "Thank you for watching!" until Milan's details arrive.
- The page 5 Rollblock paragraph has outlines but no text layer, so its "We" was found by matching
  glyph shapes and changed on the outlines alone.
- The deck is tagged, and its tags keep a second copy of the words that Acrobat uses for copy and
  search. Those copies carry the new name and first person wording too.

## What did not change

- The tagline "Building the Digital Future, Together." in every header.
- The footer line "A unified approach to product strategy, design, and engineering".
- The hero mocks, including "Product Design & Dev Team" in the general deck.
- Every other word, image and position. A pixel diff against each source shows changes only in
  the regions listed above.

## Size

Both decks went through `tools/compress.py`, which took the general deck from 12.4 MB to 10.2 MB
and the iGaming deck from 8.5 MB to 4.9 MB with no visible change.

- Outline coordinates are rounded so no point moves more than 0.005pt, two thousandths of a
  millimetre. Transforms and text positions keep every digit.
- Sixteen iGaming alpha masks held only the values 254 and 255, so they are dropped. Opacity
  moves by at most 0.4%.
- Photos keep every pixel. Only their JPEG encoding tables are rewritten, and the decoded pixels
  are checked identical first.
- The empty origin marker in front of every outline glyph is dropped, since it paints nothing.

A render of every page at 2x against the uncompressed build moves at most 31 of 255 levels, on
0.1% of pixels, all of them single edge pixels where the rasteriser's sampling grid flips. Text,
tags, bookmarks and links are unchanged.

Photos are now most of what is left. The general deck's are stored at 2x, and cutting them to 1x
would save about 1.6 MB more, but they would soften on retina screens and on zoom, so that is not
done.

## Rebuild

The sources are the Diversify PDFs, which are marked confidential and are not kept in this repo.

```
pip install pymupdf fonttools uharfbuzz opencv-python-headless pillow numpy
# Manrope Medium from Google Fonts, saved as fonts/Manrope_500.ttf
python3 -I tools/rebrand.py tools <general.pdf> Portfolio_Milan_Peulic_2026.pdf fonts general
python3 -I tools/rebrand.py tools <igaming.pdf> Portfolio_iGaming_Milan_Peulic_2026.pdf fonts igaming <general.pdf>
pip install mozjpeg-lossless-optimization
python3 -I tools/compress.py tools <rebranded.pdf> <final.pdf>
```

Each run ends by scanning the saved file, every object, stream and line of text, and stops if
Diversify is still named anywhere or a hidden page survives. `tools/rebrand.py` holds every edit,
so a URL for the pill, Milan's contact details or a real mark is a few lines there.
