# Live casino lobby references, 19 Oct 2026

Captured signed out at 1440x900 from a US container. Six sites gave a clean lobby. Roobet and BC.Game loaded but sat under a region modal, so they are not kept as images. Shuffle gave a geo notice. Stake (.us and .ac), Rollbit, Thunderpick, Metaspins, Razed, Bitcasino, Duelbits, Rainbet, Yeet, Sportsbet and 500.casino returned Cloudflare or a block. Winna loaded under a "verification failed" overlay and was dropped.

Files sit beside this note as `<site>-lobby-1440.webp` and `<site>-hover.webp`. Each hover file holds the primary button hover on the left and the cover hover on the right. No full page shots were taken, the full page script failed and the fold was enough.

Measurement notes. Colours are sampled pixels from the shots or computed styles. Sizes marked "shot" are measured off the image. Tabular numbers were not tested for any site. Hover diffs come from computed styles before and after a real mouse move, so a pseudo element change would not show.

## Gamdom

- Ground #080d12, search bar and Sign in pill #131a22, hero panel is a green radial gradient with no edge, no 1px lines anywhere. Cover and hero radius 16px (computed), tile link 12px.
- Primary "Play Now" and "Sign up", #00ff86, 44px high, radius 10px, label 14px weight 700, sentence case, no icon. Resting glow rgba(0,255,102,0.28) 0 0 6px. No computed hover change on the button.
- Top bar 73px, logo left, four text links, a $500k King of the Hill badge, then Sign in as a #131a22 pill and Sign up in green. No balance pill signed out. No border under the bar beyond a faint line.
- No sidebar. Navigation is the top text links only.
- Originals covers 188x240 (shot), radius 16px, full bleed art with the game name set in the art, a "Gamdom" provider chip on a bottom tab, a heart with a count top right, and a game stat strip on slots. Hover shows no transform or shadow change in computed styles.
- Live elements. A "13,360,646,951 Total Bets" counter sits in the hero badge. The hero has 9 running CSS animations and 3 marquee classed nodes.
- Type is a custom family named Gamdom. Button label 14px 700. Section titles about 24px (shot), heart counts about 10px.
- Premium. The covers are one shared art system, bold lettering, gradient floor, no mixed styles, so the row reads as one product.
- Cheap. Green primary is full saturation #00ff86 on near black, and the heart counts at 10px are hard to read.

## Cloudbet

- Ground #131013 (a warm black with a purple cast), sidebar the same #131013 with a 1px line to the main area, cards #19151a on #131013, card edge #211c25. Cards have radius 28px, a 4px padded shell #211c25 around an inner #131013 face (radius 24.5px), and a lime light along the bottom right edge of the welcome and VIP cards (shot).
- Primary "Join" and "Activate now", #dafd4e, 49px high, radius 9999px, black label 14px weight 400, with a 2px solid #dafd4e border. No computed hover change.
- Top bar a 48px circle search button, a chat circle with an orange dot, then Sign in as a #26202b pill and Join in lime. A maintenance banner #1b2036 sits above it. No balance pill signed out.
- Sidebar 225px wide, #131013. Sections have a title and a 20px collapse chevron button. Rows are 14px with 16px icons and a small "Popular" chip. No active row visible. The top has three square tiles for Sports, Casino and Esports.
- No game covers in the fold. Sports tiles are 165px wide with a 12px style radius (shot).
- Live elements. A coin strip scrolls sideways under the cards. A "Real-time withdrawals" row shows $1,704,227 last 24 hours, 1,047,421 lifetime and under 1 minute average. 22 running CSS animations.
- Type is Inter for UI and a custom condensed face (midnightSansSTCond) for the banner and stat numbers. Section title 17.7px weight 700, stat numbers about 20px condensed bold (shot), labels 12.4px grey #8f8f8f.
- Premium. The nested card shell with a lime bottom light and one accent colour on a warm black reads like a bank card.
- Cheap. The stats row and the three social icon circles under the hero look stock, and the maintenance banner pushes everything down.

## BetFury

- Ground #13181f, sidebar #13181f, panels #1b2027 with no edge and no gradient on the earn strip, radius 12px (shot). The Casino and Sports panels carry a dark red and dark blue diagonal wash with a 3D object at the right.
- Primary "Sign Up and Play", a red gradient from #ff2642 to a deeper red (shot), 52px high, radius 12px, white label 16px weight 700, sentence case. Computed background is a gradient image so no hex diff on hover. Top bar Sign Up is the same red, Log In is a #1b2027 chip with a light border.
- Top bar 60px, logo, a sidebar toggle, a gift icon, Log In, Sign Up, a trophy and chat icon. No balance pill signed out.
- Sidebar 68px icon rail, tiles 44px at radius 8px, no labels. Active row is a lighter tile with a coloured icon.
- Recent Top Wins covers 66x76 with radius 8px, cover art plus a coin and amount underneath ($1,940). Hover on a cover shows a lock icon and swaps opacity in 0.1s. No transform.
- Live elements. The Recent Top Wins strip is an Embla carousel translated -1464px at load, so it auto scrolls. 1 running CSS animation.
- Type is Figtree Variable. Hero heading about 44px weight 800 (shot), section titles 24px weight 800, button 16px weight 700.
- Premium. A big red gradient headline with a mascot and an arcade machine gives a clear brand voice.
- Cheap. The tiny 66px win covers are repeated duplicates (the same Blackjack art six times), and the hero leaves a gap before the panels.

## Chips.gg

- Ground #0f1318, top bar #171c24, sub nav #151a21, search field #1e2630 with a 1px edge #283240, radius 8px. The King of the Hill bar has a 1px light edge (about #f2b795 peach) with radius 8px.
- Primary "Register", #0065f2 with a 1px #0d72ff border, 43px high, radius 8px, white 14px weight 600, sentence case, no icon. Hover applies filter saturate(0.75) brightness(1.2), a 1px #2681ff border and a 2px 5px shadow, over 0.2s.
- Top bar two rows. Row one has the logo, Casino and Sports pills, Login and Register. Row two has Promotions, Challenges, King Of The Hill, The Vault and VIP Rewards, plus an orange raffle chip (#dd702c bg tint, see Orange primaries). No balance pill signed out.
- No sidebar. Category tabs sit above the covers, with a Random game link right.
- Most Played covers 147x196, radius 8px, base #1e2630, each with an RTP chip top left (99.0% in green), a rank number badge top right, name over the art and a provider line at 6px. Hover lifts the cover 8px (translateY(-8px)), brightens to 1.2 and grows the shadow to 0 2px 4px at 0.25 alpha.
- Live elements. King of the Hill shows a countdown (00:59:34 then 00:36:33 on two loads), bets, prize and a multiplier in orange. The raffle banner rotates through 3 slides.
- Type is Poppins. Section title 20px weight 600 (shot), tab labels 14px, button 14px 600.
- Premium. The rank numbers, RTP chips and the lift on hover make the cover row feel like a store shelf.
- Cheap. The Halloween raffle banner, the confetti and the orange raffle chip fight the clean dark UI.

## Mega Dice

- Ground #071722, sidebar #061721 with a 1px divider, top bar #010d14, day cards #071722 with a 1px edge #18262d, radius 16px.
- Primary "SIGN UP" and "Deposit Now", #00e8a3, 40px high, radius 10px, label 13.3px (an Arial default, weight 400 computed, bold in shot), uppercase on Sign Up and sentence on Deposit Now. Hover goes to #33ffc2 and adds a 0 2px 4px shadow at 0.2 alpha. A second button "BUY $DICE" is outlined with a 1px green edge.
- Top bar 64px, search field left, Sign Up in green, Login as a green outlined button radius 10px. No balance pill signed out. A Deposit Now button is pinned at the bottom of the sidebar.
- Sidebar 248px. Section titles CASINO and SPORTS in uppercase bold with a caret. Rows 40px with a 20px icon, 14px label. No active row visible.
- No game covers in the fold. The "Why play" cards are 265x324 with radius 16px, art top and text below.
- Live elements. A ten day loot box ladder with lock icons and a progress bar at 0%. 37 nodes carry a marquee class. 4 running CSS animations.
- Type is Poppins and Inter, with an icon font. Hero heading about 44px weight 700 uppercase (shot), section title 22px uppercase, labels 14px.
- Premium. The glassy 3D loot box hero with teal and violet gems gives depth.
- Cheap. Buttons fall back to Arial at 13.3px, so type weights are mixed, and the loot day row truncates labels with ellipses.

## Jackbit

- Ground #0c121e, sidebar and panels #161b27 or #161b28, hero panel radius 30px (computed section) with no edge, sport tiles #161b28 radius about 12px (shot), the sidebar is a floating #1a202d card with a radius 20px (shot) and an inset from the page edge of 10px.
- Primary "Register", #00ec66, 55px high in the top bar and 48px in the hero, radius 50px, label 16px weight 700 (13px on the small one), sentence case. A secondary "Continue with Google" is a #161b28 pill with the logo. Hover on the top bar pair turns the label green and the fill to #161b28 on the secondary one.
- Top bar floats with the page, no bar fill. Search is a 55px circle, Log In a #161b27 pill and Register a green pill. No balance pill signed out.
- Sidebar 280px, with a segmented Casino and Sports toggle on top (shot, the active segment is lighter), then icon rows at 14px and a Collapse Menu pill at the bottom.
- Originals covers 130x180, radius 15px, name in the art with a small "ORIGINALS" tag. Hover shows no computed change on the surface. The Sports tiles below are icon plus label rows at 66px high.
- Live elements. None seen in the fold. 0 running CSS animations and 1 marquee node.
- Type is Poppins. Hero heading about 32px weight 700 (shot), section title 20px weight 600, button 16px 700.
- Premium. The floating rounded sidebar and the pill buttons give a soft app feel with a lot of air.
- Cheap. The hero tilts two grids of covers at an angle behind a big panel, which clips the art and its names.

## Roobet and BC.Game (seen behind a region modal, not kept)

- Roobet. Ground #0d0f24 and sidebar #12132a (dimmed by the modal, so true values are a little lighter). The modal button is #ffb800 amber with a lighter amber top, a darker amber lower edge and a bold label, about 48px high with a pill radius. The top bar has a squarish Register button in the same amber. A wins strip shows "5 minutes ago" cards and a jackpot panel with Major, Minor and Mini values. The sidebar shows a collapsible Casino group with a lighter header row for the open section.
- BC.Game. Dark green grey ground (about #141a1a) and a sidebar in the same tone, green Sign Up, a "Recent Big Wins" strip of 56px portrait covers with a name and amount under each.

## Patterns across the sites

- 6 of 6 sit on a near black ground between #071722 and #13181f, with none on pure #000. Four of them (Gamdom, Chips, BetFury, Jackbit) are cool blue grey, Cloudbet is warm purple black, Mega Dice is deep teal.
- 6 of 6 use a single saturated accent for the primary action, and it is the only strong colour in chrome. Green on 3 (Gamdom #00ff86, Jackbit #00ec66, Mega Dice #00e8a3), lime on 1 (Cloudbet #dafd4e), red on 1 (BetFury #ff2642), blue on 1 (Chips #0065f2).
- 6 of 6 put a Sign in or Login in a quiet filled pill next to a loud Sign up or Register.
- 5 of 6 use radius 8px to 12px on buttons (Gamdom 10, Chips 8, BetFury 12, Mega Dice 10, Cloudbet and Jackbit are full pills at 9999 and 50).
- 4 of 6 use a full pill radius on the main action (Cloudbet, Jackbit, plus the pill Sign in shells on Gamdom and Cloudbet).
- 5 of 6 draw panels with no 1px edge, only a step of 4 to 8 lightness points over the ground (#131a22 on #080d12, #1b2027 on #13181f, #161b27 on #0c121e, #19151a on #131013). Chips and Mega Dice are the two that use 1px edges.
- 6 of 6 show the primary button text in near black on the bright greens and lime, and white on red and blue.
- 5 of 6 use a lobby hero with art at the right and a headline plus one button at the left.
- 4 of 6 show game covers as portrait tiles with the name set in the art, at 130 to 190px wide and a 12 to 16px radius (Gamdom 188x240, Chips 147x196, Jackbit 130x180, BetFury 66x76 for wins).
- 3 of 6 add a provider or tag chip on the cover (Gamdom provider tab, Chips RTP chip and rank number, Jackbit ORIGINALS tag).
- 5 of 6 use a geometric sans (Poppins on 3, Inter on 2, Figtree on 1) and 2 add a custom display face (Gamdom's own, Cloudbet's condensed). No site uses a serif.
- 4 of 6 show something live in the first screen, a total bets count, a withdrawals counter, a countdown or a wins strip, and none of them use a flashing effect. The motion is slow carousels and number counters.
- 0 of 6 show a balance pill signed out, so that pattern could not be checked here.
- 3 of 6 show a hover lift or brighten on covers (only Chips lifts by 8px, with brightness 1.2). The rest show no computed change.

## Orange primaries

- Roobet, #ffb800 amber, the "Shop on Roobet.style" button in the region modal and the Register button in the top bar. A lighter amber top and a darker amber lower edge give a raised key look. Sports Betting tile is also an amber wash.
- Chips.gg, about #dd702c orange tint on the "$10k Hallow Raffle" chip at the top right, with an orange label and a 1px orange edge. It is a promo chip and not the main action. The in-bar multiplier text (407.70x) is also orange.
- No other site in this set used an orange action button. Cloudbet has a small orange dot on the chat button (a notification badge).
