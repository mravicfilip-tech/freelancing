import { Link } from 'react-router-dom';

// Screens outside the case study. One honest line and a way back, so no click lands nowhere.
export function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="font-display text-32 font-semibold text-ink">{title}</h1>
      <p className="text-16 text-ink2">This screen is not part of the prototype yet.</p>
      <Link to="/wallet/deposit" className="text-16 font-semibold text-accent underline-offset-4 hover:underline">
        Go to the wallet
      </Link>
    </div>
  );
}
