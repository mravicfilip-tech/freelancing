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

const CURSOR = '<svg viewBox="0 0 24 24"><path d="M0 0L10.5 24L13.7 13.7001L24 10.5L0 0Z" fill="#4042D2"/></svg>';
const CHEV =
  '<svg viewBox="0 0 10 10" fill="none"><path d="M3 1.5 6.5 5 3 8.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const TICK =
  '<svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5 6.5 11.5 12.5 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const LOCK =
  '<svg viewBox="0 0 10 11" fill="none"><rect x="1" y="4.5" width="8" height="6" rx="1.5" fill="#7c858d"/><path d="M3 4.5V3a2 2 0 0 1 4 0v1.5" stroke="#7c858d" stroke-width="1.3"/></svg>';

const cur = (cls: string) => `<span class="hbi-cur ${cls}">${CURSOR}</span><span class="hbi-click ${cls}k"></span>`;
const coin = (k: 'eth' | 'usdt' | 'sol', d = 24) => `<img src="${A[k]}" alt="" style="width:${d}px;height:${d}px">`;
/** A browser window at the card's own left edge, holding a page. */
const win = (cls: string, url: string, page: string) => `
  <div class="hbi-win ${cls}" style="left:107px;top:142px">
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
         <img src="${A.logo}" alt="" style="width:33px;height:17px;display:block">
         <span class="hbi-nav__r">
           <span class="hbi-sw hbi-sw--r" style="height:40px">
             <span class="hbi-btn s1a-btn">Connect Wallet &amp; Pay ${CHEV}</span>
             <span class="hbi-ch hbi-ch--dark s1a-ok" style="height:40px"><span class="hbi-mono" style="font-size:14px">0x74…27e4</span><i class="hbi-dot"></i></span>
           </span>
         </span>
       </div>
       <div style="margin-top:30px;font-weight:500;font-size:22px;letter-spacing:-.6px;color:var(--ink)">Buy $RTX before listing.</div>
       <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px;width:320px"><i class="hbi-bar8" style="width:100%"></i><i class="hbi-bar8" style="width:72%"></i></div>
       <div style="margin-top:22px;display:flex;gap:8px"><span class="hbi-ch">${coin('eth', 18)}Ethereum · ERC20<i class="hbi-dot"></i></span><span class="hbi-ch"><span class="hbi-mono" style="font-size:13px">1 RTX = $0.0271</span></span></div>
     </div>`,
  ) + cur('s1a-cur');

/** Step 2 — the choice moves from ETH to USDT, then the switch flips and a card form takes over. */
const PAY_WITH = () => `
  <div class="hbi-sheet" style="left:107px;top:142px;width:560px;padding:20px">
    <div class="hbi-sheet__h"><span class="hbi-sheet__t">Pay with</span>
      <span class="hbi-seg"><i class="s2a-thumb"></i><span class="s2a-t0">Crypto</span><span class="s2a-t1">Card</span></span></div>
    <div style="position:relative;height:150px;margin-top:14px">
      <div class="s2a-a" style="position:absolute;inset:0;display:flex;flex-direction:column;gap:2px">
        <span class="hbi-lr s2a-r0"><span class="hbi-rad"></span>${coin('eth')}ETH<small>≈ $2,480 / ETH</small><span class="hbi-mono">2.41</span></span>
        <span class="hbi-lr s2a-r1"><span class="hbi-rad"></span>${coin('usdt')}USDT<small>≈ $1.00</small><span class="hbi-mono">1,204.00</span></span>
        <span class="hbi-lr"><span class="hbi-rad"></span>${coin('sol')}SOL<small>≈ $148 / SOL</small><span class="hbi-mono">38.20</span></span>
      </div>
      <div class="s2a-b" style="position:absolute;inset:0;display:flex;flex-direction:column;gap:10px;opacity:0">
        <div class="hbi-field" style="display:flex;align-items:center;justify-content:space-between"><span><span class="hbi-field__l">Card number</span><br><span class="hbi-field__v hbi-mono">•••• •••• •••• 4417</span></span><span style="display:inline-flex;gap:4px"><i style="width:22px;height:14px;border-radius:3px;background:#1a1f71"></i><i style="width:22px;height:14px;border-radius:3px;background:#eb001b"></i></span></div>
        <div style="display:flex;gap:10px"><div class="hbi-field" style="flex:1"><span class="hbi-field__l">Expiry</span><br><span class="hbi-field__v hbi-mono">09 / 28</span></div><div class="hbi-field" style="flex:1"><span class="hbi-field__l">CVC</span><br><span class="hbi-field__v hbi-mono">•••</span></div></div>
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;padding-top:14px;border-top:1px solid #eef0f3;font-size:13px;color:var(--muted)">
      <span>You pay</span>
      <span class="hbi-sw hbi-sw--r s2a-sum" style="font-weight:600;color:var(--ink)"><span><b class="hbi-mono">0.50 ETH</b> → <b class="hbi-mono">18,420 RTX</b></span><span><b class="hbi-mono">500 USDT</b> → <b class="hbi-mono">18,420 RTX</b></span><span><b class="hbi-mono">$1,240.00</b> → <b class="hbi-mono">18,420 RTX</b></span></span>
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
         <span class="hbi-dash__brand"><img src="${A.logo}" alt=""><em>Remittix</em></span>
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
             <span class="hbi-btn hbi-btn--sm s3c-btn"><span class="hbi-sw"><span>Claim</span><span style="display:inline-flex;align-items:center;gap:6px">Claimed ${TICK}</span></span></span>
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

/** The dashboard's balance, counted on the scene's own 12s loop rather than a second timeline. */
/** The subject — window or sheet — plus a margin, for the phone fit. */
const SUBJECT_W = 680;

const LOOP = 12000;
const COUNT_FROM = 0.1;
const COUNT_TO = 0.3;
const ease = (t: number) => 1 - (1 - t) ** 3;

/**
 * A fixed 774x440 canvas fitted into the card. Desktop cards are the design's own height, so the
 * scene sits at 1:1; a phone's card is far narrower than 774, where fitting by width would leave
 * the scene unreadably small — there it fits by height instead and the card clips the sides.
 */
function useFit(box: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => {
      const { clientWidth: w, clientHeight: h } = el;
      if (!w || !h) return;
      // Every scene's subject is the 560-wide window or sheet at x=107; the rest of the canvas is
      // margin. A phone fits that subject rather than the whole canvas, so the scene stays whole
      // and legible instead of being cropped or shrunk to nothing.
      const narrow = window.matchMedia('(max-width: 720px)').matches;
      const k = narrow ? w / SUBJECT_W : Math.min(w / 774, h / 440);
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
