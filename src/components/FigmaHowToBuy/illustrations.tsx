import { useEffect, useRef } from 'react';
import './illustrations.css';

/**
 * The three step illustrations, chosen from the review board: the presale site being opened and
 * connected (step 1), the Pay-with sheet moving between assets and a card (step 2), and the
 * dashboard the tokens land in (step 3).
 *
 * Each scene is laid out in the card's own design coordinates — 774x440, the frame the file gives
 * the card — and `Scene` scales it to whatever the card actually measures. The motion is CSS: a
 * single loop per scene, so nothing has to be started, stopped or torn down when the rail switches
 * cards, and `prefers-reduced-motion` stops all of it in one rule.
 */

const A = {
  logo: '/figma/logo.svg',
  eth: '/figma/coin-eth.svg',
  usdt: '/figma/coin-usdt.svg',
  sol: '/figma/coin-sol.svg',
};

const CURSOR = '<svg viewBox="0 0 24 24"><path d="M0 0L10.5 24L13.7 13.7001L24 10.5L0 0Z" fill="currentColor"/></svg>';
const CHEV =
  '<svg viewBox="0 0 10 10" fill="none"><path d="M3 1.5 6.5 5 3 8.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const TICK =
  '<svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5 6.5 11.5 12.5 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const LOCK =
  '<svg viewBox="0 0 10 11" fill="none"><rect x="1" y="4.5" width="8" height="6" rx="1.5" fill="#7c858d"/><path d="M3 4.5V3a2 2 0 0 1 4 0v1.5" stroke="#7c858d" stroke-width="1.3"/></svg>';

const cur = (cls: string) => `<span class="hbi-cur ${cls}">${CURSOR}</span><span class="hbi-click ${cls}k"></span>`;
const coin = (k: 'eth' | 'usdt' | 'sol', d = 24) => `<img src="${A[k]}" alt="" style="width:${d}px;height:${d}px">`;
/** A browser window, placed by CSS so a phone can re-frame it. */
const win = (cls: string, url: string, page: string) => `
  <div class="hbi-win ${cls}">
    <div class="hbi-win__bar"><span class="hbi-win__dots"><i></i><i></i><i></i></span><span class="hbi-win__url">${LOCK}${url}</span></div>
    <div class="hbi-win__page">${page}</div>
  </div>`;

/** Step 1 — the address types itself in, the page arrives, and the button becomes the address. */
const SITE = () =>
  win(
    's1a',
    '<span class="hbi-type s1a-url">remittixpresale.io</span><i class="hbi-caret s1a-caret"></i>',
    `<div class="s1a-page">
       <div class="hbi-nav">
         <img class="s1a-logo" src="${A.logo}" alt="">
         <span class="hbi-nav__r">
           <span class="hbi-sw hbi-sw--r s1a-cta">
             <span class="hbi-btn s1a-btn">Connect Wallet &amp; Pay ${CHEV}</span>
             <span class="hbi-ch hbi-ch--dark s1a-ok"><span class="hbi-mono">0x74…27e4</span><i class="hbi-dot"></i></span>
           </span>
         </span>
       </div>
       <div class="s1a-h">Buy $RTX before listing.</div>
       <div class="s1a-bars"><i class="hbi-bar8" style="width:100%"></i><i class="hbi-bar8" style="width:72%"></i></div>
       <div class="s1a-chips"><span class="hbi-ch">${coin('eth', 18)}Ethereum · ERC20<i class="hbi-dot"></i></span><span class="hbi-ch"><span class="hbi-mono">1 RTX = $0.0271</span></span></div>
     </div>`,
  ) + cur('s1a-cur');

/** Step 2 — the choice moves from ETH to USDT, then the switch flips and a card form takes over. */
const PAY_WITH = () => `
  <div class="hbi-sheet hbi-sheet--pay">
    <div class="hbi-sheet__h"><span class="hbi-sheet__t">Pay with</span>
      <span class="hbi-seg"><i class="s2a-thumb"></i><span class="s2a-t0">Crypto</span><span class="s2a-t1">Card</span></span></div>
    <div class="s2a-body">
      <div class="s2a-a">
        <span class="hbi-lr s2a-r0"><span class="hbi-rad"></span>${coin('eth')}ETH<small>≈ $2,480 / ETH</small><span class="hbi-mono">2.41</span></span>
        <span class="hbi-lr s2a-r1"><span class="hbi-rad"></span>${coin('usdt')}USDT<small>≈ $1.00</small><span class="hbi-mono">1,204.00</span></span>
        <span class="hbi-lr"><span class="hbi-rad"></span>${coin('sol')}SOL<small>≈ $148 / SOL</small><span class="hbi-mono">38.20</span></span>
      </div>
      <div class="s2a-b">
        <div class="hbi-field hbi-field--card"><span><span class="hbi-field__l">Card number</span><br><span class="hbi-field__v hbi-mono">•••• •••• •••• 4417</span></span><span class="hbi-brands"><i style="background:#1a1f71"></i><i style="background:#eb001b"></i></span></div>
        <div class="hbi-fieldRow"><div class="hbi-field"><span class="hbi-field__l">Expiry</span><br><span class="hbi-field__v hbi-mono">09 / 28</span></div><div class="hbi-field"><span class="hbi-field__l">CVC</span><br><span class="hbi-field__v hbi-mono">•••</span></div></div>
      </div>
    </div>
    <div class="s2a-foot">
      <span>You pay</span>
      <span class="hbi-sw hbi-sw--r s2a-sum"><span><b class="hbi-mono">0.50 ETH</b> → <b class="hbi-mono">18,420 RTX</b></span><span><b class="hbi-mono">500 USDT</b> → <b class="hbi-mono">18,420 RTX</b></span><span><b class="hbi-mono">$1,240.00</b> → <b class="hbi-mono">18,420 RTX</b></span></span>
    </div>
  </div>
  ${cur('s2a-cur')}`;

/** Step 3 — the dashboard: the balance counts up, the allocation turns claimable, Claim is pressed. */
const DASHBOARD = () =>
  win(
    's3c',
    'remittixpresale.io/dashboard',
    `<div class="hbi-dash s3c-page">
       <div class="hbi-dash__side">
         <span class="hbi-dash__brand"><img src="${A.logo}" alt=""></span>
         <nav class="hbi-dash__nav">
           <span class="is-on">Dashboard</span><span>Purchases</span><span>Claim</span><span>Referrals</span>
         </nav>
       </div>
       <div class="hbi-dash__main">
         <div class="hbi-dash__tiles">
           <div class="hbi-tile"><b>RTX balance</b><span class="hbi-mono" data-count="18420">0</span><small>Round 3 · unlocks at launch</small></div>
           <div class="hbi-tile"><b>Total paid</b><span class="hbi-mono">0.50</span><small>ETH · ≈ $1,240.00</small></div>
         </div>
         <div class="hbi-claim">
           <span class="hbi-claim__l">
             <b>Round 3 <i>·</i> <span class="hbi-mono">18,420 RTX</span></b>
             <small>0.50 ETH · 14:04</small>
           </span>
           <span class="hbi-claim__r">
             <span class="hbi-sw s3c-st"><span class="hbi-st hbi-st--grey"><i></i>Pending</span><span class="hbi-st hbi-st--green"><i></i>Claimable</span></span>
             <span class="hbi-btn hbi-btn--sm s3c-btn"><span class="hbi-sw"><span>Claim</span><span class="hbi-done">Claimed ${TICK}</span></span></span>
           </span>
         </div>
       </div>
     </div>`,
  ) + cur('s3c-cur');

const SCENES: Record<string, () => string> = { 'sign-up': SITE, currency: PAY_WITH, claim: DASHBOARD };

/**
 * How long each scene takes to play its story once — the period its own keyframes run on. The
 * section holds a step for exactly this long before moving to the next, so a step is never cut
 * off mid-sentence and never sits idle after finishing.
 */
export const SCENE_MS: Record<string, number> = { 'sign-up': 10000, currency: 12000, claim: 12000 };

/** The desktop canvas — the 774x440 frame the file gives the card. */
const CANVAS_W = 774;
const CANVAS_H = 440;
/**
 * The phone canvas. A phone does not get the desktop scene shrunk — at 294px of card the window
 * would land at 0.4 scale and its own type would be four pixels tall. It gets its own portrait
 * frame instead, which the CSS below re-lays the same parts into: one column, full-width window,
 * no cursor. The art box carries this ratio, so `--k` is always the box over 300.
 */
const PHONE_W = 300;

const LOOP = 12000;
const COUNT_FROM = 0.1;
const COUNT_TO = 0.3;
const ease = (t: number) => 1 - (1 - t) ** 3;

/**
 * Fit the scene's own canvas into the box the card gives it. On a phone the box is the portrait
 * frame, so the fit is simply its width; on desktop the 774x440 canvas is fitted whole.
 */
function useFit(box: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => {
      const { clientWidth: w, clientHeight: h } = el;
      if (!w || !h) return;
      const phone = window.matchMedia('(max-width: 720px)').matches;
      const k = phone ? w / PHONE_W : Math.min(w / CANVAS_W, h / CANVAS_H);
      el.style.setProperty('--k', String(Math.round(k * 1000) / 1000));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [box]);
}

export function StepIllustration({ step }: { step: string }) {
  const box = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  useFit(box);

  // The one figure that counts. It rides the same loop the CSS does, so the two stay in step.
  useEffect(() => {
    const el = scene.current?.querySelector<HTMLElement>('[data-count]');
    if (!el) return;
    const total = Number(el.dataset.count);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = total.toLocaleString('en-US');
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = () => {
      const u = ((performance.now() - t0) / LOOP) % 1;
      const k = Math.min(1, Math.max(0, (u - COUNT_FROM) / (COUNT_TO - COUNT_FROM)));
      const v = Math.round(total * ease(k)).toLocaleString('en-US');
      if (el.textContent !== v) el.textContent = v;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step]);

  const build = SCENES[step];
  if (!build) return null;
  return (
    <div ref={box} className="hb__art" data-step={step} aria-hidden="true">
      {/* Static decorative markup, authored here — no user or network content reaches it. */}
      <div ref={scene} className="hb__scene" dangerouslySetInnerHTML={{ __html: build() }} />
    </div>
  );
}
