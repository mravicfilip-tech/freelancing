# Portfolio deck rebrand

Swaps the Diversify branding in `General_Portfolio_Diversify_2026` for Filip
Mravić's (wordmark, #ff4213 accent, Geist / Geist Mono — from
`mravicfilip-tech/filip-portfolio`). Mockups, images and slide copy are not
touched: the script edits the PDF content streams directly, neutralising only
the matched brand paths and their hidden search text.

```
pip install pymupdf pikepdf
curl -sSLO https://registry.npmjs.org/geist/-/geist-1.7.2.tgz && tar xzf geist-1.7.2.tgz
python3 rebrand.py in.pdf Filip_Mravic_Portfolio_2026.pdf package/dist/fonts
```

PDFs are git-ignored: the deck is marked confidential and this repo is public.
