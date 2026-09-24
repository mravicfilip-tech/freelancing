import { NavDropdown } from '../site/NavDropdown';
import { EDUCATION_CENTRE_MENU } from '../site/navigation';

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
        <NavDropdown label="Education Centre" items={EDUCATION_CENTRE_MENU} className="nav-menu" />
      </nav>
      <a className="btn btn--small" href="#presale">Join the presale</a>
    </header>
  );
}
