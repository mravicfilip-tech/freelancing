import { Stage } from '../../FigmaFeatures/illustrations/Stage';
import { all, count, one, roll, EASE, RISE } from '../../FigmaFeatures/illustrations/motion';
import type { SceneMotion } from './index';

const R = 86;
const CIRC = 2 * Math.PI * R;
const FILL = 0.62;
/** The stack starts part-built; the loop adds to it. */
const START = 9;
const MAX = 14;

/**
 * Staking: idle RTX put to work. A dial holds the term and the rate, and the position itself is
 * a stack that grows a coin at a time as rewards land, so the picture is accumulation, not a form.
 */
export function Staking() {
  return (
    <Stage id="ec-staking" width={800} height={640} className="ec-il ec-stake">
      <div className="ec-stake__dial" style={{ left: 60, top: 168 }}>
        <svg viewBox="0 0 200 200" width={200} height={200} aria-hidden="true">
          <circle className="ec-stake__track" cx="100" cy="100" r={R} />
          <circle className="ec-stake__arc" cx="100" cy="100" r={R} style={{ strokeDasharray: CIRC, strokeDashoffset: CIRC }} />
        </svg>
        <span className="ec-stake__dialText">
          <b>12.4%</b>
          <small>APY</small>
        </span>
      </div>

      <div className="ec-stake__terms" style={{ left: 296, top: 178 }}>
        <span className="ec-stake__term">
          <small>Term</small>
          <b>90 days</b>
        </span>
        <span className="ec-stake__term">
          <small>Unlocks in</small>
          <b data-count="left">56 days</b>
        </span>
        <span className="ec-stake__term">
          <small>Next reward</small>
          <b className="il-mono" data-count="next">04:12</b>
        </span>
      </div>

      <div className="ec-stake__figure" style={{ left: 296, top: 330 }}>
        <small>Staked position</small>
        <b>
          <span className="il-count" data-count="staked">
            12,500
          </span>{' '}
          RTX
        </b>
        <em>
          <i className="ec-stake__up" />
          <span data-count="reward">+3.42</span> RTX earned today
        </em>
      </div>

      <div className="ec-stake__stack" style={{ left: 606, top: 142 }}>
        {Array.from({ length: MAX }, (_, i) => (
          <i key={i} className="ec-stake__coin" data-coin={i} style={{ bottom: i * 23 }} />
        ))}
      </div>
      <span className="ec-caption" style={{ left: 60, top: 492 }}>
        Stake in one tap · rewards daily · unstake any time
      </span>
    </Stage>
  );
}

export const stakingMotion: SceneMotion = {
  build(tl, il, at, gsap) {
    const coins = all(il, '.ec-stake__coin');
    coins.forEach((c, i) => gsap.set(c, { opacity: i < START ? 1 : 0, scale: 1 }));
    tl.from(one(il, '.ec-stake__dial'), { scale: 0.86, opacity: 0, duration: 0.8, ease: EASE, transformOrigin: '50% 50%' }, at);
    tl.to(one(il, '.ec-stake__arc'), { strokeDashoffset: CIRC * (1 - FILL), duration: 1.3, ease: 'power2.inOut' }, at + 0.25);
    tl.from(one(il, '.ec-stake__dialText'), { ...RISE, y: 8 }, at + 0.6);
    tl.from(all(il, '.ec-stake__term'), { ...RISE, y: 10, stagger: 0.08 }, at + 0.3);
    tl.from(all(il, '.ec-stake__figure > *'), { ...RISE, y: 10, stagger: 0.08 }, at + 0.55);
    count(tl, one(il, '[data-count="staked"]'), 0, 12500, at + 0.6, 1.1, (n) => Math.round(n).toLocaleString('en-US'));
    // The stack builds from the base up.
    tl.from(coins.slice(0, START), { y: -18, opacity: 0, duration: 0.5, ease: EASE, stagger: 0.06 }, at + 0.5);
    tl.from(one(il, '.ec-caption'), { ...RISE, y: 6 }, at + 1.2);
  },
  idle(gsap, il) {
    // Rewards accrue by the second; every few seconds one lands: a coin drops onto the stack, the
    // position takes it and the countdown resets. When the stack tops out it settles back down.
    const coins = all(il, '.ec-stake__coin');
    const staked = one(il, '[data-count="staked"]');
    const reward = one(il, '[data-count="reward"]');
    const next = one(il, '[data-count="next"]');
    const arc = one(il, '.ec-stake__arc');
    let held = START;
    let total = 12500;
    let earned = 3.42;
    let secs = 252;
    let progress = FILL;
    const idle = gsap.timeline();

    const tick = gsap.timeline({ repeat: -1, delay: 0.4 });
    tick.add(() => {
      secs = secs > 0 ? secs - 1 : 300;
      next.textContent = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
      earned = Math.round((earned + 0.01) * 100) / 100;
      reward.textContent = `+${earned.toFixed(2)}`;
    }, 0).to({}, { duration: 0.5 }, 0);
    idle.add(tick, 0);

    const land = gsap.timeline({ repeat: -1, repeatDelay: 3.2, delay: 2.2 });
    land.add(() => {
      const beat = gsap.timeline();
      if (held < coins.length) {
        const coin = coins[held];
        held += 1;
        beat.fromTo(coin, { opacity: 0, y: -46 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0);
        beat.to(coins.slice(0, held - 1), { y: 2, duration: 0.14, yoyo: true, repeat: 1, ease: 'sine.inOut', stagger: { each: 0.015, from: 'end' } }, 0.5);
      } else {
        // Settle: the stack pays out and starts again, so the loop never runs off the top.
        beat.to([...coins].reverse().slice(0, coins.length - START), { opacity: 0, y: -20, duration: 0.35, ease: 'power2.in', stagger: 0.05 }, 0);
        beat.add(() => { held = START; }, 0.6);
      }
      beat.add(() => {
        total = Math.round(total + earned);
        roll(gsap, staked, total.toLocaleString('en-US'));
        gsap.fromTo(staked, { color: '#4042d1' }, { color: '#2c2e31', duration: 1.2, ease: 'power1.out', delay: 0.3 });
        earned = 0;
        reward.textContent = '+0.00';
        secs = 300;
        progress = progress >= 0.97 ? FILL : progress + 0.02;
        gsap.to(arc, { strokeDashoffset: CIRC * (1 - progress), duration: 0.9, ease: 'power2.inOut' });
      }, 0.45);
    }, 0);
    land.to({}, { duration: 0.1 }, 0);
    idle.add(land, 0);
    return idle;
  },
};
