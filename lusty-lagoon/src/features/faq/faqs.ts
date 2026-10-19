// Real questions about this product, in place of the Figma's survey questions ("What type of casino
// games do you enjoy the most?"). Answers use the wallet's own methods, fees and times.
export type Faq = { id: string; q: string; a: string };

export const FAQS: Faq[] = [
  {
    id: 'deposit',
    q: 'How do I deposit?',
    a: 'Open Wallet, pick a coin, a card, PayPal or a bank transfer, and follow the steps. Crypto lands after a few network confirmations, usually within minutes. Cards and PayPal land at once.',
  },
  {
    id: 'withdraw-time',
    q: 'How long do withdrawals take?',
    a: 'Every withdrawal passes a short security check first. After that, crypto usually arrives in under 20 minutes, cards within 24 hours, PayPal within 1 day and bank transfers in 1 to 3 days.',
  },
  {
    id: 'coins',
    q: 'Which coins can I use?',
    a: 'Bitcoin, Ethereum, Tether on Tron, Ethereum or BNB Smart Chain, USD Coin on Ethereum or Polygon, Litecoin, XRP, Tron and Dogecoin. Always send on the network the wallet shows, or the coins are lost.',
  },
  {
    id: 'fees',
    q: 'Are there fees?',
    a: 'Cards cost 2.5% and PayPal 3%. A bank transfer is a flat $15. Crypto deposits are free, and crypto withdrawals pay only the network fee, shown before you confirm.',
  },
  {
    id: 'partners',
    q: 'What is a partner platform?',
    a: 'A game platform such as Juwa City, Game Vault or Orion Stars. You play their slots and fish games through your Lusty Lagoon account, with one balance across all of them.',
  },
  {
    id: 'agent',
    q: 'What does Send to agent do?',
    a: 'It moves credit from your balance to an agent, who loads it onto your account on a partner platform. Pick the platform, the agent and the amount, and the credit shows up there.',
  },
  {
    id: 'ranks',
    q: 'How do ranks work?',
    a: 'Every game you play earns points. Bronze turns into Silver at 650,000 points, and each rank unlocks a bigger cash drop, up to $1,000 at the top.',
  },
  {
    id: 'verify',
    q: 'Why do I have to verify my identity?',
    a: 'We check every account once before its first withdrawal, so nobody else can cash out your money. It takes about 2 minutes with a photo ID.',
  },
];
