export function Nav() {
  return (
    <header className="nav">
      <a className="nav__brand" href="/">
        <span className="nav__mark" aria-hidden="true" />
        Remittix
      </a>
      <nav className="nav__links" aria-label="Primary">
        <a href="#how">How it works</a>
        <a href="#coverage">Coverage</a>
        <a href="#tokenomics">Tokenomics</a>
        <a href="#faq">FAQ</a>
      </nav>
      <a className="nav__cta" href="#presale">Connect wallet</a>
    </header>
  );
}
