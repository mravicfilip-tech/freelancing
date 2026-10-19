import { useCallback, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SignOut } from '@phosphor-icons/react';
import { Accordion, AccordionItem } from '../../components/ui/Accordion';
import { Button } from '../../components/ui/Button';
import { Callout } from '../../components/ui/Callout';
import { Checkbox } from '../../components/ui/Checkbox';
import { Field } from '../../components/ui/Field';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { Switch } from '../../components/ui/Switch';
import {
  ACCOUNT_FAQS,
  DEFAULT_PAYMENTS,
  INITIAL_PAYMENTS,
  INITIAL_PREFERENCES,
  INITIAL_PROFILE,
  LANGUAGES,
  LIMIT_MAX,
  LIMIT_STEP,
  SECTIONS,
  TIME_ZONES,
  type PaymentsForm,
  type PreferencesForm,
  type ProfileForm,
  type SectionId,
} from './data';
import { useDemoState } from './demoState';
import { FileDrop, LimitSlider, SaveBar, type SaveStatus } from './parts';

// Route /account. ?section=account|preferences|payments opens a section. ?state=loading shows the
// sections while they load, ?state=error makes every save fail, ?state=saved opens with a saved result.

const isSection = (v: string | null): v is SectionId => SECTIONS.some((s) => s.id === v);

function useSave(initial: SaveStatus, fails: boolean) {
  const [status, setStatus] = useState<SaveStatus>(initial);
  const save = useCallback(
    (valid = true) => {
      if (!valid) return;
      setStatus('saving');
      window.setTimeout(() => setStatus(fails ? 'error' : 'saved'), 700);
    },
    [fails],
  );
  return { status, save, reset: () => setStatus('idle') };
}

function SectionSkeleton() {
  return (
    <div role="status" aria-label="Loading settings" className="flex flex-col gap-6">
      <Skeleton className="h-6 w-1/4" />
      <Skeleton className="h-24 w-full" />
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
      </div>
      <Skeleton className="h-10 w-36" />
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-18 font-semibold text-ink">{title}</h4>
      {children}
    </div>
  );
}

function ProfileSection({ value, onChange, loading, initial, fails }: { value: ProfileForm; onChange: (v: ProfileForm) => void; loading: boolean; initial: SaveStatus; fails: boolean }) {
  const { status, save, reset } = useSave(initial, fails);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({});
  if (loading) return <SectionSkeleton />;

  const set = (k: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, [k]: e.target.value });
    reset();
  };

  const submit = () => {
    const next: typeof errors = {};
    if (value.username.trim().length < 3) next.username = 'Use at least 3 characters for your username.';
    if (!/^\S+@\S+\.\S+$/.test(value.email)) next.email = 'Enter an email address like name@example.com.';
    if (!/^\+?[0-9 ]{7,16}$/.test(value.phone)) next.phone = 'Enter your phone number with the country code, such as +38169283214.';
    if (value.fullName.trim().length === 0) next.fullName = 'Enter your first and last name.';
    setErrors(next);
    save(Object.keys(next).length === 0);
  };

  return (
    <div className="flex flex-col gap-6">
      <Block title="Set up your account">
        <FileDrop hint="PNG, JPG or WebP, up to 500 KB and 2000 by 2000 px." />
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Username" value={value.username} onChange={set('username')} error={errors.username} autoComplete="username" />
          <Field label="Email" type="email" value={value.email} onChange={set('email')} error={errors.email} autoComplete="email" hint="We send a confirmation link when you change it." />
          <Field label="Phone number" type="tel" value={value.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" />
          <Field label="First and last name" value={value.fullName} onChange={set('fullName')} error={errors.fullName} autoComplete="name" />
        </div>
      </Block>
      <SaveBar status={status} onSave={submit} />
    </div>
  );
}

function PreferencesSection({ value, onChange, loading, initial, fails }: { value: PreferencesForm; onChange: (v: PreferencesForm) => void; loading: boolean; initial: SaveStatus; fails: boolean }) {
  const { status, save, reset } = useSave(initial, fails);
  if (loading) return <SectionSkeleton />;

  const set = <K extends keyof PreferencesForm>(k: K, v: PreferencesForm[K]) => {
    onChange({ ...value, [k]: v });
    reset();
  };

  return (
    <div className="flex flex-col gap-6">
      <Block title="Set up your preferences">
        <div className="grid grid-cols-2 gap-6">
          <Select label="Language" options={LANGUAGES} value={value.language} onValueChange={(v) => set('language', v)} />
          <Select label="Time zone" options={TIME_ZONES} value={value.timeZone} onValueChange={(v) => set('timeZone', v)} />
        </div>
      </Block>
      <Block title="Choose what we tell you about">
        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
          <Switch label="Email notifications" description="Receipts and account news." checked={value.emailNotifications} onCheckedChange={(c) => set('emailNotifications', c)} />
          <Switch label="Push notifications" description="Deposits, withdrawals and sign-ins." checked={value.pushNotifications} onCheckedChange={(c) => set('pushNotifications', c)} />
          <Switch label="Promo offers" description="Bonuses and giveaways." checked={value.promoOffers} onCheckedChange={(c) => set('promoOffers', c)} />
          <Switch label="Game alerts" description="New slots and tournaments." checked={value.gameAlerts} onCheckedChange={(c) => set('gameAlerts', c)} />
        </div>
        <Checkbox label="Show my username in the live wins list" checked={value.showNameOnWins} onCheckedChange={(c) => set('showNameOnWins', c === true)} />
      </Block>
      <SaveBar status={status} onSave={() => save()} />
    </div>
  );
}

function PaymentsSection({ value, onChange, loading, initial, fails }: { value: PaymentsForm; onChange: (v: PaymentsForm) => void; loading: boolean; initial: SaveStatus; fails: boolean }) {
  const { status, save, reset } = useSave(initial, fails);
  if (loading) return <SectionSkeleton />;

  const set = <K extends keyof PaymentsForm>(k: K, v: PaymentsForm[K]) => {
    onChange({ ...value, [k]: v });
    reset();
  };

  return (
    <div className="flex flex-col gap-6">
      <Block title="Set up your payments">
        <Select label="Default payment" options={DEFAULT_PAYMENTS} value={value.defaultPayment} onValueChange={(v) => set('defaultPayment', v)} />
        <div className="grid grid-cols-2 gap-6">
          <LimitSlider label="Deposit limit" max={LIMIT_MAX} step={LIMIT_STEP} value={value.depositLimit} onChange={(n) => set('depositLimit', n)} />
          <LimitSlider label="Withdrawal limit" max={LIMIT_MAX} step={LIMIT_STEP} value={value.withdrawalLimit} onChange={(n) => set('withdrawalLimit', n)} />
        </div>
        <Callout>
          <p>A lower limit applies at once. A higher limit applies after 24 hours, so you have time to change your mind.</p>
        </Callout>
        <Checkbox label="Ask me to confirm by email before each withdrawal" checked={value.confirmWithdrawals} onCheckedChange={(c) => set('confirmWithdrawals', c === true)} />
      </Block>
      <SaveBar status={status} onSave={() => save()} />
    </div>
  );
}

export function AccountPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const demo = useDemoState();
  const loading = demo === 'loading';
  const fails = demo === 'error';
  const initial: SaveStatus = demo === 'saved' ? 'saved' : fails ? 'error' : 'idle';

  const sectionParam = params.get('section');
  const open: SectionId | '' = isSection(sectionParam) ? sectionParam : sectionParam === 'none' ? '' : 'account';
  const setOpen = (v: string) => {
    const next = new URLSearchParams(params);
    next.set('section', v || 'none');
    setParams(next, { replace: true });
  };

  // The forms live here, so a half edited section keeps its values while another one is open.
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [prefs, setPrefs] = useState(INITIAL_PREFERENCES);
  const [pay, setPay] = useState(INITIAL_PAYMENTS);

  return (
    <div className="flex max-w-5xl flex-col gap-12" aria-busy={loading || undefined}>
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-32 font-semibold text-ink">Account settings</h1>
        <h2 className="sr-only">Settings sections</h2>
        <div className="rounded-2xl border border-line bg-panel px-6">
          <Accordion type="single" collapsible value={open} onValueChange={setOpen}>
            <AccordionItem value="account" title={SECTIONS[0].title}>
              <div className="-mr-12 pt-2">
                <ProfileSection value={profile} onChange={setProfile} loading={loading} initial={open === 'account' ? initial : 'idle'} fails={fails} />
              </div>
            </AccordionItem>
            <AccordionItem value="preferences" title={SECTIONS[1].title}>
              <div className="-mr-12 pt-2">
                <PreferencesSection value={prefs} onChange={setPrefs} loading={loading} initial={open === 'preferences' ? initial : 'idle'} fails={fails} />
              </div>
            </AccordionItem>
            <AccordionItem value="payments" title={SECTIONS[2].title}>
              <div className="-mr-12 pt-2">
                <PaymentsSection value={pay} onChange={setPay} loading={loading} initial={open === 'payments' ? initial : 'idle'} fails={fails} />
              </div>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      <section aria-labelledby="account-faq" className="flex flex-col gap-4">
        <SectionHeader id="account-faq" title="Frequently asked questions" />
        <div className="rounded-2xl border border-line bg-panel px-6">
          <Accordion type="single" collapsible defaultValue="payment">
            {ACCOUNT_FAQS.map((f) => (
              <AccordionItem key={f.id} value={f.id} title={f.q}>
                {f.a}
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <div>
        <Button variant="secondary" size="lg" onClick={() => navigate('/login')}>
          <SignOut className="h-5 w-5" aria-hidden />
          Log out
        </Button>
      </div>
    </div>
  );
}
