/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Where the RTX Earn tester sign-up POSTs its JSON (see TesterSignup.tsx). Unset, the form cannot send. */
  readonly VITE_EARN_TESTERS_ENDPOINT?: string;
}
