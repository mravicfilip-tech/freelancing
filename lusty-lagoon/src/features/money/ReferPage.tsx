import { useEffect, useMemo, useRef, useState } from 'react';
import { Gift, Handshake, UsersThree, WarningCircle, Wallet } from '@phosphor-icons/react';
import { siFacebook, siWhatsapp } from 'simple-icons';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { CopyField } from '../../components/ui/CopyField';
import { Message } from '../../components/ui/Message';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { StatusChip } from '../../components/ui/StatusChip';
import { formatAmount, formatDate } from '../../lib/format';
import { FRIENDS, REFERRAL, STATUS_NOTE, largeFriends, shareUrls, type Friend } from './referData';
import { initialsOf, useViewSwitch, wait } from './shared';

// Refer a friend, Figma 374:2857. The character art stays small and in the hero only, per the
// taste log. ?state=loading|error|empty|large reaches the other states for the shots.

const PAGE = 10;

const STEPS = [
  { title: 'Share your link', body: 'Send it on Facebook or WhatsApp, or give your friend the code to type in at sign-up.' },
  { title: 'Your friend signs up', body: `They register with your link or code and make a first deposit of at least ${REFERRAL.minDeposit} ${REFERRAL.currency}.` },
  { title: 'You both get paid', body: 'Your reward lands in your balance the moment their deposit clears. There is no limit on friends.' },
];

function ShareButton({ label, href, path, hex }: { label: string; href: string; path: string; hex: string }) {
  return (
    <Button asChild variant="secondary" size="lg" className="flex-1">
      <a href={href} target="_blank" rel="noreferrer noopener">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
          <path d={path} fill={`#${hex}`} />
        </svg>
        Invite with {label}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </Button>
  );
}

function ShareBlock({ status, onRetry }: { status: 'ready' | 'loading' | 'error'; onRetry: () => void }) {
  const urls = shareUrls(REFERRAL.link);
  if (status === 'loading') {
    return (
      <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading your referral link">
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
      </div>
    );
  }
  if (status === 'error') {
    return (
      <Message
        className="items-start px-0 py-6 text-left"
        icon={<WarningCircle weight="fill" className="h-10 w-10 text-danger" aria-hidden />}
        title="We could not load your referral link"
        body="Your friends and your rewards are safe. Check your connection, then try again."
        action={
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        }
      />
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <CopyField label="Your referral link" value={REFERRAL.link} />
      <CopyField label="Your referral code" value={REFERRAL.code} />
      <div className="flex gap-3">
        <ShareButton label="Facebook" href={urls.Facebook} path={siFacebook.path} hex={siFacebook.hex} />
        <ShareButton label="WhatsApp" href={urls.WhatsApp} path={siWhatsapp.path} hex={siWhatsapp.hex} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-line bg-sunken px-4 py-3">
      <dt className="text-14 text-ink2">{label}</dt>
      <dd className="num text-20 font-semibold text-ink">{value}</dd>
    </div>
  );
}

function FriendsTable({ friends, status, onRetry }: { friends: Friend[]; status: 'ready' | 'loading' | 'error'; onRetry: () => void }) {
  const [shown, setShown] = useState(PAGE);
  const visible = friends.slice(0, shown);

  if (status === 'error') {
    return (
      <Message
        icon={<WarningCircle weight="fill" className="h-10 w-10 text-danger" aria-hidden />}
        title="We could not load your friends"
        body="Your earnings are safe. Check your connection, then try again."
        action={
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        }
      />
    );
  }
  if (status === 'ready' && friends.length === 0) {
    return (
      <Message
        icon={<UsersThree weight="fill" className="h-10 w-10 text-ink3" aria-hidden />}
        title="No friends yet"
        body={`Share your link above. Each friend who deposits ${REFERRAL.minDeposit} ${REFERRAL.currency} or more earns you ${REFERRAL.playerReward} ${REFERRAL.currency}.`}
      />
    );
  }
  return (
    <>
      <table className="w-full table-fixed border-collapse text-left">
        <caption className="sr-only">Friends you referred, newest first</caption>
        <thead className="bg-sunken">
          <tr className="text-14 font-medium text-ink3">
            <th scope="col" className="h-11 w-1/3 px-6">Friend</th>
            <th scope="col" className="h-11 px-4">Date referred</th>
            <th scope="col" className="h-11 px-4">Joined with</th>
            <th scope="col" className="h-11 px-4 text-right">Earned</th>
            <th scope="col" className="h-11 w-1/4 px-6">Status</th>
          </tr>
        </thead>
        <tbody>
          {status === 'loading'
            ? Array.from({ length: 5 }, (_, i) => (
                <tr key={i} className="border-t border-line">
                  {[0, 1, 2, 3, 4].map((j) => (
                    <td key={j} className={j === 0 || j === 4 ? 'px-6 py-4' : 'px-4 py-4'}>
                      <Skeleton className="h-5 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            : visible.map((f) => {
                const d = formatDate(f.date);
                return (
                  <tr key={f.id} className="border-t border-line transition-colors hover:bg-raised">
                    <td className="px-6 py-3">
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar initials={initialsOf(f.name)} size="sm" />
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate text-16 text-ink" title={f.name}>{f.name}</span>
                          <span className="truncate text-14 text-ink3" title={f.email}>{f.email}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex flex-col">
                        <span className="num text-16 text-ink">{d.day}</span>
                        <span className="num text-14 text-ink3">{d.time}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-16 text-ink">{f.via}</td>
                    <td className="num px-4 py-3 text-right text-16 font-semibold">
                      {f.earned > 0 ? <span className="text-success">+{formatAmount(f.earned)} USDT</span> : <span className="text-ink3">0.00 USDT</span>}
                    </td>
                    <td className="px-6 py-3">
                      <span className="flex min-w-0 flex-col items-start gap-1">
                        <StatusChip status={f.status} />
                        <span className="text-14 text-ink3">{STATUS_NOTE[f.status]}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
        </tbody>
      </table>
      {status === 'ready' && friends.length > PAGE && (
        <div className="flex items-center justify-between gap-4 border-t border-line px-6 py-4">
          <p className="num text-14 text-ink2" aria-live="polite">
            Showing {Math.min(shown, friends.length)} of {friends.length}
          </p>
          {shown < friends.length && (
            <Button variant="secondary" onClick={() => setShown((n) => n + PAGE)}>
              Show {Math.min(PAGE, friends.length - shown)} more
            </Button>
          )}
        </div>
      )}
    </>
  );
}

export function ReferPage() {
  const view = useViewSwitch();
  const [status, setStatus] = useState<'ready' | 'loading' | 'error'>(view === 'loading' ? 'loading' : view === 'error' ? 'error' : 'ready');
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const friends = useMemo(() => (view === 'empty' ? [] : view === 'large' ? largeFriends() : FRIENDS), [view]);

  const retry = async () => {
    setStatus('loading');
    await wait(900);
    if (alive.current) setStatus('ready');
  };

  const paid = friends.filter((f) => f.status === 'completed');
  const total = paid.reduce((n, f) => n + f.earned, 0);
  const waiting = friends.filter((f) => f.status === 'pending').length;

  return (
    <div className="flex flex-col gap-12">
      <section aria-labelledby="refer-title" className="grid grid-cols-12 items-stretch overflow-hidden rounded-2xl border border-line bg-panel">
        <div className="col-span-8 flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-2">
            <h1 id="refer-title" className="font-display text-32 font-semibold text-ink">
              Refer a friend
            </h1>
            <p className="max-w-xl text-16 text-ink2">
              Earn {REFERRAL.playerReward} {REFERRAL.currency} for each friend who signs up with your link and makes a first deposit. The more friends you bring, the more you earn.
            </p>
          </div>
          <ShareBlock status={status === 'error' ? 'error' : status} onRetry={retry} />
        </div>
        <div className="relative col-span-4 border-l border-line bg-sunken">
          <div className="absolute inset-x-0 bottom-0 top-6">
            <img src="/art/money/refer-megaphone.webp" alt="" width={452} height={640} className="h-full w-full object-contain object-bottom" />
          </div>
        </div>
      </section>

      <section aria-labelledby="how-title" className="grid grid-cols-12 items-start gap-6">
        <div className="col-span-7 flex flex-col gap-6">
          <SectionHeader id="how-title" title="How it works" />
          <ol className="flex flex-col gap-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex items-start gap-4 rounded-xl border border-line bg-panel p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-accent text-14 font-semibold text-ink">{i + 1}</span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-16 font-semibold text-ink">{s.title}</h3>
                  <p className="text-14 text-ink2">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="col-span-5 flex flex-col gap-6">
          <SectionHeader title="What each of you gets" />
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-4 rounded-xl border border-line bg-panel p-4">
              <Wallet weight="fill" className="h-6 w-6 shrink-0 text-accent" aria-hidden />
              <div className="flex flex-col gap-1">
                <h3 className="text-16 font-semibold text-ink">You get {REFERRAL.playerReward} {REFERRAL.currency}</h3>
                <p className="text-14 text-ink2">For each friend who deposits {REFERRAL.minDeposit} {REFERRAL.currency} or more. It goes straight to your account balance.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-xl border border-line bg-panel p-4">
              <Gift weight="fill" className="h-6 w-6 shrink-0 text-accent" aria-hidden />
              <div className="flex flex-col gap-1">
                <h3 className="text-16 font-semibold text-ink">Your friend gets {REFERRAL.friendBonusPct}% on their first deposit</h3>
                <p className="text-14 text-ink2">It is the sign-up bonus, added to the deposit they make after joining with your link.</p>
              </div>
            </div>
            <p className="flex items-center gap-2 text-14 text-ink2">
              <Handshake className="h-5 w-5 shrink-0 text-ink3" aria-hidden />
              Friends who already have an account do not count.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="friends-title" className="flex flex-col gap-4">
        <SectionHeader id="friends-title" title="Friends you referred" />
        {status === 'ready' && friends.length > 0 && (
          <dl className="grid grid-cols-3 gap-4">
            <Stat label="Friends referred" value={String(friends.length)} />
            <Stat label="Earned" value={`${formatAmount(total)} USDT`} />
            <Stat label="Waiting for a deposit" value={String(waiting)} />
          </dl>
        )}
        <div className="overflow-hidden rounded-2xl border border-line bg-panel">
          <FriendsTable friends={friends} status={status} onRetry={retry} />
        </div>
      </section>
    </div>
  );
}
