/** The three ways in, drawn small in their own colours on the nav set's 24 grid. */
export type Provider = 'metamask' | 'walletconnect' | 'trust';

export const PROVIDERS: { id: Provider; name: string; kind: string }[] = [
  { id: 'metamask', name: 'MetaMask', kind: 'Browser wallet' },
  { id: 'walletconnect', name: 'WalletConnect', kind: 'Mobile wallets' },
  { id: 'trust', name: 'Trust Wallet', kind: 'QR or mobile' },
];

export function WalletMark({ id, className = 'icon-22' }: { id: Provider; className?: string }) {
  if (id === 'metamask') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 4.5 10.2 9.6l-1.3 3.2L3 4.5Z" fill="#E2761B" />
        <path d="M21 4.5 13.8 9.6l1.3 3.2L21 4.5Z" fill="#E4761B" />
        <path d="M10.2 9.6h3.6l1.3 3.2-1 3.5H9.9l-1-3.5 1.3-3.2Z" fill="#F6851B" />
        <path d="M8.9 12.8 5.6 14.4l1.1 3.5 3.2-1.6-1-3.5ZM15.1 12.8l3.3 1.6-1.1 3.5-3.2-1.6 1-3.5Z" fill="#CD6116" />
        <path d="M9.9 16.3h4.2l-.5 2.4H10.4l-.5-2.4Z" fill="#763D16" />
        <path d="M10.6 13.4a.8.8 0 1 1 1.6 0 .8.8 0 0 1-1.6 0ZM11.8 13.4a.8.8 0 1 1 1.6 0 .8.8 0 0 1-1.6 0Z" fill="#161616" />
      </svg>
    );
  }
  if (id === 'walletconnect') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 10.2c3.3-3.2 8.7-3.2 12 0l.4.4a.4.4 0 0 1 0 .6l-1.4 1.3a.2.2 0 0 1-.3 0l-.5-.5c-2.3-2.3-6.1-2.3-8.4 0l-.6.6a.2.2 0 0 1-.3 0L5.5 11.2a.4.4 0 0 1 0-.6l.5-.4Zm14.8 2.7 1.2 1.2a.4.4 0 0 1 0 .6l-5.5 5.4a.4.4 0 0 1-.6 0l-3.9-3.8a.1.1 0 0 0-.2 0L8 20.1a.4.4 0 0 1-.6 0L2 14.7a.4.4 0 0 1 0-.6l1.2-1.2a.4.4 0 0 1 .6 0l3.9 3.8a.1.1 0 0 0 .2 0l3.9-3.8a.4.4 0 0 1 .6 0l3.9 3.8a.1.1 0 0 0 .2 0l3.9-3.8a.4.4 0 0 1 .6 0Z" fill="#3B99FC" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3c2.6 2.2 5.1 3.1 7.5 3 .3 6.6-2.2 11.6-7.5 15C6.7 17.6 4.2 12.6 4.5 6c2.4.1 4.9-.8 7.5-3Z" fill="#0500FF" />
      <path d="M12 3c2.6 2.2 5.1 3.1 7.5 3 .3 6.6-2.2 11.6-7.5 15V3Z" fill="#48FF91" />
    </svg>
  );
}
