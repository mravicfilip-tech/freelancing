// Mock data for the account settings page. Values follow the Figma frames, with the copy
// rewritten into plain sentences and the glossary words.

export type SectionId = 'account' | 'preferences' | 'payments';

export const SECTIONS: { id: SectionId; title: string }[] = [
  { id: 'account', title: 'Account information' },
  { id: 'preferences', title: 'Preferences and notifications' },
  { id: 'payments', title: 'Payment settings' },
];

export type ProfileForm = {
  username: string;
  email: string;
  phone: string;
  fullName: string;
};

export type PreferencesForm = {
  language: string;
  timeZone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  promoOffers: boolean;
  gameAlerts: boolean;
  showNameOnWins: boolean;
};

export type PaymentsForm = {
  defaultPayment: string;
  depositLimit: number;
  withdrawalLimit: number;
  confirmWithdrawals: boolean;
};

export const INITIAL_PROFILE: ProfileForm = {
  username: 'JohnD',
  email: 'john.dickering@gmail.com',
  phone: '+38169283214',
  fullName: 'John Dickering',
};

export const INITIAL_PREFERENCES: PreferencesForm = {
  language: 'sr',
  timeZone: 'cet',
  emailNotifications: true,
  pushNotifications: true,
  promoOffers: false,
  gameAlerts: false,
  showNameOnWins: true,
};

export const INITIAL_PAYMENTS: PaymentsForm = {
  defaultPayment: 'paypal',
  depositLimit: 1350,
  withdrawalLimit: 1350,
  confirmWithdrawals: true,
};

export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'sr', label: 'Serbian' },
  { value: 'es', label: 'Spanish' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
];

export const TIME_ZONES = [
  { value: 'utc', label: 'UTC' },
  { value: 'wet', label: 'Lisbon, WET (UTC+0)' },
  { value: 'cet', label: 'Belgrade, CET (UTC+1)' },
  { value: 'eet', label: 'Athens, EET (UTC+2)' },
  { value: 'est', label: 'New York, EST (UTC-5)' },
  { value: 'pst', label: 'Los Angeles, PST (UTC-8)' },
];

export const DEFAULT_PAYMENTS = [
  { value: 'paypal', label: 'PayPal, john.d@gmail.com' },
  { value: 'visa', label: 'Visa ending 4821' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'wire', label: 'Wire transfer' },
  { value: 'usdt', label: 'Tether USDT on Tron (TRC20)' },
];

export const LIMIT_MAX = 5000;
export const LIMIT_STEP = 50;

export const ACCOUNT_FAQS = [
  {
    id: 'personal',
    q: 'How can I update my personal information, such as my email or phone number?',
    a: 'Open Account information above, change the field you need and select Save changes. A new email address needs to be confirmed from the link we send to it.',
  },
  {
    id: 'payment',
    q: 'How do I change my default payment method?',
    a: 'Open Payment settings above, choose a new option under Default payment and select Save changes. Deposits and withdrawals then start with that method.',
  },
  {
    id: 'notifications',
    q: 'Can I turn notifications on or off?',
    a: 'Yes. Open Preferences and notifications, switch email, push, promo offers or game alerts on or off, then select Save changes. Security sign-in alerts always stay on.',
  },
  {
    id: 'limits',
    q: 'How can I set deposit or session time limits for responsible play?',
    a: 'Open Payment settings and move the Deposit limit or Withdrawal limit slider. A lower limit applies at once. A higher limit applies after 24 hours.',
  },
  {
    id: 'unauthorized',
    q: 'What should I do if I suspect unauthorized access to my account?',
    a: 'Change your password at once and check your latest sign-ins in Notifications. If anything looks wrong, contact support and we will lock the account while we look into it.',
  },
];

export const AVATAR_MAX_BYTES = 500 * 1024;
export const AVATAR_MAX_PX = 2000;
